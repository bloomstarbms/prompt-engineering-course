-- ═══════════════════════════════════════════════════════════════════════════
--  005b_revoke_authenticated_insert.sql
--
--  PURPOSE
--    Make the server the ONLY issuer of certificates, by removing the ability
--    of signed-in users to INSERT certificate rows directly.
--
--  WHY THIS IS LAST
--    Until now any authenticated user could insert a certificate for themselves
--    with arbitrary pct, grade and name — the RLS policy constrained who owned
--    the row, never what it contained. The issuance route (005 step 1) and the
--    client switch (005 step 2) had to be built, deployed and exercised in
--    production first: revoking before a working alternative existed would have
--    left nobody able to complete the course.
--
--  VERIFIED BEFORE RUNNING THIS
--    · Existing holder path: /cert renders via the issued:false early return
--    · New issuance: PE-9RX7VMN99PT82P7RC49BTE4T84 minted through the route
--    · That certificate's public verify link resolves
--
--  WHAT THIS DOES NOT DO
--    It does not make the underlying scores trustworthy. Quiz answer keys ship
--    in the client bundle, grading runs in the browser, and progress.quiz_scores
--    is user-writable under "progress: manage own". A determined user can still
--    write their own perfect scores and then ask the server for a certificate.
--    This closes direct fabrication of the certificate row, not fabrication of
--    the progress it is computed from — an accepted limit for a free,
--    unproctored course, which the certificate copy now states plainly.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- ── 1. Remove INSERT from every browser-reachable role ───────────────────
--  service_role is untouched: it is what the issuance route uses, and it also
--  bypasses RLS. authenticated keeps SELECT so owners can still read their own
--  certificate under "certificates: read own".
revoke insert on public.certificates from authenticated;
revoke insert on public.certificates from anon;
revoke insert on public.certificates from public;

-- ── 2. The "certificates: insert own" policy is deliberately KEPT ────────
--  With no INSERT grant the policy is unreachable, so it could be dropped. It
--  stays as defence in depth: if the grant is ever restored — by a future
--  migration, a dashboard click, or a restored backup — the policy still
--  confines an insert to the caller's own user_id rather than allowing them to
--  issue certificates in someone else's name.

-- ── 3. POST-CHECK — abort if the revoke did not take ─────────────────────
do $$
declare leaked text;
begin
  select string_agg(grantee, ', ')
    into leaked
    from information_schema.role_table_grants
   where table_schema   = 'public'
     and table_name     = 'certificates'
     and privilege_type = 'INSERT'
     and grantee in ('anon', 'authenticated', 'PUBLIC');

  if leaked is not null then
    raise exception 'ABORT: INSERT on certificates still held by: %', leaked;
  end if;

  if not exists (
    select 1 from information_schema.role_table_grants
     where table_schema = 'public' and table_name = 'certificates'
       and privilege_type = 'INSERT' and grantee = 'service_role'
  ) then
    raise exception
      'ABORT: service_role has no INSERT on certificates — the issuance route would break';
  end if;

  raise notice 'OK: certificates are now server-issued only. service_role retains INSERT.';
end $$;

commit;

-- ── VERIFY ────────────────────────────────────────────────────────────────
--  a) Grants — expect no INSERT row for anon/authenticated/PUBLIC:
--
--     select grantee, privilege_type
--       from information_schema.role_table_grants
--      where table_schema = 'public' and table_name = 'certificates'
--      order by grantee, privilege_type;
--
--  b) Functional — issue a certificate through the app with a fresh account.
--     It must still work: the route uses service_role, which is unaffected.
--
--  c) Negative — a direct browser insert must now fail. From the site console
--     while signed in, a POST to /rest/v1/certificates should return 401/403
--     rather than creating a row.

-- ── ROLLBACK ──────────────────────────────────────────────────────────────
--     grant insert on public.certificates to authenticated;
--
--  Only needed if the issuance route is failing in production and you want
--  learners able to claim certificates again while it is fixed. Note this
--  restores the ability to insert arbitrary pct/grade values.
