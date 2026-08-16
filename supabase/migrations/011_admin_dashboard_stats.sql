-- 011_admin_dashboard_stats.sql
--
-- Gives the admin dashboard a way to read the AUTHORITATIVE tables.
--
-- ─── WHY A FUNCTION AT ALL ───────────────────────────────────────────────
-- The dashboard's figures should come from auth.users, profiles and progress,
-- not from course_events. The obstacle is mechanical: PostgREST only exposes
-- the `public` schema, so `db.from('auth.users')` is not a thing that can
-- work — not a permissions problem, a reachability one. service_role already
-- bypasses RLS; what it lacks is a route into the `auth` schema.
--
-- SECURITY DEFINER is therefore doing exactly one job: crossing a schema
-- boundary that PostgREST will not cross. It is not being used to escalate
-- privilege, and the function performs no writes.
--
-- ─── THE DEFAULT GRANT IS THE DANGEROUS PART. READ THIS. ─────────────────
-- CREATE FUNCTION grants EXECUTE to PUBLIC automatically. Combined with
-- SECURITY DEFINER that would mean ANY caller holding the anon key — which
-- ships in the client bundle by design — could call this and receive twenty
-- names and email addresses, bypassing every RLS policy on the way.
--
-- That is the same trap the course_events backup table set in migration 010,
-- where a new table in `public` silently inherited anon/authenticated grants
-- and would have recreated the certificates PII exposure via the safety
-- measure itself. Same lesson, different object type: IN THIS DATABASE, A
-- NEWLY CREATED OBJECT IS OPEN UNTIL YOU CLOSE IT.
--
-- The revokes below are not belt and braces. They are the security boundary.
--
-- ─── VERIFY IT, DO NOT ASSUME IT ─────────────────────────────────────────
-- The assertion block at the end fails the migration if anon or authenticated
-- can still execute. The right follow-up check is to actually CALL it with the
-- anon key and watch it be refused — re-reading the grant table is the mistake
-- migration 006 made.
--
-- ─── SYLLABUS CONSTANTS ARE PARAMETERS, DELIBERATELY ─────────────────────
-- Whether someone has "completed the course" depends on TOTAL_LESSONS,
-- LEGACY_SYLLABUS_LESSONS and SYLLABUS_EXPANDED_AT, which live in
-- src/data/courseData.js and have already changed once (the 2026-04-20
-- expansion). Hardcoding 26 and 22 here would create a second source of truth
-- that drifts silently the next time the syllabus grows — precisely the defect
-- that made SUPABASE_SETUP.sql wrong three times about course_events.
--
-- The caller passes them in. courseData.js stays the only place the numbers
-- are written down, and /api/certificates/issue and /api/stats cannot disagree
-- about who has finished.

begin;

create or replace function public.admin_dashboard_stats(
  p_total_lessons  integer,
  p_legacy_lessons integer,
  p_expanded_at    timestamptz
)
returns json
language sql
stable
security definer
set search_path = ''
as $fn$
  select json_build_object(

    -- ENROLMENTS. auth.users is the only table that cannot lie about this: a
    -- row exists if and only if an account exists.
    'authUsers',    (select count(*) from auth.users),

    -- Surfaced so drift becomes visible instead of silent. These were 765 and
    -- 819 on 13 Aug 2026 — 54 accounts with no profile row — and nobody knew
    -- until it was measured (migration 008). If the dashboard ever shows these
    -- diverging again, that is a bug, not a curiosity.
    'profiles',     (select count(*) from public.profiles),

    'progressRows', (select count(*) from public.progress),
    'certificates', (select count(*) from public.certificates),

    -- COMPLETIONS, from progress — the record of what people actually did,
    -- rather than of whether a fire-and-forget analytics POST survived.
    --
    -- Counts TRUTHY lesson keys, not keys. The client only ever writes `true`,
    -- so a `false` entry is an anomaly; counting keys would let one appear to
    -- finish a course they had not. Same rule as /api/certificates/issue.
    --
    -- The grandfather clause matches that route exactly: accounts predating
    -- the syllabus expansion qualify at the old bar, everyone since must
    -- complete all of it.
    'completions',  (
      select count(*)
        from public.progress p
        join auth.users u on u.id = p.user_id
       where (select count(*)
                from pg_catalog.jsonb_each(coalesce(p.completed, '{}'::jsonb)) e
               where e.value = 'true'::jsonb)
             >= case when u.created_at < p_expanded_at
                     then p_legacy_lessons
                     else p_total_lessons
                end
    ),

    -- RECENT REGISTRATIONS. Email from auth.users, name from profiles. A
    -- LEFT join so a missing profile still shows the account rather than
    -- hiding it — the 54 were invisible for months precisely because a
    -- missing profile made an account disappear from view.
    'recentEnrollments', (
      select coalesce(json_agg(x), '[]'::json) from (
        select coalesce(pr.name, '') as name, u.email, u.created_at as at
          from auth.users u
          left join public.profiles pr on pr.id = u.id
         order by u.created_at desc
         limit 20
      ) x
    ),

    -- RECENT CERTIFICATES. Deliberately NOT "recent completions".
    --
    -- progress has no completion timestamp — updated_at is rewritten on every
    -- save, so it records when someone last studied, not when they finished.
    -- certificates.issued_at is a real, immutable completion moment, so it is
    -- the honest thing to list. The count above and this list are therefore
    -- different populations (finished the syllabus vs claimed a certificate),
    -- which is why they are labelled differently in the UI. Do not relabel one
    -- as the other.
    'recentCertificates', (
      select coalesce(json_agg(y), '[]'::json) from (
        select c.name, c.email, c.issued_at as at
          from public.certificates c
         order by c.issued_at desc
         limit 20
      ) y
    )
  );
