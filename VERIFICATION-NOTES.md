# Verification notes

How to check things on this project so the check means something. This is a
living file for technique; dated findings belong in reports. It extends
REPORT-2026-08-10.md §5, "things that report success while doing nothing". The
rule there, **prove a check can fail before trusting that it passed**, applies
to searches as much as to guards.

---

## Searches: a zero-hit result proves nothing without a positive control

**A search for a string that should be absent proves nothing until the same
pattern, run over the same material, finds a string that should be present.**

Zero hits has two causes: the string is not there, or the search cannot see it.
From the output alone they are identical. Only a positive control tells them
apart.

### It has already failed twice on the same job

Both times the job was checking that the old brand name was gone.

1. **Case.** The brand consolidation (commit `6d3e919`) was verified by
   searching for `PromptMastery` with a case-sensitive search, and reported zero
   occurrences. The diagram caption said `PROMPTMASTERY`. It shipped on all 26
   lesson diagrams, including the server-rendered HTML of the three public
   lessons, until the September 2026 audit (fixed in `256337a`).
2. **Encoding.** The case-insensitive search that replaced it found no chunk
   containing the new caption `PROMPTEN · ILLUSTRATED GUIDE` either, although
   `LessonArt` must ship in one. The minifier writes `·` as `\xb7`, so a literal
   `·` never matches built JavaScript. The same blind spot would have hidden a
   variant like `Prompt · Mastery`. It was caught only because the positive
   control, the new caption, came back missing too.

A near-miss in the same session: counting landing-page module cards with
`MODULE 0\d` returned 0 on a page that has eight. React writes adjacent text
nodes as `MODULE <!-- -->01`. The page was fine; the search could not see it.

**There will be a third variant.** None of these was a careless search. Each
was reasonable, and blind to one transformation between the source and what
ships. The next one will be a transformation nobody has listed yet. The
positive control catches it anyway, because it tests the search against the
real material, not against a list of known problems.

### The procedure

1. **Choose a positive control.** Something that must be present, in the same
   kind of material, as close as possible to what you're checking: ideally the
   replacement string, in the same file, in the same built artifact. For the
   caption, that meant `PROMPTEN · ILLUSTRATED GUIDE`, which must appear in the
   chunk that used to contain `PROMPTMASTERY`.
2. **Run the same pattern over the same material for both.** Not a similar
   pattern, and not the source tree standing in for the build.
3. **Trust the zero only if the control hits.** If the control also returns
   zero, the search is broken. Fix it, then run both again.
4. **Self-test the pattern against the variants you claim it covers.** Write
   them out (`PromptMastery`, `PROMPTMASTERY`, `Prompt-Mastery`,
   `Prompt\xb7Mastery`, …) and assert that every one matches. This checks the
   pattern, not the material, so it doesn't replace step 1.
5. **Report the coverage with the result.** How many pages, how many chunks,
   how the list was built, how many fetches failed. "Zero hits" alone can't be
   checked; "zero hits across 17 pages and 31 chunks (23 direct, 8 lazy, 0
   fetch failures), control found in chunk 15" can.

### Transformations between source and what ships

A search over one of these sees something different from the source. This list
will never be complete, which is why the procedure above doesn't depend on it.

- **Case**: source casing, `text-transform: uppercase`, `.toUpperCase()` at
  render time.
- **Minified JavaScript**: non-ASCII written as `\xNN` or `\uNNNN`; strings
  split, concatenated or moved between chunks.
- **Server HTML**: `&amp;`, `&#x27;` and other entities; text split by
  `<!-- -->` between React text nodes; the same content repeated in the RSC
  payload, so counts come out doubled.
- **Where it ships**: lazily loaded chunks are not referenced from any page's
  HTML. Enumerate them from the webpack runtime's chunk map, and check that the
  count matches what you expect (one per `src/data/modules/*.js`).
- **Not text at all**: the OG image is a PNG. The strongest available claim
  is that its source, `opengraph-image.js`, is clean. Say that, not "no hits".

### The same rule for counts and structure

"The sitemap has 7 URLs", "gated lessons carry 0 prose paragraphs", "the
landing page has its module cards": each is a search too. A zero-paragraph
result on a gated lesson means something only when the same selector finds the
paragraphs on a public lesson in the same run.

---

## Configuration: verify the behaviour, not the declaration

**A declaration in a config file, migration or schema file is not evidence of
an effect. Only the behaviour is.** Read what the system does (the response
code, the query plan, the refused write), not what a file says it will do.

The same shape has now happened four times, each in a different kind of file:

1. **Migration `006`.** `revoke update (consented_at) … from authenticated`
   ran without error and changed nothing: a column-level REVOKE can't subtract
   from Supabase's table-level grant. Its verification query read
   `information_schema.column_privileges`, which reports the same thing
   either way. The real protection is `007`'s trigger, proved by attempting the
   forgery. (REPORT-2026-08-10.md §2.)
