# Erasure procedure — deleting someone's account and data

Use this when someone asks for their account or data to be deleted (privacy
policy §7 and §8; terms §10). No one had asked as of 29 September 2026, so this
has never been run end to end. Read it through before the first time, and
correct it afterwards with anything it got wrong.

**What erasure deletes** (privacy policy §7): profile, progress, certificate
and any review. The certificate's verification link stops working;
a published review comes off the home page.

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

Everything after this step keys on the account `id`, not the address. The
lookup below lowercases and trims both sides, so it doesn't depend on how the
person typed their address or how Auth stored it.

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
  (select count(*) from public.reviews      where user_id = 'THE-ID') as reviews;
```

Keep these numbers. Step 5 compares against them. If `certificates` is 1,
also note the `cert_id` (for step 5's link check):

```sql
select cert_id from public.certificates where user_id = 'THE-ID';
```

If `reviews` is 1, note its status and display name (for step 5's homepage
check):

```sql
select status, display_name from public.reviews where user_id = 'THE-ID';
```

## 4. Delete the account

Supabase dashboard → **Authentication → Users** → find the address →
**Delete user**.

Deleting the auth user cascades (`on delete cascade`) to `profiles`,
`progress`, `certificates` and `reviews`. That cascade is a declaration in the schema;
step 5 is what establishes it happened.

## 5. Verify by looking, not by trusting the cascade

Run step 3's query again. **Every count must be 0.** Also:

```sql
select count(*) from auth.users where id = 'THE-ID';   -- must be 0
```

If they had a certificate, open `https://www.prompten.xyz/verify/<cert_id>`
and confirm it no longer shows their name.

If they had an **approved** review, the home page is static and still holds
it until it is rebuilt. Deleting the row does not rebuild the page. Open
`/admin` and use the reviews panel's **Rebuild home page** action (it calls
`revalidatePath('/')`).

Then **load `https://www.prompten.xyz/` twice, and check the second load.**
The first request after a rebuild can still be served the old page while the
new one is generated; this was seen on 4 October 2026. So: load it once,
wait a few seconds, and load it again. On the second load, confirm the display
name from step 3 is gone. Search `view-source:` for the name, not just the
visible page. A single load can show the old page, name included, even when
the rebuild worked. The timed revalidation would eventually do this on its
own; don't wait for it.

## 6. Reply

Tell them it's done and what was deleted. Keep a note of the date and the
address the request came from, and nothing else about them.

---

## Taking a published review down from /admin

This isn't an erasure, but it has the same last step. **Unpublish** and
**Delete** in the reviews panel each rebuild the home page. The first request
after a rebuild can still be served the old page, with the review on it. After
either action, load `https://www.prompten.xyz/` twice: once to trigger the
rebuild, and again a few seconds later. Check the second load, in
`view-source:`, before considering it done. The panel says the same next to
its actions.

---

## When this procedure must change

- **Any new table holding personal data** needs a step here, unless it has a
  foreign key to `auth.users` with `on delete cascade`, and even then step 5
  must check it.
- **Course reviews** cascade (migration 014, verified by reading the
  constraint's delete rule), but a published review is also baked into the
  static home page, so step 5 rebuilds it and checks the live page. If the
  home page ever stops being static, drop that part of step 5.
- **`course_events` had a manual step here** (it was step 4), because it had
  no foreign key to `auth.users`. Migration 015 dropped the table, and the
  step went with it.