$fn$;

-- ── LOCK IT DOWN ─────────────────────────────────────────────────────────
-- Order matters: revoke from PUBLIC first, because anon and authenticated
-- inherit through it. Revoking from them alone leaves the PUBLIC grant intact
-- and the function wide open.
revoke all on function public.admin_dashboard_stats(integer, integer, timestamptz) from public;
revoke all on function public.admin_dashboard_stats(integer, integer, timestamptz) from anon, authenticated;
grant execute on function public.admin_dashboard_stats(integer, integer, timestamptz) to service_role;

-- ── ASSERTIONS ───────────────────────────────────────────────────────────
-- READ THE ACL DIRECTLY, NOT information_schema.
-- information_schema.role_routine_grants only shows grants involving roles the
-- CURRENT user is a member of, so it can report "service_role holds nothing"
-- purely because of who is running the migration — a false abort that would
-- send the next person hunting a permissions bug that does not exist.
-- pg_proc.proacl is the actual stored ACL and is not filtered by caller.
do $$
declare
  acl aclitem[];
  n_bad int; n_svc int;
begin
  select p.proacl into acl
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname = 'admin_dashboard_stats';

  -- A NULL proacl does not mean "no grants". It means DEFAULT privileges are in
  -- force, and the default for a function is EXECUTE TO PUBLIC. This is the
  -- exact state the revokes above exist to leave behind, so treat it as fatal.
  if acl is null then
    raise exception 'ABORT: proacl is NULL — default privileges apply, which means EXECUTE to PUBLIC';
  end if;

  -- grantee = 0 is PUBLIC in aclexplode output.
  select count(*) into n_bad
    from aclexplode(acl) a
    left join pg_roles r on r.oid = a.grantee
   where a.privilege_type = 'EXECUTE'
     and (a.grantee = 0 or r.rolname in ('anon', 'authenticated'));

  select count(*) into n_svc
    from aclexplode(acl) a
    join pg_roles r on r.oid = a.grantee
   where a.privilege_type = 'EXECUTE'
     and r.rolname = 'service_role';

  if n_bad > 0 then
    raise exception
      'ABORT: EXECUTE still held by PUBLIC/anon/authenticated (% grant(s)) — this function returns names and email addresses',
      n_bad;
  end if;

  if n_svc = 0 then
    raise exception 'ABORT: service_role cannot execute admin_dashboard_stats — /api/stats would 500 on every load';
  end if;
end $$;

-- ── REPORT ───────────────────────────────────────────────────────────────
-- Runs the function once, so the migration proves it works rather than merely
-- proving it compiles. 26 / 22 / 2026-04-20 are the values in courseData.js on
-- 15 Aug 2026; the application passes its own, so these are for this readout
-- only and are allowed to go stale here.
select (public.admin_dashboard_stats(26, 22, timestamptz '2026-04-20T00:00:00Z') -> 'authUsers')    as auth_users,
       (public.admin_dashboard_stats(26, 22, timestamptz '2026-04-20T00:00:00Z') -> 'profiles')     as profiles,
       (public.admin_dashboard_stats(26, 22, timestamptz '2026-04-20T00:00:00Z') -> 'completions')  as completions,
       (public.admin_dashboard_stats(26, 22, timestamptz '2026-04-20T00:00:00Z') -> 'certificates') as certificates;

commit;

-- ── DEPLOY ORDER MATTERS ─────────────────────────────────────────────────
-- RUN THIS MIGRATION BEFORE DEPLOYING THE /api/stats CHANGE. The new route
-- calls this function; if the code ships first, the dashboard returns 500
-- until the migration lands. The reverse order is harmless — the function
-- simply sits unused.
--
-- ── ROLLBACK ─────────────────────────────────────────────────────────────
--   drop function if exists public.admin_dashboard_stats(integer, integer, timestamptz);
--
-- Only after reverting /api/stats, which would otherwise 500 on every load.
