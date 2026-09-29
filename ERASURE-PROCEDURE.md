# Erasure procedure — deleting someone's account and data

Use this when someone asks for their account or data to be deleted (privacy
policy §7 and §8; terms §10). No one had asked as of 29 September 2026, so this
has never been run end to end. Read it through before the first time, and
correct it afterwards with anything it got wrong.

**What erasure deletes** (privacy policy §7): profile, progress, usage events
and certificate. The certificate's verification link stops working.

Respond within 30 days (policy §8). Do each step in order and check the
result each time. Every step below has a way to look like it worked while
doing nothing.

---

## 1. Confirm the request

- The request should come from the email address on the account. If it
  doesn't, ask them to write from that address, or otherwise confirm it's
  theirs, before deleting anything.
- Tell them the certificate goes too. If they've shared the verification
  link (CV, LinkedIn), they may want to download the certificate first.

## 2. Find the account — lowercase the address first

Everything below keys on the address in lowercase. `/api/track` stores
`course_events.email` lowercased and trimmed, so a mixed-case address silently
matches nothing there. The lookup below lowercases both sides, so it doesn't
depend on how Auth stored it.

In the SQL editor (fresh tab; check the buffer is empty before running):

```sql
select id, email, created_at
  from auth.users
 where lower(email) = lower(trim('Their.Address@Example.com'));
```

Expect exactly **one** row. Zero rows means either there is no account or the
address is wrong, and those look identical. Check with them before
concluding there's nothing to delete. Note the `id`.

## 3. Record what exists, before deleting

```sql
select
  (select count(*) from public.profiles     where id      = 'THE-ID') as profiles,
  (select count(*) from public.progress     where user_id = 'THE-ID') as progress,
  (select count(*) from public.certificates where user_id = 'THE-ID') as certificates,
  (select count(*) from public.course_events where email  = 'the-lowercased-address') as events;
```

Keep these numbers. Step 6 compares against them. If `certificates` is 1,
also note the `cert_id` (for step 6's link check):

```sql
select cert_id from public.certificates where user_id = 'THE-ID';
```

## 4. Delete usage events — this one is manual

`course_events` has **no foreign key** to the account, so deleting the account
does not touch it (SECURITY-NOTES.md, "course_events does not cascade").

```sql
delete from public.course_events where email = 'the-lowercased-address';
```

**Check the row count against step 3.** `DELETE 0` when step 3 found events
means the address didn't match (case, whitespace, typo).

## 5. Delete the account

Supabase dashboard → **Authentication → Users** → find the address →
**Delete user**.

Deleting the auth user cascades (`on delete cascade`) to `profiles`,
`progress` and `certificates`. That cascade is a declaration in the schema;
step 6 is what establishes it happened.

## 6. Verify by looking, not by trusting the cascade

Run step 3's query again. **Every count must be 0.** Also:

```sql
select count(*) from auth.users where id = 'THE-ID';   -- must be 0
```

If they had a certificate, open `https://www.prompten.xyz/verify/<cert_id>`
and confirm it no longer shows their name.

## 7. Reply

Tell them it's done and what was deleted. Keep a note of the date and the
address the request came from, and nothing else about them.

---

## When this procedure must change

- **Any new table holding personal data** needs a step here, unless it has a
  foreign key to `auth.users` with `on delete cascade`, and even then step 6
  must check it.
- **Course reviews (planned).** A `reviews` table would cascade, but a
  published review is also baked into the static homepage. Erasure would then
  need to trigger a homepage revalidation, and check that the name is gone
  from `https://www.prompten.xyz/` itself, not just from the table.
- **If `course_events` is retired**, delete step 4 and its row in step 3.
