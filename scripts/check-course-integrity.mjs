#!/usr/bin/env node
/**
 * Course positional integrity check — runs at BUILD TIME, never in the browser.
 *
 * ─── WHY THIS EXISTS ──────────────────────────────────────────────────────
 * progress.completed and progress.quiz_scores are keyed by position — `${m}-${l}`
 * — derived from the order of MODULES and of each module's lessons array. So are
 * QUIZZES, the DIAGRAMS map in LessonArt, and the completion count in
 * /api/certificates/issue.
 *
 * Roughly 422 stored progress rows across 814 users depend on those positions
 * meaning what they meant when they were written. Reorder a module, insert a
 * lesson in the middle, or move one between modules, and every stored key
 * silently points at a different lesson. Nothing throws. Users see completions
 * against work they never did, the wrong diagram renders, and certificate
 * issuance counts the wrong thing.
 *
 * This script freezes the mapping in scripts/course-manifest.json and fails the
 * build if it changes. Appending a lesson to the END of a module is allowed —
 * that adds new keys without moving existing ones. Everything else is refused.
 *
 * ─── IF THIS FAILS AND THE CHANGE WAS DELIBERATE ─────────────────────────
 * Do not regenerate the manifest to make the error go away. Stored user data
 * does not migrate itself. Plan a data migration that rewrites the affected
 * keys first, then regenerate.
 * ────────────────────────────────────────────────────────────────────────── */

import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

const problems = [];
const fail = (msg) => problems.push(msg);

// Node warns MODULE_TYPELESS_PACKAGE_JSON because package.json has no
// "type": "module", so a .js file containing module syntax is re-parsed as ESM.
// Expected and harmless here; adding "type": "module" would break
// next.config.js, which uses module.exports.
//
// Filtered by name rather than suppressed wholesale — a guard that swallows all
// warnings hides the next genuine one, which is the same "trains people to
// ignore output" problem one level up.
const SILENCED = 'MODULE_TYPELESS_PACKAGE_JSON';
const _emitWarning = process.emitWarning;
process.emitWarning = (warning, ...rest) => {
  // emitWarning has three shapes: (warning), (warning, type, code) and
  // (warning, { type, code }). The identifier is the CODE in each, so check all
  // three rather than one — matching on `type` silently filters nothing.
  const code =
    warning?.code ??
    (typeof rest[1] === 'string' ? rest[1] : undefined) ??
    rest[0]?.code;
  if (code === SILENCED) return;
  return _emitWarning.call(process, warning, ...rest);
};

// Loaded through a file:// URL, not a data: URL. A data: URL cannot resolve
// relative specifiers, so the old loader worked only while courseData.js
// happened to have no imports of its own — and the per-module content split
// gives it imports. That would have broken the guard at the exact moment it
// mattered most: a loader failure during the riskiest change to the data it
// protects, which reads as "guard is broken" rather than "data is wrong".
//
// Depending on "this file happens to have no imports" is the same shape of
// implicit invariant as "the unlock rule holds because the sidebar is the only
// way in". Removed rather than documented.
const {
  MODULES, QUIZZES, TOTAL_LESSONS,
  isCourseComplete,
} = await import(
  pathToFileURL(join(root, 'src/data/courseData.js')).href
);

const manifest = JSON.parse(readFileSync(join(here, 'course-manifest.json'), 'utf8'));

// ── 1. Shape: module count and lessons-per-module ────────────────────────
if (MODULES.length !== manifest.lessonsPerModule.length) {
  fail(`module count changed: ${manifest.lessonsPerModule.length} -> ${MODULES.length}`);
}
MODULES.forEach((m, mi) => {
  const was = manifest.lessonsPerModule[mi];
  if (was === undefined) return;
  if (m.lessons.length < was) {
    fail(`module ${mi} (${m.slug}) lost lessons: ${was} -> ${m.lessons.length}. Existing keys now point at nothing.`);
  }
  // Growth is allowed only by appending; positions 0..was-1 are checked below.
});

// ── 2. Every frozen position still resolves to the same lesson ───────────
for (const p of manifest.positions) {
  const [mi, li] = p.key.split('-').map(Number);
  const m = MODULES[mi];
  const l = m?.lessons?.[li];
  if (!m)  { fail(`position ${p.key}: module ${mi} no longer exists (was "${p.moduleTitle}")`); continue; }
  if (!l)  { fail(`position ${p.key}: lesson no longer exists (was "${p.lessonTitle}")`); continue; }
  if (m.slug !== p.moduleSlug) fail(`position ${p.key}: module slug moved "${p.moduleSlug}" -> "${m.slug}"`);
  if (l.slug !== p.lessonSlug) fail(`position ${p.key}: lesson slug moved "${p.lessonSlug}" -> "${l.slug}" — a stored progress key now resolves to a different lesson`);
}

