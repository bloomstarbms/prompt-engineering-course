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

## Handling a claim — decided approach (29 September 2026)

1. **Reply, and ask what they have:** the date they finished, and any copy
   of the old certificate (PDF or screenshot). None of it is verifiable. Ask
   anyway; it's the only evidence there is.
2. **Offer Module 08 first.** Four lessons, 28 minutes by the course's own
   reading-plus-quiz timing. Completing them issues a standard 26-lesson
   certificate automatically, with nothing to judge.
3. **If they decline, judge whether the claim is credible.** Write it down:
   date, address, what they provided, what you decided and why.
4. **If it is credible, issue a certificate with `syllabus_size = 22`**, and
   only after the display change below is built and deployed.
5. **Never issue a certificate stating 26 lessons to someone who completed
   22.** Not as a shortcut, not "just this once". The certificate and its
   public verification page would state something untrue.

## The display change to build before issuing the first 22-lesson certificate

**Not built yet, deliberately.** Build it when the first real claim arrives,
not before. There may never be one.

Today a certificate row records `syllabus_size` (migration `005a`), but
nothing shows it:

- The certificate page prints the *current* total: "26 Lessons · 8 Modules ·
  Full Programme" (`CertificatePage.js`).
- `/verify` prints "Full course completion · All 26 lessons"
  (`VerifyClient.js`). `verify_certificate()` (migration `001`) doesn't return
  `syllabus_size`.

So a 22-lesson certificate issued today would claim 26 on its face and on its
public page. What the change needs:

- `verify_certificate()` returns `syllabus_size`: a new migration, with the
  same revoke-then-grant pattern as `001`.
- The certificate page and `/verify` show the certificate's own
  `syllabus_size`, falling back to the current total when it is null (every
  certificate issued before `005a`).
- The module list and module count on both pages reflect a 22-lesson
  syllabus too, not only the lesson number: Module 08 must not appear on a
  certificate for a course without it.
- Verify by looking at the issued certificate and its `/verify` page, not by
  reading the row.

How to issue, once that is live: there is no route for it. It is a manual
insert as `postgres` in the SQL editor, with the name taken from the
person's profile and `syllabus_size = 22`. Write the exact statement when the
claim arrives, against the schema as it is then. Don't write it from this
note.

## Related

- ERASURE-PROCEDURE.md: the same approach, for deletion requests.
- `courseData.js`, above `isCourseComplete()`: the removed clause, and what
  adding lessons in future does to people who haven't claimed yet.
