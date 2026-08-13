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


-- ── 4. COURSE_EVENTS ──────────────────────────────────────────────────────
create table if not exists public.course_events (
  id         uuid        default gen_random_uuid() primary key,
  event      text        not null,           -- 'enroll' | 'complete'
  email      text        not null,
  name       text        default '',
  created_at timestamptz default now()
);

--  LOAD-BEARING, AND IT WAS MISSING FROM PRODUCTION UNTIL 2026-08-13.
--  /api/track upserts with onConflict: 'email,event'. Postgres rejects that
--  statement outright when no matching unique constraint exists — not at
--  write time, at PLANNING time:
--
--    there is no unique or exclusion constraint matching the
--    ON CONFLICT specification
--
--  This file declared the index. The database never had it. Every analytics
--  write failed with a 500 from 2026-04-25 until migration 010 created it,
--  and because both call sites are fire-and-forget (`.catch(() => {})`) the
--  failure was invisible for 110 days while the admin dashboard kept showing
--  April's numbers.
--
--  That is the same defect this file's header warns about: a declaration here
--  is not evidence of an object there. Verify, do not assume.
create unique index if not exists course_events_email_event_idx
  on public.course_events (email, event);

alter table public.course_events enable row level security;

--  NAME MATTERS: production calls this "allow inserts". The old version of this
--  file called it "course_events: insert", which is what first revealed the
--  drift. If you rename it, rename it here too.
create policy "allow inserts" on public.course_events
  for insert with check (true);

--  THERE IS NO SELECT POLICY, and that is correct. The old file claimed a
--  "course_events: read service" policy using(false); it does not exist in
--  production. Reads are blocked by RLS default-deny instead — same outcome,
--  different mechanism. service_role bypasses RLS entirely, which is how
--  /api/stats reads this table.
--
--  OPEN ISSUE (migration 006): with_check(true) plus anon's INSERT grant means
--  anyone holding the anon key can write arbitrary rows straight past the
--  validation in /api/track. Treat the contents as untrusted until fixed.


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
--  · The syllabus grew from 22 lessons to 26 on 2026-04-20. Accounts created
--    before that date qualify for a certificate at 22 completions; everyone
--    since must complete all 26. See src/data/courseData.js.
-- ═══════════════════════════════════════════════════════════════════════════
