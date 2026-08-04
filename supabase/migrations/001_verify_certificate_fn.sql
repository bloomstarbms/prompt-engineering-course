-- ═══════════════════════════════════════════════════════════════════════════
--  001_verify_certificate_fn.sql
--
--  PURPOSE
--    Restore public certificate verification, which 000 took offline, WITHOUT
--    reopening the table to anonymous readers.
--
--    000 revoked anon's SELECT on public.certificates and scoped the remaining
--    policy to the owner. This migration adds a narrow, purpose-built function
--    that returns a single certificate by its ID and nothing else:
--      * no email column — the PII that leaked is simply not in the result
--      * exact-ID match only — the table cannot be listed or enumerated
--      * SECURITY DEFINER — runs as the owner, so anon needs no table grant
--
--  ADDITIVE ONLY. Safe to run at any time. Nothing is dropped or revoked that
--  the application currently depends on, and no data is modified.
--
--  ORDER: run this BEFORE deploying 002 (the client change). Deploying 002
--  first would call a function that does not exist yet.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- ── 1. Alias column for the legacy IDs ────────────────────────────────────
--  All 31 existing certificates use the weak 31-bit ID scheme. 004 will issue
--  every certificate a fresh 128-bit ID and move the old value here, so that
--  verify links already shared (LinkedIn profiles, printed PDFs) keep
--  resolving. Adding the column now means the function below is written once
--  and does not need changing when 004 runs.
alter table public.certificates
  add column if not exists legacy_cert_id text;

--  Partial unique index: legacy IDs must stay unique, but the column is NULL
--  for every certificate issued after the rotation, and NULLs must not collide.
create unique index if not exists certificates_legacy_cert_id_key
  on public.certificates (legacy_cert_id)
  where legacy_cert_id is not null;

-- ── 2. The verification function ──────────────────────────────────────────
--  Column list is deliberate and minimal. Compare with the old
--  `select('*')`, which shipped email, user_id, total_correct and
--  total_possible to any caller.
--
--  `set search_path` is required on SECURITY DEFINER functions: without it a
--  caller could prepend a schema of their own and shadow `certificates` with
--  a table they control.
create or replace function public.verify_certificate(p_cert_id text)
returns table (
  cert_id       text,
  name          text,
  pct           integer,
  grade         text,
  module_scores jsonb,
  issued_at     timestamptz
)
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select c.cert_id, c.name, c.pct, c.grade, c.module_scores, c.issued_at
    from public.certificates c
   where c.cert_id = p_cert_id
      or c.legacy_cert_id = p_cert_id
   limit 1;
$$;

-- ── 3. Execute grants ─────────────────────────────────────────────────────
--  Postgres grants EXECUTE to PUBLIC by default on new functions. Revoke that
--  first, then grant explicitly, so the privilege list is intentional rather
--  than inherited.
revoke all on function public.verify_certificate(text) from public;
grant execute on function public.verify_certificate(text) to anon, authenticated;

commit;

-- ── VERIFY ────────────────────────────────────────────────────────────────
-- a) Function exists, is SECURITY DEFINER, and has a pinned search_path:
--
--    select p.proname, p.prosecdef as security_definer, p.proconfig
--      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--     where n.nspname = 'public' and p.proname = 'verify_certificate';
--
--    Expect: security_definer = true, proconfig = {search_path=public\, pg_temp}
--
-- b) Round-trip a real ID. Take any cert_id from your own certificate page:
--
--    select * from public.verify_certificate('PE-XXXXXXXX');
--
--    Expect: exactly one row, six columns, NO email column present.
--
-- c) A nonsense ID returns zero rows, not an error:
--
--    select count(*) from public.verify_certificate('PE-NOT-A-REAL-ID');

-- ── KNOWN RESIDUAL RISK (closed by 004) ───────────────────────────────────
--  This function is exposed to anon by design, and the 31 existing IDs still
--  carry only ~31 bits of entropy. An attacker could in principle grind the
--  ID space against this RPC. That is strictly better than the previous state
--  (which handed over the whole table, emails included, in one request), but
--  it is not resolved until 004 rotates every certificate onto a 128-bit ID.
--  Do not treat 001+002 as the end of the ID problem.

-- ── ROLLBACK ──────────────────────────────────────────────────────────────
--    begin;
--      drop function if exists public.verify_certificate(text);
--      -- the legacy_cert_id column and its index are harmless; drop only if
--      -- you are also rolling back 004:
--      -- drop index if exists public.certificates_legacy_cert_id_key;
--      -- alter table public.certificates drop column if exists legacy_cert_id;
--    commit;
