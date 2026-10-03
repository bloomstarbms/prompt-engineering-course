-- ═══════════════════════════════════════════════════════════════════════════
--  Prompten — Supabase schema
--
--  STATUS: describes PRODUCTION AS IT ACTUALLY IS, as of 2026-08-05, after
--  migrations 000, 001, 004, 005a and 005b in supabase/migrations/.
--
--  ─── READ THIS BEFORE RUNNING ANYTHING ───────────────────────────────────
--  This file is a faithful description, for reproducing the schema on a FRESH
--  project and for orienting anyone auditing the live one. It is NOT a patch
--  to apply to the existing database. Several statements here are already in
--  place; the numbered migrations are the source of truth for changes.
--
--  The previous version of this file drifted from reality and that drift went
--  unnoticed until a security audit. It described a course_events policy named
--  "course_events: insert" (production calls it "allow inserts") and a
--  "course_events: read service" policy using(false) that does not exist in
--  production at all. It also implied narrow table grants that were never in
--  force. Anyone reasoning from it reached wrong conclusions about who could
--  read what. Keep it accurate or delete it — a confidently wrong map is worse
--  than none.
--  ─────────────────────────────────────────────────────────────────────────
--
--  VERIFY THIS FILE AGAINST REALITY — run these, compare, and fix whichever is
--  wrong:
--
--    select tablename, rowsecurity from pg_tables where schemaname = 'public';
--
--    select tablename, policyname, cmd, qual, with_check
--      from pg_policies where schemaname = 'public' order by tablename, policyname;
--
--    select table_name, grantee, privilege_type
--      from information_schema.role_table_grants
--     where table_schema = 'public' and grantee in ('anon','authenticated')
--     order by table_name, grantee, privilege_type;
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;   -- gen_random_bytes for certificate ids


-- ═══════════════════════════════════════════════════════════════════════════
--  IMPORTANT: HOW PRIVILEGES ACTUALLY WORK HERE
--
--  Supabase grants ALL privileges on tables in the `public` schema to the
--  `anon` and `authenticated` roles by default. Production currently shows
--  DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE for both roles
--  on most tables — NOT the narrow grants the old version of this file listed.
--
--  The practical consequence: **RLS is the only barrier**, not a second one.
--  A new table created without `enable row level security` is immediately
--  world-readable and world-writable by anyone holding the anon key, which is
--  published in the client bundle by design.
--
--  Explicit revokes applied so far (see 000 and 005b):
--    · certificates: SELECT revoked from anon and PUBLIC
--    · certificates: INSERT revoked from anon, authenticated and PUBLIC
--
--  Migration 007 is intended to reduce the remaining blanket grants to what
--  each role genuinely needs. Until then, treat every RLS policy below as
--  load-bearing.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1. PROFILES ───────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid references auth.users on delete cascade primary key,
  name       text not null default '',
  bio        text          default '',
  avatar_url text          default '',
  created_at timestamptz   default now()
);

alter table public.profiles enable row level security;

create policy "profiles: read own"   on public.profiles for select using (auth.uid() = id);
create policy "profiles: insert own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles: update own" on public.profiles for update using (auth.uid() = id);
-- No DELETE policy: deletes are denied by RLS default-deny. Intentional.


-- ── 2. PROGRESS ───────────────────────────────────────────────────────────
--  One row per user.
--
--  NOTE — there is deliberately NO created_at column, and this matters. The
--  only timestamp is updated_at, which is rewritten on every save, so it
--  records when someone last studied rather than when they started. It cannot
--  be used to determine which syllabus cohort a learner belongs to; the
--  certificate grandfather clause uses auth.users.created_at for that reason
--  (see LEGACY_SYLLABUS_LESSONS in src/data/courseData.js).
create table if not exists public.progress (
  id          uuid        default gen_random_uuid() primary key,
  user_id     uuid        references auth.users on delete cascade unique not null,
  completed   jsonb       default '{}',      -- { "moduleIndex-lessonIndex": true }
  quiz_scores jsonb       default '{}',      -- { "m-l": { score, total, passed } }
  last_lesson jsonb       default '{"m":0,"l":0}',
  updated_at  timestamptz default now()
);

alter table public.progress enable row level security;

