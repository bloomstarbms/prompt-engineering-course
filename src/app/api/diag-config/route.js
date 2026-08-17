import { SUPABASE_CONFIGURED } from '@/lib/supabase';

/**
 * GET /api/diag-config — TEMPORARY DIAGNOSTIC. DELETE THIS FILE.
 *
 * ─── DELETE IT ───────────────────────────────────────────────────────────
 * Added 17 Aug 2026 to settle one question and then go. If you are reading
 * this and the question in SECURITY-NOTES.md ("why did the old /api/track
 * write nothing on 14 Aug") is answered, this file has no reason to exist.
 * Remove it. Leftover diagnostics become permanent furniture that nobody
 * dares delete because nobody remembers what they were for — the same fate
 * the course_events backup table was explicitly rescued from.
 *
 * ─── THE QUESTION IT ANSWERS ─────────────────────────────────────────────
 * On 14 Aug the unique index existed, anon held INSERT, the route code was
 * unchanged, and the client had been observed calling it the day before. The
 * write should have succeeded. It produced zero rows AND burned zero sequence
 * values, meaning nothing reached the database. The leading explanation is
 * that the anon client was unconfigured in the server runtime, so the route
 * returned `{ ok: true, configured: false }` without touching Supabase.
 *
 * That explanation has a problem: NEXT_PUBLIC_ values are inlined into the
 * browser bundle at build time from the same Vercel environment the runtime
 * reads, so a missing key should have produced a dead site for everyone, not
 * a dead analytics route. Nobody has produced a mechanism for "present at
 * build, absent at runtime".
 *
 * ─── WHAT IT REPORTS, AND WHY `configured` IS THE IMPORTANT ONE ──────────
 * `url` and `anon` are raw presence booleans. `configured` is the value that
 * `src/lib/supabase.js` actually computed when this server runtime imported
 * it — the same module, the same expression, that the old /api/track branched
 * on. Reading the env vars tests the inputs; reading `configured` tests the
 * decision. If they ever disagree, that disagreement IS the finding.
 *
 * NO SECRET IS EXPOSED. Booleans only. Never return the values, their length,
 * or a prefix — a key length narrows a search, and "just the first few
 * characters" is how credentials leak from debug endpoints.
 *
 * ─── force-dynamic IS LOAD-BEARING, NOT BOILERPLATE ──────────────────────
 * GET route handlers in the App Router are STATICALLY CACHED by default. Without
 * this line, Next would evaluate the handler AT BUILD TIME and serve a frozen
 * body forever — so it would report whether the variables existed during the
 * build, which is precisely the half of the question we are not asking. The
 * test would look like it worked and answer the wrong thing.
 *
 * That is worth pausing on, because it is the shape of the bug we are chasing:
 * a check that returns a confident value from the wrong moment.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({
    url:        !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    anon:       !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    configured: SUPABASE_CONFIGURED,
    at:         new Date().toISOString(),
  });
}