// ── 3. Slugs unique and URL-safe (they are a public contract once shipped) ─
const seenModule = new Set(), seenPath = new Set();
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
MODULES.forEach((m, mi) => {
  if (!m.slug || !SLUG_RE.test(m.slug)) fail(`module ${mi} has an invalid slug: ${JSON.stringify(m.slug)}`);
  if (seenModule.has(m.slug)) fail(`duplicate module slug: ${m.slug}`);
  seenModule.add(m.slug);
  m.lessons.forEach((l, li) => {
    if (!l.slug || !SLUG_RE.test(l.slug)) fail(`lesson ${mi}-${li} has an invalid slug: ${JSON.stringify(l.slug)}`);
    const path = `${m.slug}/${l.slug}`;
    if (seenPath.has(path)) fail(`duplicate lesson path: ${path}`);
    seenPath.add(path);
  });
});

// ── 4. SILENT-FAILURE SITE 1: the DIAGRAMS map in LessonArt ──────────────
//  Keyed by `mi-li`. A reorder shows the wrong illustration with no error at
//  all — it just renders a diagram about the wrong concept.
const artSrc = readFileSync(join(root, 'src/components/course/LessonArt.js'), 'utf8');
const artBlock = artSrc.match(/const DIAGRAMS = \{([\s\S]*?)\};/);
if (!artBlock) {
  fail('could not locate the DIAGRAMS map in LessonArt.js — this check needs updating');
} else {
  const artKeys = new Set([...artBlock[1].matchAll(/'(\d+-\d+)'/g)].map(m => m[1]));
  MODULES.forEach((m, mi) => m.lessons.forEach((_, li) => {
    if (!artKeys.has(`${mi}-${li}`)) {
      fail(`LessonArt has no diagram for ${mi}-${li} (${m.slug}) — it would silently fall back to the placeholder`);
    }
  }));
  for (const k of artKeys) {
    const [mi, li] = k.split('-').map(Number);
    if (!MODULES[mi]?.lessons?.[li]) fail(`LessonArt has a diagram for ${k}, which is not a lesson`);
  }
}

