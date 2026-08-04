-- ═══════════════════════════════════════════════════════════════════════════
--  000_emergency_lockdown.sql          (revision 2 — supersedes revision 1)
--
--  PURPOSE
--    Stop the live public disclosure of certificate holders' names and email
--    addresses. public.certificates currently carries a SELECT policy with
--    USING (true), which lets ANY caller — anonymous, or any of the 814
--    authenticated users — read all 31 rows, email column included.
--
--  RUN
--    Supabase Dashboard -> SQL Editor -> paste -> Run.
--
--  DESIGN NOTES (why this is not three plain statements)
--    * The drop is name-independent. Live policy names are known to drift from
--      SUPABASE_SETUP.sql (course_events is named "allow inserts" in
--      production but "course_events: insert" in the file). A
--      `drop policy if exists "certificates: read all"` that matches nothing
--      would silently no-op, leaving the permissive policy in place alongside
--      the new restrictive one. Postgres ORs multiple permissive policies for
--      the same command, so USING (true) would still win and this migration
--      would report success while fixing nothing.
--    * A FOR ALL policy (polcmd = '*') also confers SELECT. The post-check
--      below fails loudly if one exists rather than assuming it does not.
--    * SELECT is revoked from both `anon` and `PUBLIC`. `anon` is confirmed to
--      hold the privilege directly; whether PUBLIC additionally holds it was
--      not verified, and revoking from a grantee that holds nothing is a
--      no-op. This is correct under either condition.
--
--  BREAKAGE (accepted; restored by 001 + 002)
--    Certificate verification at /verify/<certId> stops working for EVERYONE
--    except the certificate's own owner — not merely for signed-out visitors.
--    A signed-in user viewing someone else's certificate gets the same
--    "Certificate Not Found" state, because the new policy is owner-scoped and
--    verification is by design a third-party action. This is the entire point
--    of the public verify page, so treat it as fully down until 002 deploys.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- ── 1. Drop EVERY existing SELECT policy, by name, whatever it is called ──
do $$
declare
  r record;
  dropped int := 0;
begin
  for r in
    select polname
      from pg_policy
     where polrelid = 'public.certificates'::regclass
       and polcmd = 'r'                       -- 'r' = SELECT
  loop
    execute format('drop policy %I on public.certificates', r.polname);
    raise notice 'dropped SELECT policy: %', r.polname;
    dropped := dropped + 1;
  end loop;

  if dropped = 0 then
    raise notice 'no pre-existing SELECT policy found (unexpected, continuing)';
  end if;
end $$;

-- ── 2. Owner-scoped read ──────────────────────────────────────────────────
create policy "certificates: read own"
  on public.certificates
  for select
  using (auth.uid() = user_id);

-- ── 3. Remove read grants from public-facing roles ────────────────────────
--  `authenticated` intentionally KEEPS select: the owner-scoped policy above
--  is what limits them to their own row.
revoke select on public.certificates from anon;
revoke select on public.certificates from public;

-- ── 4. POST-CHECK — abort the whole transaction if the outcome is wrong ───
do $$
declare
  n_select int;
  n_all    int;
  qual     text;
begin
  select count(*) into n_all
    from pg_policy
   where polrelid = 'public.certificates'::regclass
     and polcmd = '*';                        -- FOR ALL also confers SELECT

  if n_all > 0 then
    raise exception
      'ABORT: % FOR ALL policy(ies) exist on public.certificates; these also grant SELECT and would defeat this lockdown', n_all;
  end if;

  select count(*), max(pg_get_expr(polqual, polrelid))
    into n_select, qual
    from pg_policy
   where polrelid = 'public.certificates'::regclass
     and polcmd = 'r';

  if n_select <> 1 then
    raise exception
      'ABORT: expected exactly 1 SELECT policy on public.certificates, found %', n_select;
  end if;

  -- whitespace-insensitive compare, so formatting differences do not
  -- produce a false failure
  if replace(qual, ' ', '') is distinct from '(auth.uid()=user_id)' then
    raise exception
      'ABORT: SELECT policy predicate is "%", expected "(auth.uid() = user_id)"', qual;
  end if;

  raise notice 'OK: exactly one owner-scoped SELECT policy is in force.';
end $$;

commit;

-- ── VERIFY (run after commit) ─────────────────────────────────────────────
-- a) Policies now on the table:
--
--    select polname,
--           case polcmd when 'r' then 'SELECT' when 'a' then 'INSERT'
--                       when 'w' then 'UPDATE' when 'd' then 'DELETE'
--                       else 'ALL' end as cmd,
--           pg_get_expr(polqual, polrelid)      as using_expr,
--           pg_get_expr(polwithcheck, polrelid) as with_check
--      from pg_policy
--     where polrelid = 'public.certificates'::regclass
--     order by polname;
--
-- b) Ground truth on grantees — this also answers, definitively, whether
--    PUBLIC ever held SELECT (an entry whose grantee is empty is PUBLIC):
--
--    select coalesce(nullif(split_part(acl, '=', 1), ''), 'PUBLIC') as grantee,
--           split_part(split_part(acl, '=', 2), '/', 1)             as privs
--      from (select unnest(relacl)::text as acl
--              from pg_class
--             where oid = 'public.certificates'::regclass) t
--     order by 1;
--
--    Expect: no row for `anon` carrying `r`, and no PUBLIC row carrying `r`.
--
-- c) Empirical: re-run the anon-key curl. Expect 401 / permission denied
--    or an empty array, not rows.

-- ── ROLLBACK (reinstates the disclosure — emergency use only) ─────────────
--    begin;
--      drop policy if exists "certificates: read own" on public.certificates;
--      create policy "certificates: read all"
--        on public.certificates for select using (true);
--      grant select on public.certificates to anon;
--    commit;

-- ── WHAT STILL WORKS ──────────────────────────────────────────────────────
--  * /cert for the owner — getUserCert(userId) filters by user_id with an
--    authenticated session, so it matches "certificates: read own".
--  * Issuance — the INSERT policy is untouched.
--  * /api/stats — service-role client bypasses RLS.
--  * profiles / progress / course_events — not touched by this migration.
