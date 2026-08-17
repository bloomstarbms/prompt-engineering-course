# Security notes

Last reviewed: 13 August 2026. Dependencies against `next@14.2.35`.

This file exists because tooling reports findings that are **not fixed**, and the
reason they are acceptable is not visible from the tooling output. Anyone reading
`8 high severity vulnerabilities` without this note has two options: panic, or
ignore it. Both are wrong.

---

## Open — HIGHEST PRIORITY: `course_events` does not cascade on deletion, and the Privacy Policy says it does

**This is a published commitment we are not meeting. It outranks everything
else in this file, because everything else is a risk and this one has already
happened.**

The Privacy Policy states, in `src/content/legal.js`:

> When you ask us to delete your account, we delete your profile, progress and
> usage events.

`profiles`, `progress` and `certificates` all carry
`references auth.users on delete cascade`, so those three are true
automatically. **`course_events` has no foreign key to `auth.users` at all.**

**Consequence: every account deletion performed so far has left the person's
name and email address behind in `course_events`.** Not archived, not
anonymised — the same two fields, in a table nobody reads, with no deletion
path and no retention clock running against them. The policy also promises
usage events are "kept for 24 months, then deleted"; there is no job that does
that either.

### Until the table is retired, erasure has a fifth step

Account deletion is not complete without it. Add to whatever the erasure
procedure is, and do it every time:

```sql
delete from public.course_events where email = 'THE-ADDRESS';
```

Lowercase the address before running it — `/api/track` normalises with
`toLowerCase().trim()` on the way in, so a mixed-case address will match
nothing and the delete will silently affect zero rows. **Check the row count.**
A `DELETE 0` here means either the person never had an event or you typed the
address in the wrong case, and those two look identical from the outside.

### This is the argument that moves retirement up the list

Retiring `course_events` is the only open item in this file with a **published
promise already running against it**. Every other entry is a risk that has not
bitten; this one is a commitment that is being broken today, and each new
deletion adds a row to the pile.

Dropping the table discharges the obligation completely and permanently — no
cascade to add, no retention job to write, no fifth step to remember. Repairing
it instead would mean adding a foreign key, backfilling deletions that can no
longer be identified (the accounts are gone; there is nothing left to join
against), and building a 24-month expiry — all to preserve a table that, after
15 August 2026, **nothing reads**.

See the retirement plan in the entry below.

---

## RESOLVED 17 Aug 2026 — `enroll` is working. This entry is kept because the diagnosis in it was WRONG, and the way it was wrong is the useful part.

**READ THIS CORRECTION BEFORE THE ENTRY BELOW.**

On 15 August this was written up as *"the enroll calls are not reaching the
server at all"*, with a confident mechanism and a sequence-gap proof. Measured
again on 17 August:

| day | new `auth.users` | `enroll` rows |
|---|---|---|
| 13 Aug | 47 | 0 |
| 14 Aug | 39 | 0 |
| **15 Aug** | 15 | **5** |
| **16 Aug** | 11 | **11** |
| **17 Aug** (partial) | 7 | **6** |

Eleven of eleven on the 16th. It works.

**What actually fixed it was the change this repository explicitly told you was
not a fix.** `/api/track` was switched from the anon client to
`createAdminClient()` in commit `9487923`, and the route's own comment says, in
capitals, *"SERVICE ROLE, ON PRINCIPLE — NOT AS A BUGFIX … Do not read it as the
fix for the 110-day outage."* The enroll rows begin appearing within hours of
that deployment being promoted, after 48 registrations across the two preceding
days produced none. That comment was reasoning from a grant table — anon holds
INSERT, the policy allows it, therefore permissions cannot be the problem —
which is exactly the style of argument this file keeps catching.

**It is a correlation, not a proof.** What would settle it is the promotion
timestamp of that deployment against the timestamp of the first enroll row on
15 Aug. Anyone with a reason to care should check that rather than trust this
paragraph.

**Why the sequence-gap proof failed, and this is the lesson worth keeping.**
The technique was sound and the arithmetic was right. The inference was not.
`ON CONFLICT DO NOTHING` burns a `nextval` only for statements that reach
execution — so a small gap means few statements arrived. That correctly ruled
out *"the request arrives and is discarded"*. It did **not** rule out *"the
request arrives, and the route returns 200 without ever reaching the
database"*, which is precisely what the previous version of that route did: it
returned `{ ok: true, configured: false }` when the client was unavailable.
**A success-shaped failure leaves no trace in the sequence, so the evidence
that looked conclusive was blind to the one cause that was actually operating.**
A measurement can be correct, and its scope still smaller than the conclusion
drawn from it.