// ── 5. SILENT-FAILURE SITE 2: the certificate route's completion count ───
//  /api/certificates/issue compares the completed count against
//  TOTAL_LESSONS. If TOTAL_LESSONS drifts from the real array length, issuance
//  breaks — server-side, so no browser error is ever seen.
const realTotal = MODULES.reduce((a, m) => a + m.lessons.length, 0);
if (TOTAL_LESSONS !== realTotal) {
  fail(`TOTAL_LESSONS (${TOTAL_LESSONS}) != actual lesson count (${realTotal}) — the certificate route counts against this`);
}
// The completion rule, checked by BEHAVIOUR rather than by grepping for it.
// Every lesson in the syllabus, for everyone. The grandfather clause (22 for
// accounts before 2026-04-20) was removed on 29 Sep 2026 because it matched
// no account; see courseData.js and CERTIFICATE-CLAIMS.md.
{
  const done = n => Object.fromEntries(Array.from({ length: n }, (_, i) => [`x-${i}`, true]));
  const cases = [
    [TOTAL_LESSONS,     true,  'the full syllabus'],
    [TOTAL_LESSONS - 1, false, 'one lesson short'],
    [22,                false, 'the old 22-lesson syllabus'],
  ];
  for (const [n, want, label] of cases) {
    if (isCourseComplete(done(n)) !== want) {
      fail(`isCourseComplete: ${label} (${n} lessons) should be ${want} — the completion rule has changed`);
    }
  }
  // Tripwire: a date-keyed exception must not come back unexamined. If a
  // second argument ever makes 22 lessons plus a pre-expansion date count as
  // complete, the clause is back. Check it matches real accounts first.
  if (isCourseComplete(done(22), '2026-01-01T00:00:00Z')) {
    fail('isCourseComplete treats 22 lessons plus a pre-2026-04-20 date as complete — a created_at grandfather clause has been reinstated. The last one matched 0 of 1,668 accounts; verify against real data before shipping it (VERIFICATION-NOTES item 4)');
  }
  // Falsy entries are anomalies, not completions.
  if (isCourseComplete({ ...done(TOTAL_LESSONS - 1), extra: false })) {
    fail('isCourseComplete counts a falsy lesson entry as completed');
  }
  // Both deciders must use it — one definition, not two.
  for (const rel of ['src/app/api/certificates/issue/route.js', 'src/components/CourseApp.js']) {
    const src = readFileSync(join(root, rel), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/[^\n]*/g, '');
    if (!/\bisCourseComplete\s*\(/.test(src)) {
      fail(`${rel} no longer calls isCourseComplete() — a second definition of "finished" can drift from the first`);
    }
  }
}
if (realTotal < manifest.totalLessons) {
  fail(`lesson count fell below the frozen total (${manifest.totalLessons} -> ${realTotal}); certificate completion checks would break`);
}

// ── 6. QUIZZES keys must reference real lessons ──────────────────────────
for (const k of Object.keys(QUIZZES || {})) {
  const [mi, li] = k.split('-').map(Number);
  if (!MODULES[mi]?.lessons?.[li]) fail(`QUIZZES has key ${k}, which is not a lesson`);
}

// ── 7. `user?.id` is always undefined ────────────────────────────────────
// The auth user object is { email, name, bio, avatarUrl, nameIsDefault } — the
// UUID lives in separate `userId` state. So `user?.id` reads as a perfectly
// ordinary identity check while evaluating to undefined every time.
//
// This is here because it already happened. It was used as a useEffect
// dependency to re-run the arrival effect once auth resolved; being forever
// undefined, the dep never changed, the effect never re-ran, and the resume
// point silently stopped being recorded for readers arriving by URL — which in
// turn let /quiz serve the wrong lesson's quiz and write the result to that
// lesson's key. The build was green throughout. Nothing about the expression
// looks wrong, which is exactly why a grep is worth more than a comment.
for (const rel of ['src/components/CourseApp.js', 'src/hooks/useAuth.js', 'src/providers/AuthProvider.js']) {
  // Strip comments rather than skipping any line containing them. The first
  // version of this check skipped lines matching '//' — and the real offender
  // ends in an eslint-disable comment, so the guard against a vacuous fix was
  // itself vacuous. Blank the comments, keep the code, keep the line numbers.
  const src = readFileSync(join(root, rel), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, '');
  src.split('\n').forEach((line, i) => {
    if (/\buser\s*\?\.\s*id\b/.test(line)) {
      fail(`${rel}:${i + 1} uses \`user?.id\`, which is always undefined — use \`userId\``);
    }
  });
}

// ── Check 8: exactly one consent mechanism can be active ─────────────────
// The blocking ConsentGate and the dismissible ConsentNotice must never be on
// screen together. lib/docs.js makes that structurally true by deriving both
// booleans from a single CONSENT_MODE string — one variable cannot hold two
// values. This check exists for the case where somebody "simplifies" it back
// into two independent booleans, which is exactly the shape it started as.
//
// It asserts three things: CONSENT_MODE exists and is one of the three known
// values, the two exported booleans are derived rather than assigned literals,
// and the derivation cannot make both true.
{
  const rel = 'src/lib/docs.js';
  const src = readFileSync(join(root, rel), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, '');

  const mode = src.match(/export\s+const\s+CONSENT_MODE\s*=\s*'([^']*)'/);
  if (!mode) {
    fail(`${rel}: CONSENT_MODE is missing — the two consent mechanisms are no longer mutually exclusive by construction`);
  } else if (!['off', 'notice', 'blocking'].includes(mode[1])) {
    fail(`${rel}: CONSENT_MODE is '${mode[1]}' — must be 'off', 'notice' or 'blocking'`);
  }

  for (const [name, expected] of [
    ['CONSENT_PROMPT_ENABLED', 'blocking'],
    ['CONSENT_NOTICE_ENABLED', 'notice'],
  ]) {
    const re = new RegExp(`export\\s+const\\s+${name}\\s*=\\s*CONSENT_MODE\\s*===\\s*'${expected}'`);
    if (!re.test(src)) {
      fail(`${rel}: ${name} is not derived as \`CONSENT_MODE === '${expected}'\` — a literal or an independent flag lets both mechanisms be true at once`);
    }
  }
}

