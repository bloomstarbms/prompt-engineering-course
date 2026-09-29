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
