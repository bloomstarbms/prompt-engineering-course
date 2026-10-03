import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';
import { REVIEWS_ENABLED } from '@/lib/docs';

/**
 * /api/admin/reviews — moderation. Admin only (lib/adminAuth.js).
 *
 *   GET   → { reviews: [...], counts: { pending, approved, rejected, unpublished } }
 *   POST  { action, id }   action ∈ approve | reject | unpublish | delete | rebuild
 *
 * The owner can approve, reject, unpublish and delete. The owner CANNOT edit:
 * there is no action that changes body, attribution or display_name, and the
 * terms promise "shown as you wrote it or not at all". Keep it that way.
 *
 * Allowed transitions (anything else is a 409, so a stale screen cannot
 * re-approve something the author has since edited back to pending without
 * the admin seeing the new text — the list is refetched after every action):
 *   approve     pending | rejected | unpublished  → approved
 *   reject      pending                           → rejected
 *   unpublish   approved                          → unpublished
 *   delete      any                               → row gone
 *   rebuild     no row; revalidates the home page (ERASURE-PROCEDURE step 5)
 *
 * The home page is static and holds the approved set, so every action that
 * can change that set revalidates '/'. A reject of a pending review cannot,
 * and does not.
 */

export const dynamic = 'force-dynamic';

const TRANSITIONS = {
  approve:   { from: ['pending', 'rejected', 'unpublished'], to: 'approved' },
  reject:    { from: ['pending'],                            to: 'rejected' },
  unpublish: { from: ['approved'],                           to: 'unpublished' },
};

function row(r) {
  return {
    id: r.id, userId: r.user_id, body: r.body, attribution: r.attribution,
    displayName: r.display_name, status: r.status, consentVersion: r.consent_version,
    submittedAt: r.submitted_at, updatedAt: r.updated_at, decidedAt: r.decided_at,
  };
}

async function begin(req) {
  if (!REVIEWS_ENABLED) return { response: NextResponse.json({ error: 'Not found.' }, { status: 404 }) };
  const admin = createAdminClient();
  if (!admin) return { response: NextResponse.json({ error: 'Service unavailable.' }, { status: 503 }) };
  return requireAdmin(req, admin);
}

export async function GET(req) {
  const { admin, response } = await begin(req);
  if (response) return response;
  const { data, error } = await admin
    .from('reviews').select('*').order('submitted_at', { ascending: false });
  if (error) {
    console.error('[admin/reviews GET]', error.message);
    return NextResponse.json({ error: 'Could not read reviews.' }, { status: 500 });
  }
  const counts = { pending: 0, approved: 0, rejected: 0, unpublished: 0 };
  for (const r of data) counts[r.status] = (counts[r.status] || 0) + 1;
  return NextResponse.json({ reviews: data.map(row), counts });
}

export async function POST(req) {
  const { admin, userId, response } = await begin(req);
  if (response) return response;

  const input = await req.json().catch(() => null);
  const action = input?.action;
  const id     = input?.id;

  if (action === 'rebuild') {
    revalidatePath('/');
    return NextResponse.json({ ok: true, rebuilt: true });
  }
  if (!['approve', 'reject', 'unpublish', 'delete'].includes(action) || typeof id !== 'string' || !id) {
    return NextResponse.json({ error: 'Send { action, id } with a known action.' }, { status: 400 });
  }

  const { data: current, error: readError } = await admin
    .from('reviews').select('*').eq('id', id).maybeSingle();
  if (readError) return NextResponse.json({ error: 'Could not read that review.' }, { status: 500 });
  if (!current)  return NextResponse.json({ error: 'That review no longer exists.' }, { status: 404 });

  if (action === 'delete') {
    const { error } = await admin.from('reviews').delete().eq('id', id);
    if (error) return NextResponse.json({ error: 'Could not delete.' }, { status: 500 });
    if (current.status === 'approved') revalidatePath('/');
    return NextResponse.json({ ok: true, deleted: true });
  }

  const t = TRANSITIONS[action];
  if (!t.from.includes(current.status)) {
    return NextResponse.json({
      error: `Cannot ${action} a review that is ${current.status}. Reload the list.`,
    }, { status: 409 });
  }
  const { data: updated, error: updError } = await admin
    .from('reviews')
    .update({ status: t.to, decided_at: new Date().toISOString(), decided_by: userId })
    .eq('id', id)
    .eq('status', current.status)   // the transition is checked again by the write itself
    .select()
    .maybeSingle();
  if (updError) return NextResponse.json({ error: 'Could not update.' }, { status: 500 });
  if (!updated) return NextResponse.json({ error: 'That review changed while you were looking. Reload the list.' }, { status: 409 });

  // The approved set changed if the row was approved before or is now.
  if (current.status === 'approved' || t.to === 'approved') revalidatePath('/');
  return NextResponse.json({ ok: true, review: row(updated) });
}
