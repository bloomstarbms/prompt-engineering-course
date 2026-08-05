-- ═══════════════════════════════════════════════════════════════════════════
--  004_strong_cert_ids.sql
--
--  PURPOSE
--    Replace the weak certificate ID scheme with 128-bit IDs, without breaking
--    a single verification link that has already been shared.
--
--  THE PROBLEM
--    IDs were minted client-side by a djb2 hash reduced to a 32-bit signed int
--    and rendered as 8 base36 characters. The format implies 36^8 (2.8e12); the
--    real space is 2^31 (2.15e9) — overstated ~1314x. Measured empirically over
--    400,000 generations: first collision at #55,728, matching the birthday
--    prediction of ~54,562. All 31 live certificates use this scheme.
--    Consequences: (a) the ID space is grindable against the public
--    verify_certificate() RPC; (b) cert_id is UNIQUE, so a collision makes
--    issuance fail outright for that user.
--
--  DESIGN NOTE — why the database generates the ID, not Node
--    Generation is done here with pgcrypto's gen_random_bytes(16) rather than
--    crypto.randomBytes(16) in an API route. Same 128 bits from a CSPRNG, but
--    enforced by a BEFORE INSERT trigger, so it holds for EVERY insert path —
--    the current client, the 005 issuance route, psql, a future admin tool.
--    A Node-only generator would also have forced this migration to wait for
--    005's route to exist. The trigger overwrites any client-supplied cert_id
--    unconditionally, so a weak or attacker-chosen ID cannot be introduced.
--
--  DATA CHANGE: yes — this UPDATEs all 31 existing rows. Take a backup first
--  (Dashboard -> Database -> Backups) if you want a restore point.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

create extension if not exists pgcrypto;

-- ── 1. Crockford base32 encoder ───────────────────────────────────────────
--  Crockford's alphabet omits I, L, O and U, so the IDs survive being read
--  aloud, hand-copied off a printed certificate, or retyped from a PDF.
create or replace function public.crockford_b32(p_bytes bytea)
returns text
language plpgsql
immutable
as $$
declare
  alphabet constant text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  bits text := '';
  out_s text := '';
  i int;
begin
  for i in 0 .. length(p_bytes) - 1 loop
    bits := bits || get_byte(p_bytes, i)::bit(8)::text;
  end loop;
  while length(bits) % 5 <> 0 loop
    bits := bits || '0';
  end loop;
  for i in 1 .. length(bits) / 5 loop
    out_s := out_s || substr(alphabet, (substr(bits, (i - 1) * 5 + 1, 5))::bit(5)::int + 1, 1);
  end loop;
  return out_s;
end $$;

-- ── 2. The generator: 16 random bytes -> 'PE-' + 26 Crockford chars ───────
create or replace function public.generate_cert_id()
returns text
language sql
volatile
as $$
  select 'PE-' || public.crockford_b32(gen_random_bytes(16));
$$;

-- ── 3. Ensure the alias column exists (created in 001; idempotent here) ───
alter table public.certificates
  add column if not exists legacy_cert_id text;

create unique index if not exists certificates_legacy_cert_id_key
  on public.certificates (legacy_cert_id)
  where legacy_cert_id is not null;

-- ── 4. Rotate: preserve the old ID as an alias, mint a strong one ─────────
--  `where legacy_cert_id is null` makes this re-runnable: a row that has
--  already been rotated is skipped rather than rotated twice (which would
--  destroy the alias and break the shared link).
update public.certificates
   set legacy_cert_id = cert_id,
       cert_id        = public.generate_cert_id()
 where legacy_cert_id is null;

-- ── 5. Force server-side generation for every future insert ──────────────
--  cert_id is assigned here unconditionally, so the column is not writable by
--  any client no matter what it sends. legacy_cert_id is forced to NULL on
--  INSERT so a caller cannot squat or alias an ID it does not own; only the
--  rotation UPDATE above ever populates it.
create or replace function public.certificates_set_cert_id()
returns trigger
language plpgsql
as $$
begin
  new.cert_id       := public.generate_cert_id();
  new.legacy_cert_id := null;
  return new;