### Open: WHY the old route wrote nothing is NOT established

Recorded deliberately as unresolved, because the first two explanations offered
for it were both wrong and both sounded finished.

**What is measured:** 48 registrations across 14 Aug and the morning of 15 Aug
produced zero `course_events` rows and burned zero sequence values, with the
unique index already in place since 13 Aug. After the deployment on 15 Aug at
~14:21 UTC, 11 registrations on 16 Aug produced 11 rows.

**What is NOT measured, and was wrongly written up as if it were:** nobody ever
observed the old route return `{ ok: true, configured: false }`. That branch was
*inferred* from "no rows, no burned sequence values". **"The client never sent
the request" and "the route returned 400 early" produce identical evidence.**
The inference is reasonable — the client code was unchanged across the boundary,
so a client that calls now was calling then — but it is an inference.

**A missing anon key was proposed as the cause and does not survive scrutiny.**
`NEXT_PUBLIC_*` values are inlined into the browser bundle at build time, from
the same Vercel environment the server runtime reads. Had the key been absent,
the bundle would have been built without it and the site would have been dead
for everyone. It was not. "Present at build, absent at runtime" needs a
mechanism, and no mechanism has been produced.

Ruled out so far:

| Candidate | Status |
|---|---|
| Variable scoped to a subset of Vercel environments | **Cannot produce a build/runtime split** — a production build and production runtime read the same set |
| Different runtime for that route (Edge vs Node) | **Ruled out** — no `export const runtime` anywhere in `src/`, no edge config in `next.config.js`. `/api/consent` and `/api/certificates/issue` run the same way and read `NEXT_PUBLIC_SUPABASE_URL` successfully |
| Anon key missing from the server runtime | **Ruled out by measurement, 17 Aug — see below** |
| Something else, upstream of or inside the route | **Open, and unnamed. This is where it ends.** |

Note the second row also weakened the missing-key theory independently:
`supabaseAdmin.js` reads `NEXT_PUBLIC_SUPABASE_URL` and works in production, so
at least one `NEXT_PUBLIC_` value is definitely readable in the server runtime.

### The measurement that closed the missing-key theory

A temporary route, `/api/diag-config`, returned three booleans from the
production server runtime — presence of each variable, plus `SUPABASE_CONFIGURED`
as computed by `src/lib/supabase.js` itself, which is the exact expression the
old `/api/track` branched on:

```json
{"url":true,"anon":true,"configured":true,"at":"2026-08-17T21:28:58.937Z"}
```

**The anon key is present and the client is configured in the server runtime.**
The route has been deleted; it existed to answer this and nothing else.

**The limit of that measurement, stated plainly because the two errors in this
file came from overstating exactly this kind of thing:** it describes
17 August, not 14 August. A runtime that is correct today does not prove it was
correct then.

What makes the theory untenable anyway is a separate fact — **the 500 on
13 August at 20:07**. That status means execution got *past* the `!supabase`
branch and reached the `ON CONFLICT` planning error, so the anon client was
configured and working in production that evening. For a missing key to explain
the 14th, the environment would have had to break after the 13th and be repaired
before the 17th, without any deployment in between shipping the empty value into
the browser bundle — where it would have taken the site down for everyone. It
never went down.

### Terminal state: cause not established

**Both surviving hypotheses — an unconfigured client, and the client not sending
the request — require something to have changed between 13 and 14 August, and
neither names it.** The 13th proves the client called and the server was
configured. The 14th shows 39 registrations, zero rows and zero burned sequence
values *with the index already in place*, which means the statement that failed
at planning the previous evening should have succeeded. Nothing reached Postgres
and nobody knows why.

**This is deliberately where it stops, and that is a conclusion rather than an
abandonment.** The component is being retired; nothing reads it; and the failure
class now announces itself, because `lib/supabase.js` throws on use instead of
returning `null`. Three of the four reasons to care are closed. The fourth is
curiosity.

Two plausible, well-argued explanations were written down during this
investigation and both were wrong: that the sequence gap proved the requests
never arrived, and that `{ ok: true, configured: false }` had been observed when
it had only been inferred. A third would have been believed by the next reader
for the same reason the first two were. **An unexplained gap, recorded as
unexplained, cannot mislead anyone.**

