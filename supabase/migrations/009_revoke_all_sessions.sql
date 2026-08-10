-- 009_revoke_all_sessions.sql
--
-- Revokes every active auth session, for every user.
--
-- ─── WHY GLOBAL, WHEN THE INCIDENT AFFECTED A SUBSET ─────────────────────
-- From 2026-04-25 to 2026-08-10, Supabase Auth had
--   Site URL:            https://promptmastery.com
--   Redirect allow-list: https://promptmastery.com/**
-- and prompten.xyz in neither. The app correctly asked for
-- redirectTo=https://www.prompten.xyz/reset-password; it matched no allow-list
-- entry, so Supabase discarded it and fell back to the Site URL.
--
-- Recovery links therefore resolved to a domain nobody here owns, which serves
-- a GoDaddy sales page — REGISTERED TO A THIRD PARTY, not unregistered. Those
-- redirects reached someone else's property rather than failing into a void,
-- carrying #access_token and #refresh_token in the fragment. Reading a fragment
-- needs JavaScript on the destination page; parking pages run scripts. No
-- evidence of capture exists, and none can be obtained.
--
-- THE FIRST DRAFT OF THIS MIGRATION WAS SCOPED BACKWARDS. It filtered on
-- `recovery_sent_at IS NOT NULL`, believing that marked everyone sent a
-- recovery email. It does not: Supabase CLEARS recovery_sent_at when a
-- recovery is consumed. Verified directly — bloomstar042@gmail.com showed a
-- timestamp before completing a reset and NULL immediately after, with
-- recovery_token blanked and the project-wide count falling 46 -> 45.
--
-- So that column marks recoveries SENT AND NOT USED. The people at risk are
-- exactly the ones who DID use theirs — whose flag is therefore cleared. The
-- filter excluded the population it was written to protect, and would have
-- signed out 45 people who were never exposed while missing everyone who was.
-- It would have produced moving counts and passing assertions the whole way.
--
-- The at-risk set is therefore UNIDENTIFIABLE:
--   * auth.audit_log_entries is empty — 0 rows, including today. Retention
--     purged it or events never landed there. Click counts are unrecoverable.
--   * recovery_sent_at is cleared on use, so it cannot reconstruct history.
-- The only scope that provably contains an unidentifiable set is everyone.
--
-- ─── WHAT THIS COSTS, MEASURED 2026-08-10 ────────────────────────────────
--   8296 sessions across 800 distinct users
--      2 active in the last hour
--     10 active in the last 24 hours
--     43 active in the last 7 days
--   oldest session 2026-04-25
--
-- 8296 rows sounds large; 800 users is the real number, and only ~43 have
-- touched the site in a week. Sessions accumulate per browser and never expire
-- on their own, so most of these are long-abandoned. RUN AT A QUIET HOUR:
-- with 2 sessions active in the last hour, the live blast radius is very
-- small.
--
-- ─── WHAT A USER LOSES, NOT JUST WHAT THEY REDO ──────────────────────────
-- Answered by reading the client, not assumed:
--
--   Lesson completions and quiz results  SAFE. updateProgress() takes an
--     `immediate = true` flag for exactly these, which clears the debounce
--     timer and writes straight away. The comment on it says so: "so the save
--     isn't lost if the user closes the tab within 800ms."
--
--   Resume position (lastLesson)         AT RISK, up to 800ms. Position-only
--     updates stay debounced. Worst case someone reopens on the previous
--     lesson. Nothing is lost that re-reading a page does not restore.
--
--   A quiz in progress                   LOST, and this is the real cost.
--     QuizView holds `answers` in component state and only calls onDone() at
--     handleContinue, after submit. Nothing reaches the database until the
--     quiz is finished. Revoking mid-quiz discards the answers so far; the
--     quiz is retaken from the start. Quizzes are short and retakeable, and at
--     most a couple of people can be mid-quiz at a quiet hour.
--
--   The beforeunload flush               DOES NOT HELP HERE. It fires on page
--     close and hook unmount, not on session revocation — the tab stays open.
--     What actually happens: the next Supabase token refresh fails, the client
--     receives SIGNED_OUT, and the handler at useAuth clears saveTimer,
--     progressRef, userIdRef and tokenRef before setUser(null). That is
--     deliberate — it stops a stale save landing after sign-out — but it means
--     a pending debounced write is DISCARDED rather than flushed. Only the
--     <=800ms position write is exposed to this; completions and quiz scores
--     already went out immediately.
--
-- Net: nobody loses completed work. Someone mid-quiz retakes a quiz.
--
-- ─── SCOPE: SESSIONS ONLY ────────────────────────────────────────────────
-- One DELETE, against auth.sessions, and nothing else. This file does not
-- touch — and contains no statement that could touch —
--   public.profiles       (names, bios, avatars, consented_at)
--   public.progress       (completions, quiz scores, resume position)
--   public.certificates   (issued credentials)
--   public.course_events  (usage events)
--   auth.users            (no password reset, no disable, no delete)
-- consented_at in particular is untouched: this migration must not create,
-- move or destroy consent evidence, and it contains no reference to it.
--
-- auth.refresh_tokens rows are removed by the FK cascade from auth.sessions,
-- which is the point — a captured refresh token is the thing that outlives the
-- configuration fix.

begin;

create temp table _rev_before on commit drop as
select (select count(*) from auth.sessions)                  as sessions,
       (select count(distinct user_id) from auth.sessions)    as users,
       (select count(*) from public.profiles)                 as profiles,
       (select count(*) from public.progress)                 as progress,
       (select count(*) from public.certificates)             as certificates,
       (select count(*) from public.profiles
         where consented_at is not null)                      as consented;

delete from auth.sessions;

do $$
declare b record;
begin
  select * into b from _rev_before;

  if (select count(*) from auth.sessions) <> 0 then
    raise exception 'ABORT: sessions remain after revocation';
  end if;

  -- Everything below is the proof that nothing else moved. If any of these
  -- fire, the transaction rolls back and no session was revoked either.
  if (select count(*) from public.profiles) <> b.profiles then
    raise exception 'ABORT: profiles row count changed (% -> %)',
      b.profiles, (select count(*) from public.profiles);
  end if;

  if (select count(*) from public.progress) <> b.progress then
    raise exception 'ABORT: progress row count changed (% -> %)',
      b.progress, (select count(*) from public.progress);
  end if;

  if (select count(*) from public.certificates) <> b.certificates then
    raise exception 'ABORT: certificates row count changed (% -> %)',
      b.certificates, (select count(*) from public.certificates);
  end if;

  if (select count(*) from public.profiles where consented_at is not null) <> b.consented then
    raise exception 'ABORT: consent evidence changed (% -> %)',
      b.consented, (select count(*) from public.profiles where consented_at is not null);
  end if;
end $$;

select b.sessions     as sessions_revoked,
       b.users        as users_signed_out,
       b.profiles     as profiles_untouched,
       b.progress     as progress_untouched,
       b.certificates as certificates_untouched,
       b.consented    as consent_records_untouched
  from _rev_before b;

commit;

-- ─── NO ROLLBACK, DELIBERATELY ───────────────────────────────────────────
-- A revoked session is meant to stay revoked. The observable effect is that
-- users sign in again. No password changes, no account is disabled, no user
-- data is removed. Password recovery works correctly as of today, which was
-- not true before, so anyone who has forgotten their password has a route.
