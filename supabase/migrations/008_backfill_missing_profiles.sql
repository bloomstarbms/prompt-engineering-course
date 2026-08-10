-- 008_backfill_missing_profiles.sql
--
-- Creates the missing public.profiles rows for auth users that never got one.
--
-- ─── WHAT WAS ACTUALLY BROKEN ────────────────────────────────────────────
-- This is not about a consent banner. An auth user with no profiles row is a
-- broken account:
--
--   * NO DISPLAY NAME ANYWHERE. useAuth falls back to the email prefix, so
--     the header, the sidebar and the profile page all show a mangled version
--     of their email address instead of their name.
--   * NO CERTIFICATE, EVER. /api/certificates/issue reads the name from
--     profiles and returns 400 "Please set your display name before claiming
--     your certificate" when it is missing. There was no way for these users
--     to satisfy that, because the page that sets a name had no row to write.
--   * NO CONSENT RECORD POSSIBLE. /api/consent updated zero rows and — until
--     the fix in the same series as this migration — reported success anyway.
--
-- 18 of the 54 have progress rows, i.e. they have been working through the
-- course and would have hit the certificate wall at the end. 0 have
-- certificates, which is consistent with that and is how we know none of them
-- got through.
--
-- ─── WHERE THEY CAME FROM ────────────────────────────────────────────────
-- The registration route created on 2026-04-25 (7cd2046, "bypass email
-- confirmation") wrote the profile row with an unchecked upsert: if the write
-- failed the route still returned ok. The first missing row is dated
-- 2026-04-25, the same day. That swallowed result was only fixed on
-- 2026-08-09 (1b1c4d1).
--
-- HONEST CAVEAT ON THE DATES. The rows stop on 2026-06-21, seven weeks BEFORE
-- that fix, so the fix cannot be what stopped them. This is not the "no
-- signups, so no evidence" case — there have been 98 signups since, at a prior
-- failure rate of 7.4% (53 of 720), and none of them are missing a row. So
-- something changed in June that is not in the git history; the likeliest
-- explanation is traffic shape, since an unchecked write loses races under the
-- launch burst and not under a trickle. That is a hypothesis. Do not record it
-- as the cause.
--
-- ─── WHY name = '' AND NOT A NAME DERIVED FROM THE EMAIL ─────────────────
-- Deriving "john.smith" from john.smith@example.com would put a guess on a
-- certificate. The name column is NOT NULL with a '' default, and the existing
-- set-your-display-name flow already handles the empty case:
--
--   useAuth        profileName = '' and no user_metadata.name  ->
--                  nameIsDefault = true (verified: all 54 have NULL metadata
--                  name, so none of them self-heal on sign-in either)
--   ProfilePage    renders the "Your name isn't set yet" banner on
--                  nameIsDefault
--   CertificatePage  nameConfirmed starts false, so it asks before issuing
--   updateProfile  upserts on conflict id, so saving a name updates the row
--                  this migration creates
--
-- The empty string is the truthful value: we do not know their name.
--
-- ─── created_at COMES FROM auth.users, NOT now() ─────────────────────────
-- The column defaults to now(). Taking the default would date all 54 accounts
-- to the moment of the backfill and quietly corrupt any question of the form
-- "when did this person join" — including the newest-account check used to
-- verify registration. Copy the real value.
--
-- consented_at stays NULL. They have not consented. NULL means never asked.

begin;

-- ── BEFORE ───────────────────────────────────────────────────────────────
-- Expect: auth_users 818, profile_rows 764, missing 54
select 'BEFORE' as stage,
       (select count(*) from auth.users)                              as auth_users,
       (select count(*) from public.profiles)                         as profile_rows,
       (select count(*) from auth.users u
          left join public.profiles p on p.id = u.id
         where p.id is null)                                          as missing;

-- ── THE BACKFILL ─────────────────────────────────────────────────────────
-- Insert-only. No UPDATE, no upsert, no ON CONFLICT DO UPDATE: an existing
-- row must not be touched by this, and the NOT EXISTS makes that structural
-- rather than a promise. Re-running it inserts nothing.
insert into public.profiles (id, name, bio, avatar_url, created_at, consented_at)
select u.id, '', '', '', u.created_at, null
  from auth.users u
 where not exists (select 1 from public.profiles p where p.id = u.id);

-- ── AFTER ────────────────────────────────────────────────────────────────
-- Expect: profile_rows 818, missing 0, backfilled 54, and consented UNCHANGED
-- at whatever it was before. If `consented` moved, something wrote a consent
-- timestamp and this must be rolled back.
select 'AFTER' as stage,
       (select count(*) from auth.users)                              as auth_users,
       (select count(*) from public.profiles)                         as profile_rows,
       (select count(*) from auth.users u
          left join public.profiles p on p.id = u.id
         where p.id is null)                                          as missing,
       (select count(*) from public.profiles where name = '')         as blank_names,
       (select count(*) from public.profiles
         where consented_at is not null)                              as consented;

-- READ THE TWO ROWS ABOVE BEFORE COMMITTING.
--   missing must be 0
--   profile_rows must be exactly auth_users
--   consented must equal the baseline (1 as measured 2026-08-09)
-- If any of those is wrong, run ROLLBACK; instead of COMMIT;

commit;

-- ── ROLLBACK, AFTER COMMIT ───────────────────────────────────────────────
-- Backfilled rows are identifiable by being blank in every user-supplied
-- field. Narrow, and it cannot touch a row somebody has since edited:
--
--   delete from public.profiles
--    where name = '' and coalesce(bio,'') = '' and coalesce(avatar_url,'') = ''
--      and consented_at is null;
--
-- Check what it would remove first:
--   select count(*) from public.profiles
--    where name = '' and coalesce(bio,'') = '' and coalesce(avatar_url,'') = ''
--      and consented_at is null;
--
-- NOTE: that count may exceed 54 if any pre-existing row was already blank in
-- all four fields. Confirm the number before deleting.

-- ── AFTERWARDS ───────────────────────────────────────────────────────────
-- These 54 now have a working set-your-name flow but still cannot claim a
-- certificate until they use it, which is correct — the certificate should
-- carry a name they chose. 18 of them have progress and may be close to the
-- end. Consider whether they are worth an email; that is a product decision,
-- not a database one.
