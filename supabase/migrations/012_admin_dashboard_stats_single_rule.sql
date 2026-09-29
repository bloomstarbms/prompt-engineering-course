-- ═══════════════════════════════════════════════════════════════════════════
--  012_admin_dashboard_stats_single_rule.sql
--
--  Adds admin_dashboard_stats(p_total_lessons integer): migration 011's
--  function without the grandfather clause's two parameters.
--
--  WHY. The grandfather clause (22 lessons for accounts created before
--  2026-04-20) was removed from courseData.js on 29 Sep 2026. It matched 0 of
--  1,668 accounts, because every account was created on or after 2026-04-25.
--  Completion is now "every lesson in the syllabus" for everyone.
--  011's p_legacy_lessons and p_expanded_at became dead inputs; /api/stats
--  has been passing TOTAL_LESSONS for both bars so the CASE collapses.
--
--  ORDER OF OPERATIONS. Three steps, deliberately:
--    1. Run THIS migration. It ADDS the one-argument function and leaves 011's
--       three-argument one in place, so the live /api/stats keeps working.
--    2. Deploy the code that calls the one-argument form (branch
--       migration-012-stats-signature).
--    3. Run 013, which drops the three-argument function.
--  Dropping it here instead would break the admin dashboard for however long
--  the gap between running SQL and deploying code turns out to be.
--
--  WHILE BOTH EXIST, look functions up by SIGNATURE, not by name. 011's
--  assertion selects proacl WHERE proname = 'admin_dashboard_stats'. With two
--  overloads that matches two rows and SELECT INTO silently keeps one. The
--  checks below use to_regprocedure() on the exact signature.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

create or replace function public.admin_dashboard_stats(
  p_total_lessons integer
)
returns json
language sql
stable
security definer
set search_path = ''
as $fn$
  select json_build_object(
    'authUsers',    (select count(*) from auth.users),
    'profiles',     (select count(*) from public.profiles),
    'progressRows', (select count(*) from public.progress),
    'certificates', (select count(*) from public.certificates),

    -- COMPLETIONS: truthy lesson keys >= the full syllabus, for everyone.
    -- Same rule as isCourseComplete() in courseData.js. No cutoff date: the
    -- last one matched no account (see courseData.js, VERIFICATION-NOTES.md).
    'completions',  (
      select count(*)
        from public.progress p
       where (select count(*)
                from pg_catalog.jsonb_each(coalesce(p.completed, '{}'::jsonb)) e
               where e.value = 'true'::jsonb)
             >= p_total_lessons
    ),

    -- Unchanged from 011; see the comments there.
    'recentEnrollments', (
      select coalesce(json_agg(x), '[]'::json) from (
        select coalesce(pr.name, '') as name, u.email, u.created_at as at
          from auth.users u
          left join public.profiles pr on pr.id = u.id
         order by u.created_at desc
         limit 20
      ) x
    ),
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

-- ── LOCK IT DOWN — same boundary as 011 ──────────────────────────────────
-- CREATE FUNCTION grants EXECUTE to PUBLIC by default, and this is SECURITY
-- DEFINER and returns names and email addresses. Revoke PUBLIC first.
revoke all on function public.admin_dashboard_stats(integer) from public;
revoke all on function public.admin_dashboard_stats(integer) from anon, authenticated;
grant execute on function public.admin_dashboard_stats(integer) to service_role;

-- ── ASSERTIONS, BY SIGNATURE ─────────────────────────────────────────────
do $$
declare
  fn  regprocedure := to_regprocedure('public.admin_dashboard_stats(integer)');
  acl aclitem[];
  n_bad int; n_svc int;
begin
  if fn is null then
    raise exception 'ABORT: public.admin_dashboard_stats(integer) does not exist';
  end if;

  select p.proacl into acl from pg_proc p where p.oid = fn;

  -- NULL proacl means default privileges, i.e. EXECUTE to PUBLIC.
  if acl is null then
    raise exception 'ABORT: proacl is NULL — default privileges apply, which means EXECUTE to PUBLIC';
  end if;

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
    raise exception 'ABORT: EXECUTE on admin_dashboard_stats(integer) still held by PUBLIC/anon/authenticated (% grant(s))', n_bad;
  end if;
  if n_svc = 0 then
    raise exception 'ABORT: service_role cannot execute admin_dashboard_stats(integer) — /api/stats would 500';
  end if;
end $$;

-- ── REPORT: the new and old functions must agree ─────────────────────────
-- /api/stats has been calling 011's function as (26, 26, <any date>), so its
-- 'completions' is the number the dashboard shows today. The new function
-- must return the same number, or the rule changed in transit.
select (public.admin_dashboard_stats(26) -> 'completions')                                   as completions_new,
       (public.admin_dashboard_stats(26, 26, timestamptz '1970-01-01') -> 'completions')     as completions_old_as_called,
       (public.admin_dashboard_stats(26) -> 'certificates')                                  as certificates,
       (public.admin_dashboard_stats(26) -> 'authUsers')                                     as auth_users;

commit;

-- ── BY HAND, AFTER RUNNING ───────────────────────────────────────────────
-- Verify the lockdown by ATTEMPTING a forbidden call, not by re-reading the
-- ACL (the mistake 006 made). With the anon key, from anywhere:
--
--   POST https://<project>.supabase.co/rest/v1/rpc/admin_dashboard_stats
--   apikey: <anon key>          body: {"p_total_lessons": 26}
--
-- Expect 401/403 (permission denied for function). A 200 means it is open.
