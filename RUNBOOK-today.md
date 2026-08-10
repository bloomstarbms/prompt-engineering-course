# Runbook — what to do, in order

Five steps. Do them in this order. After each one, paste me the result before
moving on.

Two windows open the whole time:

- **PowerShell** at `C:\Users\bloom\Downloads\pe-course_1\pe-course`
- **Supabase SQL Editor** — https://supabase.com/dashboard/project/xozdjgkrmpimmbsarorj/sql/new

---

## Step 1 — Revoke all sessions

**Do this at a quiet hour.** It signs everyone out. Nobody loses completed
lessons or quiz scores; someone mid-quiz retakes that quiz.

1. Open `supabase/migrations/009_revoke_all_sessions.sql` in Notepad
2. `Ctrl+A`, `Ctrl+C`
3. Paste into the Supabase SQL Editor
4. Click **Run**

**Expected:** one row, roughly

| sessions_revoked | users_signed_out | profiles_untouched | progress_untouched | certificates_untouched | consent_records_untouched |
|---|---|---|---|---|---|
| ~8296 | ~800 | 764 | — | — | 1 |

**If you see a red ABORT message instead:** nothing was changed. Send me the
message and stop.

Paste me the row.

---

## Step 2 — Push the six commits

In PowerShell:

```
cd C:\Users\bloom\Downloads\pe-course_1\pe-course
git push origin main
```

**Expected:** `d39fb0c..58fbdd8  main -> main`

Nothing on the live site changes — the notice is still off.

---

## Step 3 — Backfill the 54 missing profiles

1. Open `supabase/migrations/008_backfill_missing_profiles.sql` in Notepad
2. `Ctrl+A`, `Ctrl+C`
3. Paste into the SQL Editor
4. Click **Run**

**Expected:** one row where `before_missing` is 54 and `after_missing` is **0**,
and `before_consented` equals `after_consented`.

**If you see a red ABORT message:** nothing was changed. Send it to me.

Paste me the row.

---

## Step 4 — Make a test account for the notice

The notice only shows to accounts that have never accepted the terms. A brand
new account records acceptance at signup, so we clear it by hand.

1. Go to https://www.prompten.xyz and register a new account.
   Use `bloomstar042+notice@gmail.com` — the `+notice` part makes it a separate
   account but the email still arrives in your normal inbox.
   **Write down the password.**
2. Then run this in the SQL Editor:

```sql
update profiles
   set consented_at = null
 where id = (select id from auth.users
              where email = 'bloomstar042+notice@gmail.com');

select u.email, p.name, p.consented_at
  from profiles p join auth.users u on u.id = p.id
 where u.email = 'bloomstar042+notice@gmail.com';
```

**Expected:** `consented_at` is `NULL`.

Tell me when that's done.

---

## Step 5 — Turn the notice on

1. Open `src\lib\docs.js` in Notepad
2. Find **line 78**:

```js
export const CONSENT_MODE = 'off';   // 'off' | 'notice' | 'blocking'
```

3. Change `'off'` to `'notice'` — nothing else on the line
4. Save
5. In PowerShell:

```
cd C:\Users\bloom\Downloads\pe-course_1\pe-course
git add -A
git commit -m "Enable the terms notice"
git push origin main
```

6. Wait about two minutes for Vercel to finish
7. Sign into https://www.prompten.xyz as `bloomstar042+notice@gmail.com`

Tell me it's live and I'll run the seven checks.

---

## If anything goes wrong

**Turn the notice off:** change line 78 back to `'off'`, commit, push. Two to
three minutes to production. Or use Vercel → Deployments → previous → ⋯ →
**Instant Rollback**, which takes seconds.

**A migration failed:** both files run inside a transaction and check
themselves. A red ABORT means nothing was written. Send me the message.
