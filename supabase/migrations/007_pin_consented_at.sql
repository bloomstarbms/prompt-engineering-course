-- 007_pin_consented_at.sql
--
-- Makes profiles.consented_at genuinely unwritable by the user.
--
-- WHY 006 DID NOT DO THIS
-- 006 ended with:
--     revoke update (consented_at) on public.profiles from authenticated;
-- That is a no-op, and it was applied to production as one.
--
-- In PostgreSQL a column-level REVOKE cannot subtract from a table-level
-- grant. Supabase grants UPDATE on the whole table to `authenticated`, so the
-- column-level revoke removed a permission that was never separately held and
-- changed nothing. Verified after the fact:
--     select has_column_privilege('authenticated','public.profiles',
--                                 'consented_at','UPDATE');   -- true
--
-- The check originally written into 006 could not have caught this: it read
-- information_schema.column_privileges, which reports a column as updatable
-- whether the privilege came from the column or from the table. It answered a
-- different question to the one being asked and answered it reassuringly.
--
-- WHY A TRIGGER RATHER THAN FIXING THE GRANTS
-- The grant-based fix is `revoke update on profiles from authenticated` then
-- `grant update (name, bio, avatar_url)`. That works, but it changes the
-- permission surface the profile save already depends on: PostgREST composes
-- an upsert's DO UPDATE SET from the request payload, so whether it needs
-- UPDATE on `id` depends on how the client happens to send the row. A trigger
-- pins one column and touches nothing else, so it cannot break saving a name.
--
-- LOUD, NOT SILENT
-- It raises rather than quietly discarding the change. A normal profile save
-- never sends consented_at, so NEW equals OLD and the trigger does nothing.
-- The only way to reach the exception is to try to write the column, which is
-- exactly the case that should not pass unnoticed.

create or replace function public.pin_consented_at()
returns trigger
language plpgsql
as $$
begin
  -- current_user reflects the role PostgREST sets per request:
  -- 'authenticated' or 'anon' for a browser, 'service_role' for the API
  -- routes, 'postgres' in the SQL editor.
  if new.consented_at is distinct from old.consented_at
     and current_user not in ('service_role', 'postgres') then
    raise exception 'consented_at is not user-writable'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_pin_consented_at on public.profiles;

create trigger profiles_pin_consented_at
  before update on public.profiles
  for each row
  execute function public.pin_consented_at();

-- Verification.
--
-- The privilege check is NOT the test — has_column_privilege will still say
-- true, because the grant genuinely is still there. The trigger is what stops
-- the write, so the only meaningful test is to attempt the write as a browser
-- user and watch it fail with 42501. That is done from the app, signed in,
-- against the live database.
--
-- Confirm the trigger exists:
--   select tgname, tgenabled
--   from pg_trigger
--   where tgrelid = 'public.profiles'::regclass
--     and not tgisinternal;
--
-- Expect one row: profiles_pin_consented_at | O