--  FOR ALL with USING and no WITH CHECK: Postgres reuses the USING expression
--  as the check, so inserts and updates are both constrained to the caller's
--  own row.
--
--  What this does NOT constrain is the row's CONTENTS. A signed-in user can
--  write any quiz_scores and completed values they like. Combined with quiz
--  answer keys shipping in the client bundle and grading running in the
--  browser, scores are self-reported by construction. This is an accepted
--  property of a free unproctored course, not an oversight — the certificate
--  wording reflects it. Do not build a trust claim on this table.
create policy "progress: manage own" on public.progress for all using (auth.uid() = user_id);


-- ── 3. CERTIFICATES ───────────────────────────────────────────────────────
create table if not exists public.certificates (
  id             uuid        default gen_random_uuid() primary key,
  user_id        uuid        references auth.users on delete cascade,
  cert_id        text        unique not null,   -- assigned by trigger, never by the client
  legacy_cert_id text,                          -- pre-rotation id, keeps old links alive (001/004)
  name           text        not null,
  email          text        not null,
  pct            integer     default 0,
  grade          text        default 'F',
  module_scores  jsonb       default '[]',
  total_correct  integer     default 0,
  total_possible integer     default 0,
  syllabus_size  integer,                       -- lessons in the syllabus at issuance (005a)
  issued_at      timestamptz default now()
);

--  One certificate per user (004). Verified 0 duplicates before applying.
alter table public.certificates
  add constraint certificates_user_id_key unique (user_id);

--  Partial: legacy ids must be unique, but are NULL for anything issued after
--  the rotation and NULLs must not collide.
create unique index if not exists certificates_legacy_cert_id_key
  on public.certificates (legacy_cert_id) where legacy_cert_id is not null;

alter table public.certificates enable row level security;

--  Owner-scoped read. Replaced a `using (true)` policy that, combined with a
--  SELECT grant to anon, allowed anyone holding the public anon key to read
--  every row — names and email addresses included (000).
create policy "certificates: read own"
  on public.certificates for select using (auth.uid() = user_id);

--  KEPT DELIBERATELY, though unreachable: 005b revoked INSERT from
--  authenticated, so no client can reach this. It remains as defence in depth —
--  if the grant is ever restored by a migration, a dashboard click or a
--  restored backup, an insert is still confined to the caller's own user_id
--  rather than allowing certificates issued in someone else's name.
create policy "certificates: insert own"
  on public.certificates for insert with check (auth.uid() = user_id);

--  No UPDATE or DELETE policy: both denied by RLS default-deny.


-- ── 4. COURSE_EVENTS — DROPPED ────────────────────────────────────────────
--  Retired by supabase/migrations/015_drop_course_events.sql. It held name and
--  email per registration and completion, written by /api/track (removed in
--  6b02b77), had no foreign key to auth.users, and nothing read it after the
--  admin stats moved to auth.users, progress and certificates. Its definition
--  is deleted here, not commented out, so a fresh setup doesn't recreate it.
--  The table's history is in migrations 000, 010 and 011 and in
--  SECURITY-NOTES.md.


-- ═══════════════════════════════════════════════════════════════════════════
--  FUNCTIONS AND TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════

--  Crockford base32 — alphabet omits I, L, O and U so ids survive being read
--  aloud, hand-copied off a printed certificate, or retyped from a PDF (004).
create or replace function public.crockford_b32(p_bytes bytea)
returns text language plpgsql immutable as $$
declare
  alphabet constant text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  bits text := ''; out_s text := ''; i int;
begin
  for i in 0 .. length(p_bytes) - 1 loop
    bits := bits || get_byte(p_bytes, i)::bit(8)::text;
  end loop;
  while length(bits) % 5 <> 0 loop bits := bits || '0'; end loop;
  for i in 1 .. length(bits) / 5 loop
    out_s := out_s || substr(alphabet, (substr(bits, (i - 1) * 5 + 1, 5))::bit(5)::int + 1, 1);
  end loop;
  return out_s;
end $$;

--  128 bits from a CSPRNG. Replaced a client-side djb2 hash that yielded ~31
--  bits behind an 8-character facade — measured, the first collision landed at
--  ~55,700 generations (004).
create or replace function public.generate_cert_id()
returns text language sql volatile as $$
  select 'PE-' || public.crockford_b32(gen_random_bytes(16));
$$;

