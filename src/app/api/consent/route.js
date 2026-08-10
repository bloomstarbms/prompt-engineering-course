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
 * A migration 007 trigger raises 42501 on any attempt to write
 * profiles.consented_at as `authenticated` or `anon`, precisely so a user
 * cannot write their own consent date. (Migration 006 tried to do this with a
 * column-level REVOKE and that is a no-op — a column REVOKE cannot subtract
 * from a table-level grant. Do not cite 006 as the protection; it was applied
 * to production and changed nothing.) The service role is the only writer, and
 * identity comes from a verified bearer token rather than anything in the
 * request body.
 *
 * IDEMPOTENT, AND FIRST WRITE WINS. The update is conditional on
 * consented_at IS NULL. Re-accepting does not move the date: the record is
 * when someone first agreed, and overwriting it would quietly destroy the only
 * evidence the column exists to hold.
 *
 * ─── NEVER REPORT SUCCESS WITHOUT A TIMESTAMP ────────────────────────────
 * This route used to return `{ ok: true, consentedAt: null }` in two
 * reachable cases, both of which mean "nothing was written":
 *
 *   1. The caller has no profiles row at all. `maybeSingle()` returns null
 *      without an error, the UPDATE matches zero rows without an error, and
 *      the not-updated branch read null back and called it success. 54 of 818
 *      accounts were in exactly this state — auth users whose profile insert
 *      failed silently during an older version of the register route. Someone
 *      in that group would click Accept, see no error, and watch the notice
 *      stay on screen with nothing recorded.
 *
 *   2. The row exists but the post-race re-read still shows NULL, which
 *      cannot happen if the race explanation is true.
 *
 * `ok: true` now means a timestamp exists. Both cases return an error the UI
 * can show. A consent endpoint that reports success without writing evidence
 * is worse than one that fails loudly, because the failure is invisible on
 * both sides — the user thinks they accepted and the record says otherwise.
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
  // No profiles row means there is nothing to update, and the UPDATE below
  // would match zero rows and report that as a race. Distinguish it here.
  if (!existing) {
    console.error('[consent] no profiles row for user', userId);
    return NextResponse.json({
      error: 'Your profile could not be found, so your acceptance was not recorded. Please contact privacy@prompten.xyz.',
    }, { status: 409 });
  }

  if (existing.consented_at) {
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

  // No row back means the IS NULL predicate did not match — normally because
  // another request won the race, which is a success. But only if the re-read
  // actually finds a timestamp. If it comes back NULL the race explanation is
  // false and nothing was written, so this must not report success.
  if (!updated) {
    const { data: after } = await admin
      .from('profiles').select('consented_at').eq('id', userId).maybeSingle();
    if (after?.consented_at) {
      return NextResponse.json({ ok: true, consentedAt: after.consented_at, alreadyRecorded: true });
    }
    console.error('[consent] update matched no rows and re-read is still null for user', userId);
    return NextResponse.json({
      error: 'Your acceptance could not be recorded. Please try again.',
    }, { status: 500 });
  }

  return NextResponse.json({ ok: true, consentedAt: updated.consented_at });
}
