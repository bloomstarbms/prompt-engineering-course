-- ═══════════════════════════════════════════════════════════════════════════
--  015_drop_course_events.sql — retire the analytics table. IRREVERSIBLE.
--
--  public.course_events held one row per registration ('enroll') and per
--  course completion ('complete'): the person's name, email address and a
--  timestamp. It had no foreign key to auth.users, so deleting an account
--  never touched it, and the privacy policy promised a 24-month expiry that
--  nothing enforced. Deleting these rows is the point of this migration.
--
--  WHY IT CAN GO
--    · Nothing reads it. The admin dashboard has derived its figures from
--      auth.users, progress and certificates since August (migrations
--      011/012); completion time is certificates.issued_at.
--    · Nothing writes it. /api/track, the only writer, was removed in commit
--      6b02b77, live on production from 2026-10-03 15:31:49 UTC. Verified by
--      the shipped JavaScript (2 files calling it before, 0 after) and by
--      this table: no row created after that moment.
--    · Nothing depends on it. Measured 2026-10-03: no foreign keys into it,
--      no views on it, no functions whose source mentions it, no triggers.
--      Its one policy ("allow inserts") and its index go with the table.
--    · The privacy policy stops describing usage events in the same release
--      (§2, §4, §7), merged only after this has run.
--
--  WHAT GUARDS THE RUN
--    The row count is pinned to the number the owner confirmed. If it differs
--    by even one row, the transaction aborts before anything is dropped and
--    the count has to be re-measured and re-confirmed. The drop is RESTRICT
--    (the default, no CASCADE): if anything has come to depend on the table
--    since it was measured, Postgres refuses rather than taking it along.
--
--  Supabase's own backups may still hold these rows until they age out; the
--  privacy policy says "deleted from our database", which is what this does.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

do $$
declare
  confirmed_rows constant bigint := 1136;           -- measured 2026-10-03, confirmed by the owner
  removed_at     constant timestamptz := '2026-10-03 15:31:49+00';
  n_rows   bigint;
  n_late   bigint;
  n_fk     int;
  n_views  int;
  n_funcs  int;
begin
  if to_regclass('public.course_events') is null then
    raise exception 'ABORT: public.course_events does not exist — already dropped?';
  end if;

  select count(*) into n_rows from public.course_events;
  if n_rows <> confirmed_rows then
    raise exception 'ABORT: course_events has % rows; % were confirmed. Re-measure and re-confirm before dropping.', n_rows, confirmed_rows;
  end if;

  select count(*) into n_late from public.course_events where created_at > removed_at;
  if n_late <> 0 then
    raise exception 'ABORT: % row(s) were written after /api/track was removed. Something still writes to this table.', n_late;
  end if;

  select count(*) into n_fk from pg_constraint where confrelid = 'public.course_events'::regclass;
  select count(*) into n_views
    from pg_depend d join pg_rewrite r on r.oid = d.objid
   where d.refobjid = 'public.course_events'::regclass and r.ev_class <> 'public.course_events'::regclass;
  select count(*) into n_funcs
    from pg_proc p join pg_namespace s on s.oid = p.pronamespace
   where s.nspname not in ('pg_catalog', 'information_schema') and p.prosrc ilike '%course_events%';
  if n_fk + n_views + n_funcs <> 0 then
    raise exception 'ABORT: something depends on course_events (foreign keys %, views %, functions %)', n_fk, n_views, n_funcs;
  end if;
end $$;

drop table public.course_events;   -- RESTRICT: refuses if anything depends on it

do $$
begin
  if to_regclass('public.course_events') is not null then
    raise exception 'ABORT: course_events still exists after DROP';
  end if;
end $$;

-- ── REPORT ───────────────────────────────────────────────────────────────
select
  to_regclass('public.course_events') is null                                        as course_events_gone,
  (select string_agg(tablename, ', ' order by tablename) from pg_tables where schemaname = 'public') as public_tables,
  now()                                                                                as dropped_at;

commit;
