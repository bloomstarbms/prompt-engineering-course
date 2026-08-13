import { createAdminClient } from '@/lib/supabaseAdmin';

/**
 * POST /api/track — analytics events (enroll, complete).
 *
 * SERVICE ROLE, ON PRINCIPLE — NOT AS A BUGFIX. This route previously used the
 * anon client from '@/lib/supabase'. That was never the cause of anything: anon
 * holds INSERT on course_events and the "allow inserts" RLS policy has
 * with_check = true, both confirmed against production. The write was refused
 * by Postgres for a missing unique index, not by permissions — see migration
 * 010. The change is made because a server route has no business holding the
 * browser's key, and because everything else server-side already uses the admin
 * client. Do not read it as the fix for the 110-day outage.
 */
export async function POST(req) {
  const supabase = createAdminClient();

  /* Not configured — say so rather than reporting a write that did not happen.
     This used to return `{ ok: true, configured: false }`, which is a success
     shape for a failure, and callers that check `ok` would have believed it. */
  if (!supabase) {
    console.error('[track] admin client unavailable — event not recorded');
    return Response.json({ ok: false, error: 'not_configured' }, { status: 503 });
  }

  /* Declared outside the try so the catch can name them in the log line.
     They were originally destructured inside it — which would have made the
     error handler itself throw a ReferenceError, turning a logged failure back
     into a silent one. */
  let event, email, name;

  try {
    ({ event, email, name } = await req.json());
    if (!event || !email) return Response.json({ ok: false, error: 'Missing fields' }, { status: 400 });

    /* Public endpoint — validate strictly.  Only two known events exist,
       emails must look like emails, and lengths are capped so nobody can
       stuff arbitrary payloads into the analytics table. */
    if (!['enroll', 'complete'].includes(event)) {
      return Response.json({ ok: false, error: 'Unknown event' }, { status: 400 });
    }
    const normalEmail = String(email).toLowerCase().trim().slice(0, 254);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalEmail)) {
      return Response.json({ ok: false, error: 'Invalid email' }, { status: 400 });
    }

    /* Upsert with onConflict — idempotent, and the index this depends on is
       real as of migration 010. It was NOT real before that, and this comment
       used to assert it anyway.

       WHAT IS ACTUALLY GUARANTEED: a unique index named
       course_events_email_event_idx exists on (email, event), so ON CONFLICT
       has something to match and a duplicate call is discarded by the database
       rather than by a SELECT-then-INSERT check that could race.

       WHAT BREAKS IF IT GOES AWAY: every call to this route fails at planning
       time with "there is no unique or exclusion constraint matching the ON
       CONFLICT specification" — a 500 on every write, not a silent no-op. That
       is what happened from 2026-04-25 to 2026-08-13, unnoticed for 110 days
       because both callers are fire-and-forget. If you drop the index, this
       route stops working entirely. */
    const { error } = await supabase
      .from('course_events')
      .upsert(
        { event, email: normalEmail, name: String(name || '').slice(0, 120) },
        { onConflict: 'email,event', ignoreDuplicates: true }
      );

    if (error) throw error;
    return Response.json({ ok: true });
  } catch (e) {
    /* MAKE THE FAILURE ANNOUNCE ITSELF.
       Never break the app if analytics fails — both callers are
       fire-and-forget and a dead analytics table must not block a signup.
       But "non-blocking" is not the same as "silent", and treating them as
       the same is why this ran broken for 110 days while logging the exact
       reason to a console nobody was reading.

       ERROR level, one line, with the event and a redacted address so a log
       search for [track] FAILED answers "is it working" without opening a
       row. The full email is deliberately not logged: this is an error path,
       not an audit trail, and the privacy policy does not promise addresses
       in application logs. */
    const redacted = String(email || '').replace(/^(.).*(@.*)$/, '$1***$2');
    console.error(
      `[track] FAILED event=${event || '?'} email=${redacted || '?'} reason=${e.message}`
    );
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