--  Assigns cert_id unconditionally, so the column is not writable by any
--  client regardless of what it sends, on every insert path including the
--  server issuance route. legacy_cert_id is forced NULL on insert so a caller
--  cannot squat or alias an id it does not own (004).
create or replace function public.certificates_set_cert_id()
returns trigger language plpgsql as $$
begin
  new.cert_id        := public.generate_cert_id();
  new.legacy_cert_id := null;
  return new;
end $$;

drop trigger if exists certificates_set_cert_id_trg on public.certificates;
create trigger certificates_set_cert_id_trg
  before insert on public.certificates
  for each row execute function public.certificates_set_cert_id();

--  Public verification (001). SECURITY DEFINER so anon needs no table grant.
--  Returns six non-PII columns — deliberately NOT email — for an exact id
--  match only, so the table cannot be listed or enumerated. Matches
--  legacy_cert_id too, so links shared before the 004 rotation still resolve.
--  `set search_path` is required: without it a caller could shadow
--  `certificates` with a table of their own.
create or replace function public.verify_certificate(p_cert_id text)
returns table (
  cert_id text, name text, pct integer,
  grade text, module_scores jsonb, issued_at timestamptz
)
language sql security definer set search_path = public, pg_temp stable as $$
  select c.cert_id, c.name, c.pct, c.grade, c.module_scores, c.issued_at
    from public.certificates c
   where c.cert_id = p_cert_id or c.legacy_cert_id = p_cert_id
   limit 1;
$$;

revoke all on function public.verify_certificate(text) from public;
grant execute on function public.verify_certificate(text) to anon, authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
--  EXPLICIT REVOKES (000, 005b)
--
--  These undo parts of Supabase's default blanket grants. On a fresh project
--  they must be applied, or the protections above are not in force.
-- ═══════════════════════════════════════════════════════════════════════════

revoke select on public.certificates from anon;
revoke select on public.certificates from public;

revoke insert on public.certificates from authenticated;
revoke insert on public.certificates from anon;
revoke insert on public.certificates from public;


-- ═══════════════════════════════════════════════════════════════════════════
--  KNOWN STATE, RECORDED SO IT IS NOT REDISCOVERED AS A SURPRISE
--
--  · 33 certificates exist. All carry legacy_cert_id (all predate the 004
--    rotation) and all have syllabus_size NULL — deliberately not backfilled,
--    because issued_at is when the row was written, not when the learner
--    finished, and a guessed value would look authoritative while being wrong.
--
--  · One of those 33 is a QA account created 2026-08-05 to verify server-side
--    issuance end to end. It was kept intentionally. Completion counts are
--    therefore one higher than reality.
--
--  · 31 certificate holders' names and email addresses were publicly readable
--    until 2026-08-05. API logs retain 24 hours on the free plan and showed no
--    unauthorised access in that window, but the table predates it by far. The
--    accurate position is: exposed, access unknown.
--
--  · The syllabus grew from 22 lessons to 26 on 2026-04-20. A certificate
--    requires every lesson in the current syllabus, for everyone: the
--    created_at grandfather clause was removed on 29 Sep 2026 because no
--    account predated the cutoff (see src/data/courseData.js and
--    CERTIFICATE-CLAIMS.md for how pre-Supabase claims are handled).
-- ═══════════════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════════════════
--  REVIEWS (migration 014, 1 October 2026)
--
--  APPENDED, NOT REGENERATED. SECURITY-NOTES.md still says this file should be
--  regenerated from the live schema rather than patched; that needs pg_dump or
--  the dashboard's schema export, neither of which this change had. Until it
--  is regenerated, the authoritative definition of `reviews` is
--  supabase/migrations/014_reviews.sql, which also carries the assertions and
--  the verify-by-attempting steps. The summary below is for orientation.
--
--  create table public.reviews (
--    id uuid pk, user_id uuid unique references auth.users ON DELETE CASCADE,
--    body text (20–600), attribution text ('first_initial'|'full'),
--    display_name text, status text ('pending'|'approved'|'rejected'|'unpublished'),
--    consent_version text, submitted_at, updated_at, decided_at,
--    decided_by uuid references auth.users ON DELETE SET NULL
--  );
--  RLS enabled, NO policies. ALL revoked from PUBLIC, anon, authenticated;
--  ALL granted to service_role. The browser never touches it.
-- ═══════════════════════════════════════════════════════════════════════════
