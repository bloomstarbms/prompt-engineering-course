-- ═══════════════════════════════════════════════════════════════════════════
--  014_reviews.sql — course reviews, moderated before publication
--
--  One review per certificate holder, text only, held as `pending` until
--  the owner approves it. The browser NEVER touches this table: every read
--  and write goes through server routes using the service role. There are
--  therefore no RLS policies here at all — RLS is enabled so a future
--  accidental grant still exposes nothing, and all privileges are revoked
--  from PUBLIC, anon and authenticated explicitly, because a new table in
--  `public` otherwise inherits Supabase's default grants (ALL to anon and
--  authenticated). That trap has bitten this project twice (migration 010's
--  backup table; see SUPABASE_SETUP.sql "HOW PRIVILEGES ACTUALLY WORK HERE").
--
--  THREE THINGS THIS SCHEMA EXISTS TO GUARANTEE
--  1. A review cannot outlive its author. user_id references auth.users with
--     ON DELETE CASCADE. course_events had no FK and its rows outlived the
--     accounts that wrote them, which put us in breach of our own privacy
--     policy. Not again.
--  2. Nothing reaches this table but the service role. Checked below by
--     reading the stored ACL, and after running, by ATTEMPTING the forbidden
--     reads and writes (see the end of this file) rather than trusting the
--     catalogue — migration 006's lesson.
--  3. Consent is recorded as evidence. consent_version is the privacy
--     policy's "Last updated" date as shown to the person at the moment they
--     submitted, written by the server route from its own constant, never
--     from the client.
--
--  Columns, and why each exists:
--    body             the review. 20–600 characters, enforced here as well as
--                     in the route, so a bypassed route cannot store a novel
--                     or an empty string.
--    attribution      'first_initial' (default in the UI) or 'full'. How the
--                     name is shown, chosen by the author.
--    display_name     the text that will actually appear, derived by the
--                     server from certificates.name at submission ("First L."
--                     or the full name). Stored, not recomputed, so a later
--                     profile rename cannot change a published attribution.
--    status           pending → approved | rejected; approved → unpublished.
--                     Only the owner moves it. An author's edit returns it to
--                     pending (the route does that; it is not a trigger).
--    consent_version  see 3 above.
--    submitted_at     first submission. updated_at: last edit by the author.
--    decided_at/by    the owner's last moderation action and who took it.
--                     decided_by is ON DELETE SET NULL: the decision stands
--                     even if the deciding account is ever removed.
--
--  Not here, deliberately: a rating column (decided against — text only),
--  and any trigger logic. The rules live in the routes, which are the only
--  writers.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

create table public.reviews (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null unique
                               references auth.users (id) on delete cascade,
  body             text        not null
                               check (char_length(body) between 20 and 600),
  attribution      text        not null
                               check (attribution in ('first_initial', 'full')),
  display_name     text        not null
                               check (char_length(display_name) between 1 and 120),
  status           text        not null default 'pending'
                               check (status in ('pending', 'approved', 'rejected', 'unpublished')),
  consent_version  text        not null
                               check (char_length(consent_version) between 1 and 40),
  submitted_at     timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  decided_at       timestamptz,
  decided_by       uuid        references auth.users (id) on delete set null
);

comment on table  public.reviews                 is 'Course reviews, text only, moderated before publication. Server-role access only; no RLS policies by design.';
comment on column public.reviews.display_name    is 'Derived server-side from certificates.name at submission; stored so a later rename cannot alter a published attribution.';
comment on column public.reviews.consent_version is 'Privacy policy "Last updated" date shown at consent, written by the server route.';
comment on column public.reviews.status          is 'pending | approved | rejected | unpublished. Owner-only transitions; an author edit returns the row to pending.';

-- The homepage reads approved reviews, newest decision first.
create index reviews_approved_idx on public.reviews (decided_at desc) where status = 'approved';

-- ── LOCK IT DOWN ─────────────────────────────────────────────────────────
-- RLS on, no policies: default-deny for every role that is subject to RLS.
alter table public.reviews enable row level security;

