# Certificate claims from the 22-lesson cohort

**Status, 29 September 2026: no claim has ever been received.** This is how
to handle the first one. Correct it afterwards with anything it got wrong.

## The promise this keeps

Terms of use, §7:

> We may add, alter or remove lessons. If we add lessons, people who already
> completed the course under the earlier syllabus keep their certificates —
> we don't move the finish line retroactively.

The course grew from 22 lessons to 26 on 2026-04-20 (Module 08, commit
`a86ad6f`). Until 29 September a code rule, the "grandfather clause", was
meant to certify pre-expansion accounts at 22. It keyed on the account's
creation date, and every account in the database was created on or after
2026-04-25, when Supabase accounts began. It protected no one and was removed
(`courseData.js`, and VERIFICATION-NOTES.md item 4). **This manual route is
now the only thing that keeps the promise.**

## Who this is for

People who used the course in its first version, before accounts existed,
when progress and certificates lived only in their own browser, and who
finished the 22 lessons then.

- If they later signed in, `migrateLegacyUser` copied their progress into a
  new account, dated at migration (2026-04-25 or later). It did **not** copy
  their certificate: that was to be re-issued on their next visit to `/cert`,
  which now requires 26 lessons.
- If they never signed in, their progress exists nowhere but their browser.

## What can be checked: almost nothing. Say so.

There is **no data that proves someone finished the 22-lesson course**:

- **No migration marker.** Nothing records that an account was migrated
  rather than created.
- **The creation date doesn't help.** Every account postdates the expansion.
- **Their lesson keys don't help.** Finishing the old 22 (positions `0-0` to
  `6-2`) is indistinguishable from a current learner who hasn't started
  Module 08. Measured on 29 Sep: 12 accounts had exactly that pattern, and at
  least 7 were created months after the expansion, so they were current
  learners.
- **Old certificate IDs can't be checked.** Certificates from the
  browser-only version were never in the database.

What you *can* look up is whether an account exists for their address, and
what its progress row holds. Treat that as context, not proof.

## Handling a claim

1. **Reply, and ask what they have:** the date they finished, and any copy
   of the old certificate (PDF or screenshot). None of it is verifiable. Ask
   anyway; it's the only evidence there is.
2. **Offer the route that needs no trust first.** Module 08 is four lessons
   (28 minutes by the course's own reading-plus-quiz timing). Completing them issues a
   normal 26-lesson certificate automatically, with nothing to judge.
3. **If they'd rather not, the decision is yours, made by judgement.** Write
   it down: date, address, what they provided, what you decided and why.
4. **Don't honour a claim by hand until the displays are fixed** (below).

## Why a hand-issued 22-lesson certificate is not yet possible

A certificate row records `syllabus_size` (migration `005a`), but nothing
shows it:

- The certificate page prints the *current* total: "26 Lessons · 8 Modules ·
  Full Programme" (`CertificatePage.js`).
- `/verify` prints "Full course completion · All 26 lessons"
  (`VerifyClient.js`). `verify_certificate()` (migration `001`) doesn't even
  return `syllabus_size`.

So a certificate inserted by hand for 22 lessons would state, on its face and
on its public verification page, something that isn't true. Honouring a claim
honestly first needs both displays to read the certificate's own
`syllabus_size` (falling back to the current total when it's null), and
`verify_certificate()` to return it. That's a small change, but not built
yet, and it should be decided before the first claim, not during it.

## Related

- ERASURE-PROCEDURE.md: the same approach, for deletion requests.
- `courseData.js`, above `isCourseComplete()`: the removed clause, and what
  adding lessons in future does to people who haven't claimed yet.
