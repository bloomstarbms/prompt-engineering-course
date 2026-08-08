import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdmin';

/**
 * POST /api/consent
 *
 * Records that the caller has accepted the Terms and Privacy Policy and
 * confirmed they are 18 or older. Used by the one-time in-app acceptance shown
 * to accounts that predate those documents existing.
 *
 * WHY THIS ROUTE HAS TO EXIST
 * Migration 006 revokes column-level UPDATE on profiles.consented_at from
 * authenticated, precisely so a user cannot write their own consent date. The
 * client therefore cannot record this itself — by design. The service role is
 * the only writer, and identity comes from a verified bearer token rather than
 * anything in the request body.
 *
 * IDEMPOTENT, AND FIRST WRITE WINS. The update is conditional on
 * consented_at IS NULL. Re-accepting does not move the date: the record is
 * when someone first agreed, and overwriting it would quietly destroy the only
 * evidence the column exists to hold.
 */

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Service unavailable. Please try again later.' }, { status: 503 });
  }

  // Identity from a signed token, never from the request body. The browser
  // keeps its session in localStorage, so there is no cookie for the server to
  // read; the client sends the access token and we verify it here.
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  const { data: authData, error: authError } = await admin.auth.getUser(token);
  if (authError || !authData?.user) {
    return NextResponse.json({ error: 'Your session has expired. Please sign in again.' }, { status: 401 });
  }
  const userId = authData.user.id;

  // Read first so an already-consented caller gets their original date back
  // rather than a no-op that looks like a failure.
  const { data: existing, error: readError } = await admin
    .from('profiles')
    .select('consented_at')
    .eq('id', userId)
    .maybeSingle();

  if (readError) {
    console.error('[consent] read failed:', readError.message);
    return NextResponse.json({ error: 'Could not record your acceptance. Please try again.' }, { status: 500 });
  }
  if (existing?.consented_at) {
    return NextResponse.json({ ok: true, consentedAt: existing.consented_at, alreadyRecorded: true });
  }

  const consentedAt = new Date().toISOString();
  const { data: updated, error: writeError } = await admin
    .from('profiles')
    .update({ consented_at: consentedAt })
    .eq('id', userId)
    .is('consented_at', null)   // first write wins, even under a double submit
    .select('consented_at')
    .maybeSingle();

  if (writeError) {
    console.error('[consent] write failed:', writeError.message);
    return NextResponse.json({ error: 'Could not record your acceptance. Please try again.' }, { status: 500 });
  }

  // No row back means the IS NULL predicate did not match — another request
  // won the race. That is a success, not a failure; report what is stored.
  if (!updated) {
    const { data: after } = await admin
      .from('profiles').select('consented_at').eq('id', userId).maybeSingle();
    return NextResponse.json({ ok: true, consentedAt: after?.consented_at ?? null, alreadyRecorded: true });
  }

  return NextResponse.json({ ok: true, consentedAt: updated.consented_at });
}
