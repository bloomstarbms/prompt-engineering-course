import { createHash, timingSafeEqual } from 'node:crypto';
import { createAdminClient } from '@/lib/supabaseAdmin';
import { TOTAL_LESSONS, LEGACY_SYLLABUS_LESSONS, SYLLABUS_EXPANDED_AT } from '@/data/courseData';

/**
 * POST /api/stats — figures for the admin dashboard.
 *
 * ─── THIS ROUTE USED TO READ course_events, AND WAS WRONG FOR 110 DAYS ───
 *
 * Every number on the dashboard came from a table written by a fire-and-forget
 * POST that had been failing since 2026-04-25. On 13 August 2026 it reported
 * 793 enrollments against 1,405 real accounts and nobody could tell, because a
 * plausible number is indistinguishable from a correct one.
 *
 * The lesson is not "that table was broken". It is that the dashboard was
 * reading a DERIVED, BEST-EFFORT COPY of facts the database already held
 * authoritatively:
 *
 *   · an account exists          → auth.users has a row. Cannot be missed.
 *   · their name                 → profiles.name
 *   · they finished the course   → progress.completed
 *   · they claimed a certificate → certificates
 *
 * None of those depend on a network call succeeding at the right moment. The
 * old design could only ever be as reliable as its weakest write, and it was
 * measuring the analytics pipeline while appearing to measure the business.
 *
 * IF YOU ADD A METRIC HERE, DERIVE IT FROM THE TABLE THAT OWNS THE FACT. Do
 * not reintroduce an events table because it is easier to aggregate.
 *
 * ─── WHY AN RPC RATHER THAN .from() ──────────────────────────────────────
 * PostgREST exposes only the `public` schema, so auth.users is unreachable via
 * db.from() no matter what key you hold. Migration 011 defines
 * public.admin_dashboard_stats() to cross that boundary; EXECUTE is revoked
 * from PUBLIC, anon and authenticated, and granted to service_role alone.
 *
 * ─── SYLLABUS CONSTANTS ARE PASSED IN ────────────────────────────────────
 * "Completed" depends on numbers that live in src/data/courseData.js and have
 * changed once already. They are sent as arguments so this route and
 * /api/certificates/issue can never disagree about who has finished, and so a
 * future syllabus change does not require remembering that a SQL function also
 * needs editing.
 */

/* Constant-time secret comparison.
   `!==` on strings short-circuits at the first differing byte, so response
   timing leaks how much of the token a caller guessed correctly. timingSafeEqual
   fixes that but throws when the two buffers differ in length — so we SHA-256
   both sides first: always 32 bytes, and the digest of a wrong-length guess is
   just as uncorrelated as any other wrong guess. */
function secretsMatch(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

export async function POST(req) {
  /* Auth check — token travels in the request body, not the URL, to avoid
     it appearing in server logs or browser history. */
  const body = await req.json().catch(() => ({}));
  const token = body.token;
  const secret = process.env.ADMIN_SECRET;

  if (!secret || !secretsMatch(token, secret)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = createAdminClient();
  if (!db) {
    return Response.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const { data, error } = await db.rpc('admin_dashboard_stats', {
    p_total_lessons:  TOTAL_LESSONS,
    p_legacy_lessons: LEGACY_SYLLABUS_LESSONS,
    p_expanded_at:    SYLLABUS_EXPANDED_AT,
  });

  if (error) {
    /* Name the cause. The most likely one by far is that migration 011 has not
       been run against this database, and "Failed to fetch stats" would send
       the next person looking at the wrong layer for an hour. */
    console.error(`[stats] admin_dashboard_stats failed: ${error.message}`);
    return Response.json({
      error: `Could not read stats: ${error.message}. If this says the function does not exist, run supabase/migrations/011_admin_dashboard_stats.sql.`,
    }, { status: 500 });
  }

  const enrolled    = Number(data?.authUsers    ?? 0);
  const completions = Number(data?.completions  ?? 0);
  const profiles    = Number(data?.profiles     ?? 0);

  return Response.json({
    totalEnrollments: enrolled,
    totalCompletions: completions,
    completionRate:   enrolled > 0 ? Math.round(completions / enrolled * 100) : 0,

    recentEnrollments:  data?.recentEnrollments  ?? [],
    recentCertificates: data?.recentCertificates ?? [],

    /* Diagnostics, rendered in the footer of the dashboard.
       profiles is here so the 54-missing-rows failure of August 2026 would be
       visible on the screen the next time rather than found by a migration. */
    diagnostics: {
      profiles,
      profileGap:       enrolled - profiles,
      progressRows:     Number(data?.progressRows ?? 0),
      certificates:     Number(data?.certificates ?? 0),
      requiredLessons:  TOTAL_LESSONS,
    },
  });
}
