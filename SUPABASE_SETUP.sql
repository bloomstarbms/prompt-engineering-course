-- ═══════════════════════════════════════════════════════════════════
--  Prompten — Supabase database setup
--  Run this entire file in: Supabase Dashboard > SQL Editor > New Query
-- ═══════════════════════════════════════════════════════════════════

-- 1. PROFILES  (stores name, bio, avatar per user)
-- ─────────────────────────────────────────────────
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


-- 2. PROGRESS  (one row per user — completed lessons, quiz scores, last position)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.progress (
  id          uuid        default gen_random_uuid() primary key,
  user_id     uuid        references auth.users on delete cascade unique not null,
  completed   jsonb       default '{}',
  quiz_scores jsonb       default '{}',
  last_lesson jsonb       default '{"m":0,"l":0}',
  updated_at  timestamptz default now()
);

alter table public.progress enable row level security;

create policy "progress: manage own" on public.progress for all using (auth.uid() = user_id);


-- 3. CERTIFICATES  (issued on course completion)
-- ─────────────────────────────────────────────
create table if not exists public.certificates (
  id             uuid        default gen_random_uuid() primary key,
  user_id        uuid        references auth.users on delete cascade,
  cert_id        text        unique not null,
  name           text        not null,
  email          text        not null,
  pct            integer     default 0,
  grade          text        default 'F',
  module_scores  jsonb       default '[]',
  total_correct  integer     default 0,
  total_possible integer     default 0,
  issued_at      timestamptz default now()
);

alter table public.certificates enable row level security;

-- Anyone can read a certificate (for the public verify page)
create policy "certificates: read all"       on public.certificates for select using (true);
-- Only the owner can create their own certificate
create policy "certificates: insert own"     on public.certificates for insert with check (auth.uid() = user_id);


-- 4. COURSE_EVENTS  (enrollment + completion analytics)
-- ──────────────────────────────────────────────────────
create table if not exists public.course_events (
  id         uuid        default gen_random_uuid() primary key,
  event      text        not null,           -- 'enroll' | 'complete'
  email      text        not null,
  name       text        default '',
  created_at timestamptz default now()
);

-- One event type per email (no duplicate enroll/complete rows)
create unique index if not exists course_events_email_event_idx
  on public.course_events (email, event);

alter table public.course_events enable row level security;

-- Server API routes insert via the anon key — allow all inserts
create policy "course_events: insert" on public.course_events
  for insert with check (true);

-- Only the service-role key (admin stats route) can read
-- Regular users and the anon key cannot query this table
create policy "course_events: read service" on public.course_events
  for select using (false);


-- ═══════════════════════════════════════════════════════════════════
--  TABLE-LEVEL GRANTS
--  RLS policies control *which rows* each role can see, but PostgreSQL
--  also requires the role to have the basic table privilege before
--  it even evaluates the RLS policy.  Without these grants, the anon
--  role gets silent "permission denied" errors on public-facing pages
--  (e.g. the verify page) even though the RLS policy says using(true).
-- ═══════════════════════════════════════════════════════════════════

-- certificates: anon can read (for the public /verify page);
--               authenticated users can read + insert their own
grant select           on public.certificates  to anon;
grant select, insert   on public.certificates  to authenticated;

-- profiles: only authenticated users read/write their own row
grant select, insert, update on public.profiles  to authenticated;

-- progress: only authenticated users read/write their own row
grant select, insert, update on public.progress  to authenticated;

-- course_events: server API (anon key) inserts; service role reads
grant insert on public.course_events to anon;
grant select on public.course_events to authenticated;
