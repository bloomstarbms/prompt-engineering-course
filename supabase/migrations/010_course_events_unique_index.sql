-- 010_course_events_unique_index.sql
--
-- Deduplicates course_events on (email, event) and creates the unique index
-- that /api/track has been asking for — and failing on — since this database
-- was created.
--
-- ─── WHAT WAS BROKEN, AND FOR HOW LONG ───────────────────────────────────
-- /api/track upserts with `onConflict: 'email,event'`, which PostgREST turns
-- into `ON CONFLICT (email, event) DO NOTHING`. Postgres rejects that
-- statement at planning time when no matching unique constraint exists:
--
--   [track] there is no unique or exclusion constraint matching the
--           ON CONFLICT specification
--
-- Captured verbatim from a Vercel runtime log, six seconds after a real
-- registration:
--
--   20:07:47.42  POST 200  /api/auth/register
--   20:07:53.28  POST 500  /api/track   ← every single time
--
-- So EVERY analytics write since 2026-04-25 has failed. course_events froze
-- at 874 rows while auth.users grew to 1,337. The admin dashboard derives all
-- of its figures from this table, so it has been reporting April numbers for
-- 110 days.
--
-- ─── THE INDEX WAS NEVER DROPPED. IT WAS NEVER CREATED HERE. ─────────────
-- Checked rather than assumed: pg_indexes shows exactly one index on this
-- table, course_events_pkey. There is no (email, event) index and no trace of
-- one having existed.
--
-- The 2026-04-25 correlation is a coincidence worth naming, because it is
-- convincing and wrong. The last successful write predates "Migrate auth,
-- progress & certificates to Supabase" by forty minutes — the constraint
-- existed on the OLD database, the migration rebuilt the schema without it,
-- and every write since has failed identically. Nothing was dropped on the
-- 25th; the table simply arrived here incomplete.
--
-- The comment above the upsert asserted "the unique index on (email, event)
-- means duplicate calls are silently ignored". That was true of the previous
-- database and has never been true of this one. Same class as migration 006:
-- a comment describing a protection that does not exist. Both are now fixed —
-- 006 by trigger 007, this one by the index below.
--
-- ─── THE REPO ALREADY DECLARED THIS INDEX ────────────────────────────────
-- SUPABASE_SETUP.sql line 167 has said, all along:
--
--   create unique index if not exists course_events_email_event_idx
--     on public.course_events (email, event);
--
-- So this was never an undocumented requirement. The declaration exists and
-- production simply never had it applied — which is precisely the failure
-- that file's own header warns about, having previously described a
-- course_events policy named "course_events: insert" when production calls it
-- "allow inserts".
--
-- THE NAME HERE MATCHES THE SETUP FILE DELIBERATELY. The first draft of this
-- migration used course_events_email_event_key, which would have created a
-- THIRD name for the same object and made the next person's comparison of
-- repo against production wrong in a new way. If you change the name, change
-- it in both places in the same commit.
--
-- ─── WHY THE INDEX RATHER THAN DROPPING onConflict ───────────────────────
-- Removing the ON CONFLICT clause would make the write succeed immediately,
-- which is why it is tempting. It would also change the semantics to one row
-- per call — every page refresh during signup becoming another "enrollment" —
-- and reintroduce the SELECT-then-INSERT race the original design avoided.
-- The intent was right. Only the constraint was missing. Restore the
-- constraint.
--
-- ─── THE DUPLICATES, AND WHY DELETION IS SAFE HERE ───────────────────────
-- CREATE UNIQUE INDEX fails against the current data:
--
--   54 (email, event) pairs have more than one row
--  136 rows are involved
--   82 rows are excess          ← 9.4% of the table
--
-- These are artefacts of the period when the write worked and no constraint
-- existed, so one person could record the same event repeatedly. They are
-- duplicate analytics rows, not user data. Nothing in profiles, progress,
-- certificates or auth.users is touched.
--
-- The EARLIEST row per pair survives, ordered by created_at — that is the
-- true first-enrollment timestamp and the only one with meaning. Ordering is
-- by data, deliberately, not by ctid: ctid is physical placement and can move
-- under VACUUM, so which row survived would be an accident of storage rather
-- than a decision. id breaks ties so the result is deterministic even if two
-- rows share a timestamp to the microsecond.
--
-- Deleting duplicates makes this table MORE accurate, not less: 54 people
-- currently count twice in any funnel built on it.

