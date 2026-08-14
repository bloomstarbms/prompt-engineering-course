# Security notes

Last reviewed: 13 August 2026. Dependencies against `next@14.2.35`.

This file exists because tooling reports findings that are **not fixed**, and the
reason they are acceptable is not visible from the tooling output. Anyone reading
`8 high severity vulnerabilities` without this note has two options: panic, or
ignore it. Both are wrong.

---

## Open: `course_events` table grants are wide open

**Every role holds every privilege**, confirmed 13 August 2026:

| grantee | privileges |
|---|---|
| `anon` | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| `authenticated` | same |
| `postgres` | same |
| `service_role` | same |

**`anon` can DELETE and TRUNCATE this table.** Reads are blocked by a
`select using (false)` policy and the `allow inserts` policy only covers INSERT
— but RLS does not restrain `TRUNCATE`, which is a table-level operation checked
against the grant, not the policy. An unauthenticated caller holding only the
public anon key could empty the analytics table.

Nothing exploits this today, and there is no evidence anyone has tried. But
"unreachable because nobody has looked" is the weakest form of safe, and this
table's lockdown has now been deferred twice — once during the original RLS work
and again during the 110-day tracking outage.

**What it would take:** revoke the surplus from `anon` and `authenticated`,
leaving `anon` with INSERT only (which `/api/track` no longer needs either, since
it now uses the service role) and `service_role` with everything. That is a small
migration, and it should be verified by *attempting* a delete as `anon` and
watching it fail — not by re-reading the grant table, which is the mistake
migration 006 made.

**Why it is not urgent:** the table holds analytics events, not user data. Its
worst case is losing funnel history, which is annoying rather than harmful — and
as of 13 August the dashboard no longer derives its figures from it.

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
