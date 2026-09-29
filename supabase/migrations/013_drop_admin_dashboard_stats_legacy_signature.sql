-- ═══════════════════════════════════════════════════════════════════════════
--  013_drop_admin_dashboard_stats_legacy_signature.sql
--
--  Drops 011's admin_dashboard_stats(integer, integer, timestamptz): the
--  grandfather clause's version, superseded by 012's one-argument function.
--
--  RUN ONLY AFTER the code calling admin_dashboard_stats(p_total_lessons) is
--  live in production (branch migration-012-stats-signature, merged and
--  deployed). Before that, the live /api/stats still calls this signature and
--  dropping it breaks the admin dashboard.
--
--  Check first, by behaviour: sign in to /admin on production and confirm the
--  dashboard loads. It can only load if the one-argument function is being
--  called, because this migration hasn't removed anything yet and the code no
--  longer references the old signature.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

do $$
begin
  if to_regprocedure('public.admin_dashboard_stats(integer)') is null then
    raise exception 'ABORT: the one-argument admin_dashboard_stats does not exist — run 012 first';
  end if;
end $$;

drop function if exists public.admin_dashboard_stats(integer, integer, timestamptz);

do $$
begin
  if to_regprocedure('public.admin_dashboard_stats(integer, integer, timestamptz)') is not null then
    raise exception 'ABORT: the three-argument admin_dashboard_stats still exists';
  end if;
end $$;

select (public.admin_dashboard_stats(26) -> 'completions') as completions_after_drop;

commit;