begin;

-- ── BACKUP FIRST, INSIDE THE TRANSACTION ─────────────────────────────────
-- A full copy of the table before a single row is deleted. This replaces an
-- earlier plan to export CSV, which failed for three separate reasons worth
-- recording so nobody retries it: the SQL editor caps results at 100 rows and
-- exports the GRID rather than the query (so the file would have held 100 of
-- 874 and looked complete), the result grid virtualises cells so the data
-- cannot be read out of the DOM either, and the download folder is not
-- reachable from the agent's filesystem.
--
-- This is strictly better anyway. It is atomic with the delete — if anything
-- below aborts, the backup rolls back too and no orphan table is left behind —
-- and restoring is one statement rather than a CSV import.
--
-- SECURITY: RLS ON, GRANTS REVOKED, DELIBERATELY.
-- A new table in `public` inherits Supabase's default privileges, which grant
-- anon and authenticated access. This table holds 874 names and email
-- addresses. Creating it without locking it down would reproduce the exact
-- exposure that migration 000 was written to close — a safety measure that
-- creates a PII leak is not a safety measure. RLS with no policies denies
-- everything by default; the explicit revokes are belt and braces because
-- default privileges are easy to misremember.
create table public.course_events_backup_20260813 as
  select * from public.course_events;

alter table public.course_events_backup_20260813 enable row level security;
revoke all on public.course_events_backup_20260813 from anon, authenticated;

create temp table _ce_before on commit drop as
select (select count(*) from public.course_events)                          as rows,
       (select count(*) from public.course_events_backup_20260813)          as backup_rows,
       (select count(*) from (select distinct email, event
                                from public.course_events) d)               as distinct_pairs,
       (select count(*) from public.profiles)                               as profiles,
       (select count(*) from auth.users)                                    as auth_users;

-- ── THE BACKUP MUST BE COMPLETE BEFORE ANYTHING IS DELETED ───────────────
-- Asserted as an equality against the live table rather than hardcoded to
-- 874. 874 is what was measured on 2026-08-13 and is what you should expect,
-- but the invariant that actually protects the data is "the backup holds
-- everything the table holds" — and that stays true if a signup lands between
-- the measurement and the run. Hardcoding the number would abort the
-- migration for a reason that has nothing to do with its safety.
do $$
declare b record;
begin
  select * into b from _ce_before;
  if b.backup_rows <> b.rows then
    raise exception 'ABORT: backup holds % rows, live table holds % — refusing to delete',
      b.backup_rows, b.rows;
  end if;
  if b.rows = 0 then
    raise exception 'ABORT: course_events is empty — nothing to migrate, and the backup would be worthless';
  end if;
end $$;

-- ── DEDUPLICATE ──────────────────────────────────────────────────────────
-- Keep row rank 1 per (email, event): earliest created_at, id as tiebreak.
with ranked as (
  select id,
         row_number() over (
           partition by email, event
           order by created_at asc, id asc
         ) as rn
    from public.course_events
)
delete from public.course_events c
 using ranked r
 where c.id = r.id
   and r.rn > 1;

-- ── THE INDEX ────────────────────────────────────────────────────────────
-- This is what `onConflict: 'email,event'` needs to match.
create unique index if not exists course_events_email_event_idx
  on public.course_events (email, event);

