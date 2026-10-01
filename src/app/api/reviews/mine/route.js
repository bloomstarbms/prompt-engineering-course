import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabaseAdmin';
import { REVIEWS_ENABLED } from '@/lib/docs';
import { PRIVACY_UPDATED } from '@/content/legal';
import {
  ATTRIBUTIONS, displayNameFor, cleanBody, bodyProblem, normalizeReview,
} from '@/lib/reviewRules';

/**
 * /api/reviews/mine — the signed-in person's own review.
 *
 *   GET     { eligible, certName, review }   eligible = holds a certificate
 *   POST    { body, attribution }    submit, or resubmit (overwrites, re-pends)
 *   DELETE                           withdraw
 *
 * The browser never touches public.reviews (migration 014 grants it to the
 * service role alone); this route is the only write path for authors, and
 * /api/admin/reviews the only one for moderation.
 *
 * ─── WHAT THE SERVER DECIDES, AND WHAT THE CALLER CANNOT ─────────────────
 *   who       from a verified bearer token, as /api/certificates/issue does.
 *             A user_id in the body is ignored.
 *   eligible  a certificates row for that user. Not progress, not the UI's
 *             opinion: the certificate is the thing that makes someone a
 *             graduate, and it is server-issued.
 *   name      display_name is derived here from certificates.name — the name
 *             on the certificate, not the live profile, and not the request.
 *   status    always 'pending' on write. An edit to an approved review takes
 *             it down until it is approved again, and the home page is
 *             rebuilt so it comes down now, not at the next timed rebuild.
 *   consent   consent_version is PRIVACY_UPDATED from legal.js — the policy
 *             date on the page the person could read when they pressed
 *             submit. Written from the server's constant, never the client.
 *   when      submitted_at is left to the database default on first insert
 *             and NOT included in the upsert, so a resubmission keeps it.
 *
 * Feature flag: with REVIEWS_ENABLED false every method is a 404. The table
 * and the route exist; nothing can reach them until the flag flips, and the
 * flag cannot be true unless the legal text is in the build (the integrity
 * guard asserts that).
 */

export const dynamic = 'force-dynamic';

/* Identity, the same way the certificate route does it: the client holds its
   session in localStorage, sends the access token as a bearer credential, and
   the service-role client verifies it with Supabase. Returns { admin, userId }
   or { response } — never both. */
async function begin(req) {
  if (!REVIEWS_ENABLED) {
    return { response: NextResponse.json({ error: 'Not found.' }, { status: 404 }) };
  }
  const admin = createAdminClient();
  if (!admin) {
    return { response: NextResponse.json({ error: 'Service unavailable. Please try again later.' }, { status: 503 }) };
  }
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return { response: NextResponse.json({ error: 'Not signed in.' }, { status: 401 }) };
  }
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) {
    return { response: NextResponse.json({ error: 'Your session has expired. Please sign in again.' }, { status: 401 }) };
  }
  return { admin, userId: data.user.id };
}

async function certificateFor(admin, userId) {
  const { data, error } = await admin
    .from('certificates').select('name').eq('user_id', userId).maybeSingle();
  if (error) throw new Error('certificate lookup: ' + error.message);
  return data || null;
}

async function reviewFor(admin, userId) {
  const { data, error } = await admin
    .from('reviews').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw new Error('review lookup: ' + error.message);
  return data || null;
}

function serverError(where, e) {
  console.error(`[reviews/mine ${where}]`, e?.message || e);
  return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
}

export async function GET(req) {
  const { admin, userId, response } = await begin(req);
  if (response) return response;
  try {
    const [cert, review] = await Promise.all([certificateFor(admin, userId), reviewFor(admin, userId)]);
    // certName lets the form show "First L." / full exactly as the server will
    // store it; it is the person's own certificate name, already theirs.
    return NextResponse.json({ eligible: !!cert, certName: cert?.name ?? null, review: normalizeReview(review) });
  } catch (e) {
    return serverError('GET', e);
  }
}

export async function POST(req) {
  const { admin, userId, response } = await begin(req);
  if (response) return response;

  // ── Eligibility, from the certificates table ────────────────────────────
  let cert;
  try { cert = await certificateFor(admin, userId); } catch (e) { return serverError('POST', e); }
  if (!cert) {
    return NextResponse.json({ error: 'Reviews are open to people who have earned the certificate.' }, { status: 403 });
  }

  // ── The two fields the caller may set ───────────────────────────────────
  const input = await req.json().catch(() => null);
  if (!input || typeof input !== 'object') {
    return NextResponse.json({ error: 'Send a JSON body with "body" and "attribution".' }, { status: 400 });
  }
  const body = cleanBody(input.body);
  const problem = bodyProblem(body);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  const attribution = input.attribution;
  if (!ATTRIBUTIONS.includes(attribution)) {
    return NextResponse.json({ error: 'Choose how your name is shown: first name and initial, or full name.' }, { status: 400 });
  }

  const displayName = displayNameFor(cert.name, attribution);
  if (!displayName) {
    // A certificate with a blank name cannot be attributed. None exist
    // (0 of 112 on 29 Sep 2026), but the column constraint would refuse it
    // and a 500 would tell the person nothing.
    return NextResponse.json({ error: 'The name on your certificate is blank, so a review cannot be attributed. Please get in touch.' }, { status: 409 });
  }

  // ── Write. One row per person; a resubmission overwrites and re-pends ──
  let previous;
  try { previous = await reviewFor(admin, userId); } catch (e) { return serverError('POST', e); }

  const { data: saved, error: saveError } = await admin
    .from('reviews')
    .upsert({
      user_id:         userId,
      body,
      attribution,
      display_name:    displayName,
      status:          'pending',
      consent_version: PRIVACY_UPDATED,
      updated_at:      new Date().toISOString(),
      decided_at:      null,
      decided_by:      null,
    }, { onConflict: 'user_id' })
    .select()
    .single();
  if (saveError) return serverError('POST upsert', saveError);

  // An approved review just changed: take the old text off the home page now.
  if (previous?.status === 'approved') revalidatePath('/');

  return NextResponse.json({ ok: true, resubmitted: !!previous, review: normalizeReview(saved) });
}

export async function DELETE(req) {
  const { admin, userId, response } = await begin(req);
  if (response) return response;

  let previous;
  try { previous = await reviewFor(admin, userId); } catch (e) { return serverError('DELETE', e); }
  if (!previous) return NextResponse.json({ ok: true, deleted: false });

  const { error } = await admin.from('reviews').delete().eq('user_id', userId);
  if (error) return serverError('DELETE', error);

  if (previous.status === 'approved') revalidatePath('/');
  return NextResponse.json({ ok: true, deleted: true });
}