**What remains true and still matters:** `enroll` duplicates
`auth.users.created_at` and carries nothing that is not held more reliably
elsewhere; nothing in the application reads `course_events` any more; and the
no-cascade privacy gap above is unaffected by any of this. **Retirement is still
the right call** — it is just no longer being recommended for a broken table,
which makes the argument stronger rather than weaker.

The original entry follows, uncorrected, because a note that quietly rewrites
itself teaches nobody anything.

---

### Original entry, 15 August 2026 — superseded, and wrong in its conclusion

**Found 15 August 2026, immediately after migration 010 was believed to have
fixed analytics. It did not fix this half.**

Migration 010 created the missing unique index on `course_events (email, event)`
and `/api/track` began working — verified by a direct POST returning `200` with
a row landing, and by a genuine `complete` event arriving unaided. The natural
conclusion was that the 110-day outage was over. **For `enroll` it was not, and
it never had been about the index at all.**

### The measurement

| day | new `auth.users` | `enroll` rows written | `complete` rows |
|---|---|---|---|
| 11 Aug | 355 | 0 | 0 |
| 12 Aug | 135 | 0 | 0 |
| 13 Aug | 47 | 0 | 0 |
| **14 Aug** (index exists) | **39** | **0** | 0 |
| **15 Aug** (index exists) | **9** | **0** | 1 |

Forty-eight registrations after the index existed produced **zero** enrollment
rows. Those 48 are real people, not bots: every one has a `profiles` row, a
non-empty name, a confirmed email, a completed sign-in, and 18 of them have
`progress` rows.

### The sequence is what proves it, and the technique is worth keeping

Row counts alone cannot distinguish *"the request never arrived"* from
*"it arrived and was discarded as a duplicate"*. The id sequence can.

`ON CONFLICT DO NOTHING` **evaluates column defaults — including `nextval` —
when it builds the candidate row, before it detects the conflict and throws the
row away.** Sequence values are also non-transactional, so a discarded insert
still burns an id permanently. **A gap in the ids is therefore a count of
statements that reached execution but wrote nothing.**

Measured 15 Aug: `course_events_id_seq.last_value` = **900**, `max(id)` = **893**,
`count(*)` = **793**. Since the index was created, **26 statements reached
execution and produced exactly 2 rows.**

A new user's `enroll` cannot conflict — there is nothing for it to collide
with — so an arriving enroll must produce a row. None did. The ~24 discarded
statements are `complete` re-fires from people who finished long ago
(`trackedComplete` in `CourseApp.js` is a per-mount ref, so it re-posts once per
session, forever). **The enroll calls are not reaching the server at all.**

### What has been ruled out, by measurement rather than reading

* **The route and the insert work** — a direct POST with a fresh address
  returned `200 {"ok":true}` and the row landed.
* **The index works** — same test.
* **The code ships** — the production bundle chunk `554-*.js` contains
  `/api/track` with `event:"enroll"` adjacent to it. It is not being tree-shaken
  or stripped.
* **It is not a form navigation aborting the fetch** — `AuthPage.handleSubmit`
  calls `preventDefault`, and there is no `window.location` assignment anywhere
  in the auth path.

**The cause is still unknown.** The one path that skips the call silently is
`supabase.auth.signInWithPassword` returning an error in `handleRegister`
(`src/hooks/useAuth.js`), which returns before reaching line 371 — users would
then sign in manually, which still sets `last_sign_in_at` and would look exactly
like the data above. That is a hypothesis, not a finding. Do not repeat it as
though it were established.

### Why this is written down here rather than left to be noticed

**As of 15 August the admin dashboard reads `auth.users`, `profiles` and
`progress` instead of `course_events`** — which is correct, and which means
**nothing in the application reads `course_events` any more.** A write path that
fails silently, feeding a table with no readers, produces no symptom of any
kind. Without this note the next person meets a table that stopped growing in
April, no explanation, and no way to tell whether that was deliberate.

**The open decision is not "fix enroll" but "should enroll exist".** `enroll`
carries `email`, `name`, `created_at` — all three already held, more reliably,
in `auth.users` and `profiles`. `complete` carries one datum that is genuinely
not derivable: *when* someone finished, since `progress.updated_at` is rewritten
on every save and records last activity rather than completion. Even that is
better served by `certificates.issued_at` for the 53 people who claimed one, and
`course_events` holds only 14 completions against those 53. Retiring the table
is the leading option; see the recommendation in the engagement report.