-- ── ASSERTIONS ───────────────────────────────────────────────────────────
do $$
declare b record; a_rows bigint; a_pairs bigint;
begin
  select * into b from _ce_before;

  select count(*) into a_rows  from public.course_events;
  select count(*) into a_pairs from (select distinct email, event
                                       from public.course_events) d;

  -- THE CHECK THAT MATTERS: we removed duplicates, not data. If any distinct
  -- (email, event) pair disappeared, a person's enrollment was destroyed and
  -- this whole transaction must unwind.
  if a_pairs <> b.distinct_pairs then
    raise exception 'ABORT: distinct (email,event) pairs changed % -> % — data was removed, not duplicates',
      b.distinct_pairs, a_pairs;
  end if;

  -- After dedup, rows must equal distinct pairs by definition.
  if a_rows <> a_pairs then
    raise exception 'ABORT: % rows for % distinct pairs — duplicates remain',
      a_rows, a_pairs;
  end if;

  -- Expected shape, measured 2026-08-13: 874 -> 792, exactly 82 removed.
  -- Written as a relationship rather than hardcoded numbers so the migration
  -- stays correct if it is run against a database that has moved on.
  if b.rows - a_rows <> (b.rows - b.distinct_pairs) then
    raise exception 'ABORT: removed % rows, expected %',
      b.rows - a_rows, b.rows - b.distinct_pairs;
  end if;

  -- Nothing outside this table may have been touched.
  if (select count(*) from public.profiles) <> b.profiles then
    raise exception 'ABORT: profiles row count changed';
  end if;
  if (select count(*) from auth.users) <> b.auth_users then
    raise exception 'ABORT: auth.users row count changed';
  end if;

  -- The index must actually exist now, or the bug is not fixed.
  if not exists (
    select 1 from pg_indexes
     where schemaname = 'public'
       and tablename  = 'course_events'
       and indexname  = 'course_events_email_event_idx'
  ) then
    raise exception 'ABORT: unique index was not created';
  end if;
end $$;

-- ── REPORT ───────────────────────────────────────────────────────────────
select b.backup_rows                                      as backup_rows,
       b.rows                                             as rows_before,
       (select count(*) from public.course_events)        as rows_after,
       b.rows - (select count(*) from public.course_events) as rows_removed,
       b.distinct_pairs                                   as pairs_before,
       (select count(*) from (select distinct email, event
                                from public.course_events) d) as pairs_after,
       (select indexname from pg_indexes
         where schemaname='public' and tablename='course_events'
           and indexname='course_events_email_event_idx')  as index_created
  from _ce_before b;

commit;

-- ── EXPECTED ─────────────────────────────────────────────────────────────
--   backup_rows   874   ← must equal rows_before
--   rows_before   874
--   rows_after    792
--   rows_removed   82
--   pairs_before  792
--   pairs_after   792   ← must equal pairs_before
--   index_created course_events_email_event_idx
--
-- If pairs_after differs from pairs_before, the transaction has already
-- aborted and nothing was written.
--
-- ── ROLLBACK ─────────────────────────────────────────────────────────────
-- The deleted rows ARE recoverable: public.course_events_backup_20260813 holds
-- all 874 as they were immediately before the delete.
--
-- To restore the duplicates you must drop the index first — it is what stops
-- them going back:
--
--   begin;
--     drop index if exists public.course_events_email_event_idx;
--     insert into public.course_events
--       select * from public.course_events_backup_20260813
--        on conflict (id) do nothing;
--   commit;
--
-- That returns /api/track to failing on every call, so only do it alongside
-- reverting the route.
--
-- ── THE BACKUP TABLE IS TEMPORARY. DROP IT. ──────────────────────────────
-- Once /api/track has been observed returning 200 with a row landing in
-- production, this table has served its purpose and should go:
--
--   drop table if exists public.course_events_backup_20260813;
--
-- Left in place it becomes permanent clutter that nobody dares remove because
-- nobody remembers what it was for — and it holds 874 email addresses, so it
-- is a copy of personal data with no purpose and no retention justification.
-- The privacy policy commits to keeping usage events for 24 months; it does
-- not contemplate an indefinite duplicate of them sitting beside the original.
--
-- If you are reading this in 2027 and the table still exists: the fix was
-- verified long ago. Drop it.