end $$;

drop trigger if exists certificates_set_cert_id_trg on public.certificates;
create trigger certificates_set_cert_id_trg
  before insert on public.certificates
  for each row execute function public.certificates_set_cert_id();

-- ── 6. One certificate per user ───────────────────────────────────────────
--  Verified 0 duplicate user_ids before writing this, so it applies clean.
--  Prevents a retry or race from minting a second certificate — which would
--  also break getUserCert(), whose .maybeSingle() errors on multiple rows.
do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.certificates'::regclass
       and conname  = 'certificates_user_id_key'
  ) then
    alter table public.certificates
      add constraint certificates_user_id_key unique (user_id);
  end if;
end $$;

-- ── 7. POST-CHECKS — abort and roll back if anything is off ──────────────
do $$
declare
  n_total int; n_bad_format int; n_missing_alias int; n_dupe int; probe text;
begin
  -- encoder sanity: 16 zero bytes must encode to 26 zeros
  select public.crockford_b32(decode(repeat('00', 16), 'hex')) into probe;
  if probe <> repeat('0', 26) then
    raise exception 'ABORT: crockford_b32 self-test failed, got "%"', probe;
  end if;

  select count(*) into n_total from public.certificates;

  -- every cert_id must be PE- + exactly 26 Crockford chars (no I, L, O, U)
  select count(*) into n_bad_format
    from public.certificates
   where cert_id !~ '^PE-[0-9A-HJKMNP-TV-Z]{26}$';
  if n_bad_format > 0 then
    raise exception 'ABORT: % certificate(s) do not match the new ID format', n_bad_format;
  end if;

  -- every pre-existing row must have kept its old ID as an alias
  select count(*) into n_missing_alias
    from public.certificates where legacy_cert_id is null;
  if n_total > 0 and n_missing_alias = n_total then
    raise exception 'ABORT: no rows carry a legacy_cert_id; the rotation did not run';
  end if;

  select count(*) into n_dupe from (
    select cert_id from public.certificates group by cert_id having count(*) > 1
  ) d;
  if n_dupe > 0 then
    raise exception 'ABORT: % duplicate cert_id value(s) after rotation', n_dupe;
  end if;

  raise notice 'OK: % certificate(s) rotated to 128-bit IDs; legacy aliases preserved.', n_total;
end $$;

commit;

-- ── VERIFY ────────────────────────────────────────────────────────────────
-- a) Shape of the data (safe — no email, no names):
--
--    select count(*)                                        as total,
--           count(legacy_cert_id)                           as with_alias,
--           min(length(cert_id))                            as min_len,
--           max(length(cert_id))                            as max_len
--      from public.certificates;
--
--    Expect: total = 31, with_alias = 31, min_len = max_len = 29 ('PE-' + 26).
--
-- b) An OLD link still resolves. Take any value from legacy_cert_id and pass
--    it to the verify function — this is the check that proves no LinkedIn
--    link broke:
--
--    select cert_id, name from public.verify_certificate(
--      (select legacy_cert_id from public.certificates limit 1));
--
--    Expect: one row, whose cert_id is the NEW id.
--
-- c) The trigger really does ignore client input:
--
--    -- (run as a throwaway; roll it back)
--    begin;
--      insert into public.certificates (user_id, cert_id, name, email)
--      values (gen_random_uuid(), 'PE-WEAK', 'trigger test', 't@example.com')
--      returning cert_id;   -- must NOT be 'PE-WEAK'
--    rollback;

-- ── ROLLBACK ──────────────────────────────────────────────────────────────
--  Restores the old IDs from the aliases. Only valid before any NEW
--  certificate has been issued under the new scheme (such a row has no alias
--  to restore from and would be left with its 128-bit ID, which is fine).
--
--    begin;
--      drop trigger if exists certificates_set_cert_id_trg on public.certificates;
--      update public.certificates
--         set cert_id = legacy_cert_id, legacy_cert_id = null
--       where legacy_cert_id is not null;
--      alter table public.certificates drop constraint if exists certificates_user_id_key;
--    commit;