-- And the grants themselves, because RLS does not restrain TRUNCATE and a
-- future policy could be added by mistake. PUBLIC first: anon and
-- authenticated inherit through it.
revoke all on table public.reviews from public;
revoke all on table public.reviews from anon, authenticated;
grant  all on table public.reviews to service_role;

-- ── ASSERTIONS ───────────────────────────────────────────────────────────
-- Read the stored ACL (pg_class.relacl), not information_schema, which only
-- shows grants involving roles the current user is a member of.
do $$
declare
  acl      aclitem[];
  n_bad    int;
  n_svc    int;
  n_pol    int;
  rls_on   boolean;
  del_rule char;
begin
  select c.relacl, c.relrowsecurity into acl, rls_on
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'reviews';

  if not rls_on then
    raise exception 'ABORT: row level security is not enabled on public.reviews';
  end if;

  select count(*) into n_pol from pg_policies where schemaname = 'public' and tablename = 'reviews';
  if n_pol <> 0 then
    raise exception 'ABORT: public.reviews has % policy(ies); it must have none', n_pol;
  end if;

  -- NULL relacl means default privileges — for a table that is owner-only,
  -- but Supabase's ALTER DEFAULT PRIVILEGES normally fills it; either way
  -- anon/authenticated must hold nothing.
  select count(*) into n_bad
    from aclexplode(coalesce(acl, '{}'::aclitem[])) a
    left join pg_roles r on r.oid = a.grantee
   where a.grantee = 0 or r.rolname in ('anon', 'authenticated');
  if n_bad > 0 then
    raise exception 'ABORT: PUBLIC/anon/authenticated still hold % privilege(s) on public.reviews', n_bad;
  end if;

  select count(*) into n_svc
    from aclexplode(coalesce(acl, '{}'::aclitem[])) a
    join pg_roles r on r.oid = a.grantee
   where r.rolname = 'service_role';
  if n_svc = 0 then
    raise exception 'ABORT: service_role holds no privilege on public.reviews — every review route would fail';
  end if;

  -- The cascade, by reading the constraint's actual delete rule ('c').
  select con.confdeltype into del_rule
    from pg_constraint con
    join pg_class c on c.oid = con.conrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_attribute a on a.attrelid = c.oid and a.attnum = any (con.conkey)
   where n.nspname = 'public' and c.relname = 'reviews'
     and con.contype = 'f' and a.attname = 'user_id';
  if del_rule is distinct from 'c' then
    raise exception 'ABORT: reviews.user_id is not ON DELETE CASCADE (rule = %)', coalesce(del_rule, 'none');
  end if;
end $$;

-- ── REPORT ───────────────────────────────────────────────────────────────
select
  (select count(*) from public.reviews)                                               as reviews_rows,
  (select relrowsecurity from pg_class where oid = 'public.reviews'::regclass)        as rls_enabled,
  (select count(*) from pg_policies where schemaname='public' and tablename='reviews') as policies,
  (select string_agg(r.rolname || ':' || a.privilege_type, ' ' order by r.rolname, a.privilege_type)
     from pg_class c, aclexplode(c.relacl) a join pg_roles r on r.oid = a.grantee
    where c.oid = 'public.reviews'::regclass)                                         as grants;

commit;

-- ── BY HAND, AFTER RUNNING — verify by attempting, not by reading ────────
-- With the public anon key, through PostgREST, each must be refused (42501):
--   GET    https://<project>.supabase.co/rest/v1/reviews?select=*
--   POST   …/rest/v1/reviews        body {"body":"…20+ chars…","attribution":"full","display_name":"x","consent_version":"x","user_id":"<any uuid>"}
--   PATCH  …/rest/v1/reviews?id=eq.<uuid>   body {"status":"approved"}
--   DELETE …/rest/v1/reviews?id=eq.<uuid>
-- The same four as a signed-in user (a session JWT, role `authenticated`).
-- In the SQL editor the same boundary can be exercised without an account:
--   set role authenticated;  select * from public.reviews;   -- 42501
--   reset role;
-- Positive control, so a refusal means something: the same harness calling
--   POST …/rest/v1/rpc/verify_certificate  {"p_cert_id":"PE-NOPE0000"}
-- as anon returns 200 (an empty list).