// ── Check 9: every stored `dur` matches the formula ──────────────────────
// `dur` was typed by hand for videos that were later removed, and stayed wrong
// for three months because nothing compared it with anything: 501 minutes
// claimed against about 84 of reading. It feeds the visible lesson time, the
// per-lesson `timeRequired` and the course `courseWorkload` in structured data.
// The formula and its constants live in src/lib/lessonDuration.js; this check
// is what makes the stored value a derived one rather than a description.
//
// A missing body is a failure, not a zero: counting an absent body as 0 words
// would produce a plausible-looking short duration and pass.
const D = await import(pathToFileURL(join(root, 'src/lib/lessonDuration.js')).href);
let computedTotal = 0;
for (const [mi, m] of MODULES.entries()) {
  let bodies;
  try {
    ({ bodies } = await import(pathToFileURL(join(root, `src/data/modules/${m.slug}.js`)).href));
  } catch (e) {
    fail(`dur: could not load lesson bodies for module ${mi} (${m.slug}): ${e.message}`);
    continue;
  }
  for (const [li, l] of m.lessons.entries()) {
    const body = bodies?.[l.slug];
    if (typeof body !== 'string' || !body.trim()) {
      fail(`dur: no lesson body for ${mi}-${li} (${m.slug}/${l.slug}) — cannot compute its duration`);
      continue;
    }
    const questions = QUIZZES?.[`${mi}-${li}`]?.questions?.length ?? 0;
    const minutes = D.lessonMinutes(D.countWords(l.intro) + D.countWords(body), questions);
    computedTotal += minutes;
    const expected = D.durLabel(minutes);
    if (l.dur !== expected) {
      fail(`dur: ${mi}-${li} (${l.slug}) stores ${JSON.stringify(l.dur)} but the formula gives "${expected}" — set dur: "${expected}" in courseData.js (see src/lib/lessonDuration.js)`);
    }
  }
}

// ── Check 10: reviews cannot be switched on ahead of the legal text ──────
// REVIEWS_ENABLED gates the routes, the form and the home page section. The
// privacy policy and terms describing reviews shipped first, with the flag
// off; this check keeps that order honest for any later edit — if someone
// trims the "Reviews you choose to publish" section or the terms licence
// while the flag is true, the build stops. The flag must be a literal
// true/false in docs.js, not an env var, so a preview cannot differ from
// what the file says and the build log is the record.
{
  const rel = 'src/lib/docs.js';
  const src = readFileSync(join(root, rel), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, '');
  const flag = src.match(/export\s+const\s+REVIEWS_ENABLED\s*=\s*(true|false)\s*;/);
  if (!flag) {
    fail(`${rel}: REVIEWS_ENABLED is missing or not a literal true/false — the review routes, form and home page section key on it`);
  } else if (flag[1] === 'true') {
    const L = await import(pathToFileURL(join(root, 'src/content/legal.js')).href);
    for (const [doc, text, needle] of [
      ['PRIVACY_MD', L.PRIVACY_MD, '### Reviews you choose to publish'],
      ['PRIVACY_MD', L.PRIVACY_MD, 'for publishing a review you submit'],
      ['TERMS_MD',   L.TERMS_MD,   '**Reviews.** If you submit a review'],
    ]) {
      if (typeof text !== 'string' || !text.includes(needle)) {
        fail(`REVIEWS_ENABLED is true but ${doc} no longer contains ${JSON.stringify(needle)} — the legal text must describe reviews while they are live`);
      }
    }
    // consent_version is this string; a placeholder or an empty one would be
    // recorded as evidence of consent to nothing in particular.
    if (!/^\d{1,2} [A-Z][a-z]+ \d{4}$/.test(L.PRIVACY_UPDATED || '')) {
      fail(`REVIEWS_ENABLED is true but PRIVACY_UPDATED is ${JSON.stringify(L.PRIVACY_UPDATED)} — must be a date like "1 October 2026"; it is stored as consent_version`);
    }
  }
}

// ── Report ───────────────────────────────────────────────────────────────
if (problems.length) {
  console.error('\n  COURSE INTEGRITY CHECK FAILED\n');
  for (const p of problems) console.error('   ✗ ' + p);
  console.error(`\n  ${problems.length} problem(s). Build stopped.`);
  console.error('  Stored progress keys are positional. Read the header of');
  console.error('  scripts/check-course-integrity.mjs before regenerating the manifest.\n');
  process.exit(1);
}
console.log(`  course integrity OK — ${MODULES.length} modules, ${realTotal} lessons, ${seenPath.size} unique paths, all frozen positions intact, all durations match the formula (${computedTotal} min)`);
