-- ═══════════════════════════════════════════════════════════════════════════
--  005a_certificate_syllabus_size.sql
--
--  PURPOSE
--    Record, on each certificate, how many lessons the syllabus contained when
--    it was issued.
--
--  WHY
--    The course grew from 22 lessons to 26 on 2026-04-20 (commit a86ad6f).
--    Nothing recorded that. Completion was derived from the live MODULES array,
--    so the moment the syllabus grew, every learner who had finished the
--    22-lesson course silently stopped qualifying — no code change, no policy
--    decision, no trace. Storing the size at issuance makes the syllabus a
--    property of the certificate rather than of whatever the deploy happens to
--    contain today.
--
--  NUMBERING
--    005a because it must land before 005b_revoke_authenticated_insert.sql, and
--    before the client that writes this column deploys.
--
--  ORDER — IMPORTANT
--    Run this BEFORE deploying the accompanying commit. That commit's issuance
--    route inserts syllabus_size; without the column the insert fails and
--    nobody can claim a certificate. Additive and safe to run early: existing
--    code never references the column.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

alter table public.certificates
  add column if not exists syllabus_size integer;

comment on column public.certificates.syllabus_size is
  'Number of lessons in the syllabus when this certificate was issued. NULL for '
  'the 32 certificates issued before this column existed — their syllabus was '
  'either 22 or 26 lessons and the distinction was never recorded, so it is left '
  'unknown rather than guessed.';

-- ── POST-CHECK ────────────────────────────────────────────────────────────
do $$
declare has_col boolean;
begin
  select exists (
    select 1 from information_schema.columns
     where table_schema = 'public'
       and table_name   = 'certificates'
       and column_name  = 'syllabus_size'
  ) into has_col;

  if not has_col then
    raise exception 'ABORT: syllabus_size column was not created';
  end if;

  raise notice 'OK: certificates.syllabus_size present. Existing rows left NULL by design.';
end $$;

commit;

-- ── DELIBERATELY NOT BACKFILLED ───────────────────────────────────────────
--  The 32 existing certificates could be guessed at from issued_at against the
--  2026-04-20 syllabus change, but issued_at is when the row was written, not
--  when the learner finished, and the rotation in 004 did not alter it. A wrong
--  value here would be worse than an honest NULL, because it would look
--  authoritative. Leave them unknown.

-- ── VERIFY ────────────────────────────────────────────────────────────────
--    select count(*) as total, count(syllabus_size) as with_size
--      from public.certificates;
--
--    Expect immediately after this migration: total = 32, with_size = 0.
--    Newly issued certificates will populate it.

-- ── ROLLBACK ──────────────────────────────────────────────────────────────
--    alter table public.certificates drop column if exists syllabus_size;
--    (Only safe if the accompanying commit has been reverted — the issuance
--     route writes this column.)
