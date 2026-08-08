-- 006_consent_timestamp.sql
--
-- Records that a user confirmed they are 18 or older and accepted the Terms
-- and Privacy Policy at registration.
--
-- WHY THIS EXISTS
-- The checkbox on the signup form is an attestation: the user ticks it, and
-- nothing survives the request. That is assertable but not evidenceable. A
-- timestamp written server-side turns "we ask everyone" into "here is when
-- this person agreed", which is the difference that matters if it is ever
-- questioned.
--
-- WHY NOW RATHER THAN LATER
-- The record is only complete if it starts before the next registration.
-- Every account created between the checkbox shipping and this column
-- existing is a permanent gap in the record.
--
-- NULL IS MEANINGFUL, NOT MISSING DATA
-- Two groups will have consented_at IS NULL, and both are accurate:
--   * The 814 accounts that predate the documents existing.
--   * Legacy localStorage accounts migrated during sign-in, who never saw a
--     checkbox — the register endpoint takes an explicit legacyMigration flag
--     for exactly this case.
-- Those rows are the population for a one-time in-app acceptance, should that
-- route be taken. Do not backfill them with a timestamp: inventing a consent
-- date for someone who never consented is worse than having no date.

alter table public.profiles
  add column if not exists consented_at timestamptz;

comment on column public.profiles.consented_at is
  'When the user confirmed 18+ and accepted the Terms and Privacy Policy at registration. Written server-side only. NULL means never asked (pre-dates the documents, or migrated from a legacy account) — it does not mean refused.';

-- ─── THESE TWO STATEMENTS DO NOTHING. SEE 007. ───────────────────────────
-- Kept because they were applied to production, and a migration file should
-- say what was run rather than what was meant.
--
-- The intent was right: the value is only evidence if the subject cannot
-- write it, and profiles has RLS allowing a user to update their own row.
-- The mechanism was wrong. In PostgreSQL a column-level REVOKE cannot
-- subtract from a table-level grant, and Supabase grants UPDATE on the whole
-- table to `authenticated`. So this revoked a permission that was never
-- separately held and left the column writable.
--
-- Confirmed after applying:
--   select has_column_privilege('authenticated','public.profiles',
--                               'consented_at','UPDATE');   -- true
--
-- 007 pins the column with a trigger instead. Do not delete these lines
-- thinking they are the protection.
revoke update (consented_at) on public.profiles from authenticated;
revoke update (consented_at) on public.profiles from anon;

-- Verification — run after applying.
-- Expect: one row, data_type timestamp with time zone.
--   select column_name, data_type
--   from information_schema.columns
--   where table_schema = 'public' and table_name = 'profiles'
--     and column_name = 'consented_at';
--
-- The second check originally here read information_schema.column_privileges
-- and expected no UPDATE row. It has been removed because it cannot answer the
-- question: that view reports a column as updatable whether the privilege came
-- from the column or from the whole table, so it returns the same result
-- whether the revoke worked or not. It would have read as confirmation.
--
-- The real check is in 007, and it is an attempted write rather than a
-- catalogue query.
