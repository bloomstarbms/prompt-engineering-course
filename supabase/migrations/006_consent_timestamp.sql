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

-- The value is only evidence if the subject cannot write it.
--
-- profiles has RLS allowing a user to update their own row, which would let
-- anyone set their own consent date to whatever they liked. A column-level
-- revoke closes that without touching the row policies: the user keeps full
-- control of name, bio and avatar_url and cannot touch this one. The register
-- endpoint writes it with the service role, which is not subject to either.
revoke update (consented_at) on public.profiles from authenticated;
revoke update (consented_at) on public.profiles from anon;

-- Verification — run after applying.
-- Expect: one row, data_type timestamp with time zone.
--   select column_name, data_type
--   from information_schema.columns
--   where table_schema = 'public' and table_name = 'profiles'
--     and column_name = 'consented_at';
--
-- Expect: NO row containing 'UPDATE' for consented_at.
--   select grantee, privilege_type
--   from information_schema.column_privileges
--   where table_schema = 'public' and table_name = 'profiles'
--     and column_name = 'consented_at';