2. **`SUPABASE_SETUP.sql`.** It declared `create unique index … (email, event)`
   on `course_events`. Production never had it. Every `/api/track` upsert
   failed with a 500 for 110 days while the file said the write path was sound.
   (SECURITY-NOTES.md, "SUPABASE_SETUP.sql should be regenerated".)
3. **`vercel.json`'s apex redirect.** Commit `6835eb5` added a 301 from
   `prompten.xyz` to www and explained why it belonged in config. It never
   fired. The Vercel project's domain settings already redirected the apex,
   with no status code set (Vercel's default is 307), and domain redirects run
   before `vercel.json`. For seven weeks the apex sent a *temporary* redirect,
   and the repo said permanent. Found in September 2026 by
   `curl.exe -I https://prompten.xyz/quiz`. The domain setting is now 308, and
   the dead rule was deleted rather than commented: a live config file that
   states a rule which can't fire is a false statement about the system, and
   that is exactly what misled here.

4. **The certificate grandfather clause.** Accounts created before the
   2026-04-20 syllabus expansion were meant to qualify at 22 lessons instead of
   26. The rule keys on `auth.users.created_at`. Measured on 29 September 2026,
   the earliest account in the database was created on **2026-04-25**, the day
   the localStorage-to-Supabase migration shipped. **0 of 1,668 accounts
   predate the cutoff**, so the clause has protected no one, and as built never
   could. The cohort it describes used the app before Supabase existed, and
   `migrateLegacyUser` gave them new accounts at migration time, stamped after
   the cutoff, with no marker recording that they were migrated. The clause
   had a careful comment explaining why `created_at` was the right key, and a
   build-time check that it was still present. Nothing ever asked whether it
   matched a single account. It was removed on 29 September 2026; claims from
   that cohort are now handled by hand (CERTIFICATE-CLAIMS.md), and the guard
   now fails if a date-keyed exception reappears.

This one is in code, not config, and that is the point: the shape isn't
about file types. A rule that is correct about its inputs and wrong about the
world passes review, passes tests written from the rule, and does nothing.

**The next one won't look like these.** It will be another file that is
believed because it is in the repo. Treat every declared effect as unverified
until something has observed it.

### Where the apex redirect actually lives

Not in the repo. It is the Vercel project's domain setting for `prompten.xyz`:
redirect to `www.prompten.xyz`, status **308**. To read it:

```
vercel api /v9/projects/prompt-engineering-course/domains
```

To verify it, check the behaviour, not that setting:

```
curl.exe -I https://prompten.xyz/some/path?q=1
# expect: 308, Location: https://www.prompten.xyz/some/path?q=1
```

---

## Running SQL on production: the buffer is what runs

**Run only what you have just read in the editor.** Run executes the buffer,
not the query you meant to open. So the procedure is, every time: a fresh
tab, check the buffer is empty, put the query in, check the buffer holds
exactly that query and nothing else, then Run. ERASURE-PROCEDURE.md step 2
says the same in one line. This is why.

### The 009 snippet, 3 October 2026

Two read-only counts were needed after the reviews canary. The SQL editor
was opened at its "new query" address, `/dashboard/project/<ref>/sql/new`.
It loaded blank, and a few seconds later it switched itself to one of the 29
saved "Untitled query" snippets. That snippet's buffer began:

```
-- 009_revoke_all_sessions.sql
--
-- Revokes every active auth session, for every user.
```

That is the migration that signs every user out of the site. One click of
Run in that tab would have done it again.

Two checks stopped it, both run in the page against the editor's model
rather than by eye:

1. **Before writing:** the buffer must be empty. It wasn't, so nothing was
   typed into the snippet and its text was left as it was.
2. **Before Run:** the buffer must equal the intended query character for
   character, and contain no INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE,
   GRANT or REVOKE. That check refused too.

The results pane still read "Click Run to execute your query", so nothing
had run. The editor's **+** button didn't open a new snippet either. A second
load of the "new query" address gave a blank buffer that stayed blank. Both
queries then ran from that tab after the same two checks.

What this shows:

- **"New query" doesn't promise an empty editor.** The address can land on a
  saved snippet, and it can do so after the page looks loaded. Check the
  buffer just before Run, not just after the tab opens.
- **Saved snippets keep what has been run.** Every query run here is saved
  automatically as "Untitled query", including one-off migrations that must
  never run twice. Delete those snippets once their migration is recorded in
  `supabase/migrations/`.
- **"Fresh tab" alone isn't enough.** The tab was fresh. The buffer check is
  what caught it, and the check before Run is what made it safe.

This belongs with the rest of this file: an opened "new query" looked like
evidence of an empty editor. Only reading the buffer showed what Run would do.