If it is retired, note that `course_events` has **no foreign key to
`auth.users`**, so it does not cascade on account deletion: 779 names and email
addresses would survive the erasure of the accounts they belong to. That is a
retention problem the privacy policy does not contemplate, and it is an argument
for dropping the table rather than merely abandoning it.

---

## Open: `SUPABASE_SETUP.sql` should be regenerated, not patched again

That file has now been **wrong about `course_events` three separate times**:

| What it said | What production has | Found |
|---|---|---|
| policy `course_events: insert` | policy `allow inserts` | during the RLS audit |
| `create unique index … (email, event)` | no such index existed | 13 Aug 2026, after a 110-day outage |
| `id uuid default gen_random_uuid()` | `id` is an **integer** | 13 Aug 2026 |

The third was found incidentally while reading a result grid, which is the
problem: nobody is checking, and each divergence is discovered only when it
causes an outage or someone happens to look.

The missing index is the expensive one. `/api/track` upserts with
`onConflict: 'email,event'`; Postgres rejects that at planning time without a
matching constraint, so **every analytics write failed with a 500 for 110 days**
while the file confidently declared the index existed. Anyone reasoning from the
repo would have concluded the write path was sound.

**Regenerate it from the live schema** — `pg_dump --schema-only`, or Supabase's
schema export — rather than patching the next discrepancy by hand. Patching has
been tried three times and has produced a file that is right in most places,
which is worse than one that is obviously stale: it is trusted.

The file's own header already says *"a confidently wrong map is worse than
none"*. It is describing itself.

---

## Open: `course_events` table grants are wide open

**Every role holds every privilege**, confirmed 13 August 2026:

| grantee | privileges |
|---|---|
| `anon` | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| `authenticated` | same |
| `postgres` | same |
| `service_role` | same |

**This is a surplus privilege, not an open door. Rank it accordingly.**

The `anon` role holds DELETE and TRUNCATE on paper, and it is true that RLS does
not restrain `TRUNCATE` — that is a table-level operation checked against the
grant rather than per-row against a policy, so the `select using (false)` policy
that makes this table feel locked down does nothing against it.

**But the grant is not reachable through the public API:**

- **PostgREST exposes no TRUNCATE verb at all.** There is no request that
  reaches it.
- **The anon key is a JWT for PostgREST, not database credentials.** Exercising
  the `anon` role's grants directly requires a Postgres connection, which
  requires the database password — a different secret, not the public one.
- **DELETE is refused by default-deny.** The grant exists, but there is no
  DELETE policy, and RLS denies what no policy permits.

So an attacker holding the public anon key cannot empty this table. Someone
holding the database password could — but they could do considerably worse, and
the grant is not what would be protecting you.

This is hygiene: a privilege that serves no purpose and should not exist.
Worth an hour, not an evening, and not ahead of anything else in this file.

The reason it is written down rather than left in a conversation is that this
table's lockdown has been deferred twice — once during the original RLS work,
again during the 110-day tracking outage — and each deferral loses the reasoning
about *why* it was safe to defer.

**What it would take:** revoke the surplus from `anon` and `authenticated`,
leaving `anon` with INSERT only (which `/api/track` no longer needs either, since
it now uses the service role) and `service_role` with everything. That is a small
migration, and it should be verified by *attempting* a delete as `anon` and
watching it fail — not by re-reading the grant table, which is the mistake
migration 006 made.

**Why it is not urgent:** the grant is unreachable from the public API (above),
and the table holds analytics events rather than user data. Its worst case is
losing funnel history, which is annoying rather than harmful — and as of
13 August the dashboard no longer derives its figures from it.

**A note on how this entry was written**, because it is instructive. The first
draft said an unauthenticated caller with the anon key "could empty the analytics
table". That was wrong in the way that matters: technically defensible about the
grant, wrong about reachability, and phrased urgently enough to send the next
reader down a two-hour path for a ten-minute problem. Overstating a finding costs
attention that a real one will need later.

---

## Current state

| Scope | Findings |
| ----- | -------- |
| `npm audit --omit=dev` (what ships) | **2 high** — `next`, `postcss` |
| `npm audit` (everything) | **8 high** — the two above plus six in the `eslint` tree |

Fixed on 9 August 2026 by moving `next` 14.2.3 → 14.2.35 and running
`npm audit fix`:

* `next` — dropped from **critical** to high; 34 advisories → 22
* `nanoid` 3.3.11 → 3.3.18 — cleared
* `ws` 8.20.0 → 8.21.3 — cleared
* `brace-expansion`, `js-yaml` (dev, eslint tree) — cleared

`next` is pinned **exactly**, without a caret, deliberately. A clean
`npm install` must not drift onto a Next version nobody has run the SSR
verification against.

---

## Why the remaining `next` advisories are not live

**Read this part carefully. It is the whole point of the file.**

The ~22 outstanding `next` advisories are unreachable because this application
does not use the features they attack. As of the date above:

| Feature | Present? | Advisories it would activate |
| ------- | -------- | ---------------------------- |
| `middleware.ts` / `middleware.js` | **No** | Middleware/proxy bypass, middleware redirect SSRF, middleware cache poisoning |
| `next/image` or an `images` config | **No** | Every Image Optimization advisory — DoS, cache-key confusion, content injection, `remotePatterns` DoS, unbounded disk cache |
| Server Actions (`'use server'`) | **No** | Server Action DoS, SSRF on custom servers, unbounded Edge payload, unauthenticated Server Function endpoint disclosure |
| `rewrites` in `next.config.js` | **No** | Rewrites SSRF, HTTP request smuggling in rewrites |
| A custom server | **No** — `next start` on Vercel | Custom-server SSRF |
| i18n routing | **No** | Pages Router i18n middleware bypass |
| CSP with nonces | **No** | Nonce-based XSS in App Router |
| `next/script` `beforeInteractive` | **No** | `beforeInteractive` XSS |

What **is** present, and therefore what the residual risk actually is:

* **App Router + React Server Components.** The cache-poisoning and
  cache-confusion class (RSC response cache poisoning, response-body cache
  confusion, RSC cache-buster collisions, Server Component DoS) is the only
  reachable group. Partially mitigated by the fact that 73 of the routes are
  prerendered static and the dynamic surface is six `force-dynamic` POST route
  handlers under `/api`.

### This is unreachable by coincidence, not by construction

Nothing in this codebase *prevents* someone adding `middleware.js`, or an
`<Image>` tag, or a Server Action. There is no lint rule, no build guard, and no
test that would fail. The day someone adds one of the features in the table
above, the corresponding advisory row becomes live — silently, with no warning
from any tool in the pipeline, because `npm audit` output will not change.

**So: if you are adding middleware, `next/image`, Server Actions, rewrites, or a
custom server, upgrading Next is part of that task, not a separate one.**

---

## Why `postcss` is not live

`postcss` 8.4.31 is a transitive dependency of `next` and cannot be moved
without `next@16`. It is **build-time only** — verified by grepping the build
output, where `postcss` and `nanoid` appear zero times in both `.next/server`
and `.next/static`. It never reaches the deployed runtime.

All four advisories require attacker-controlled CSS (`sourceMappingURL` in a CSS
comment, or `</style>` in stringify output). The build consumes one authored
stylesheet, `src/app/globals.css`. If a future change starts feeding
user-supplied or third-party CSS through the build, this reasoning expires.

## Why the six `eslint`-tree findings are not live

`eslint-config-next`, `@next/eslint-plugin-next`, `@typescript-eslint/*`, `glob`
and `minimatch` are `devDependencies`. They run during linting on a developer
machine and in CI. They are not installed by `npm ci --omit=dev` and are not
part of any deployed artifact. Their fix path is `eslint-config-next@16`, which
is tied to the same major upgrade.

---

## The upgrade that closes the rest

`next@16.3.0` clears every remaining finding, including `postcss` and the eslint
tree. It is **two majors** (14 → 15 → 16) and is not a dependency-maintenance
task:

* Next 15 makes `cookies()`, `headers()` and route `params` async
* The server-rendering behaviour this site depends on — public lesson bodies in
  the server HTML, gated lessons emitting a body-less shell — must be
  re-verified afterwards, not assumed

Treat it as its own piece of work with the full verification pass, described in
the `PUBLIC_LESSONS_INDEXABLE` comment in `src/lib/seo.js`, re-run at the end.

---

## How to re-check

```bash
npm audit --omit=dev        # what ships
npm audit                   # everything, including lint tooling
```

If the production count is anything other than `next` and `postcss`, something
new arrived and this file is out of date.
