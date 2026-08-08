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
const { MODULES, QUIZZES, TOTAL_LESSONS } = await import(
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
//  /api/certificates/issue compares completed-key count against TOTAL_LESSONS
//  (or LEGACY_SYLLABUS_LESSONS). If TOTAL_LESSONS drifts from the real array
//  length, issuance breaks or grandfathers the wrong cohort — server-side, so
//  no browser error is ever seen.
const realTotal = MODULES.reduce((a, m) => a + m.lessons.length, 0);
if (TOTAL_LESSONS !== realTotal) {
  fail(`TOTAL_LESSONS (${TOTAL_LESSONS}) != actual lesson count (${realTotal}) — the certificate route counts against this`);
}
const routeSrc = readFileSync(join(root, 'src/app/api/certificates/issue/route.js'), 'utf8');
if (!routeSrc.includes('LEGACY_SYLLABUS_LESSONS') || !routeSrc.includes('TOTAL_LESSONS')) {
  fail('certificates/issue no longer references both TOTAL_LESSONS and LEGACY_SYLLABUS_LESSONS — the grandfather clause may have been removed');
}
if (realTotal < manifest.totalLessons) {
  fail(`lesson count fell below the frozen total (${manifest.totalLessons} -> ${realTotal}); certificate completion checks would break`);
}

// ── 6. QUIZZES keys must reference real lessons ──────────────────────────
for (const k of Object.keys(QUIZZES || {})) {
  const [mi, li] = k.split('-').map(Number);
  if (!MODULES[mi]?.lessons?.[li]) fail(`QUIZZES has key ${k}, which is not a lesson`);
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
console.log(`  course integrity OK — ${MODULES.length} modules, ${realTotal} lessons, ${seenPath.size} unique paths, all frozen positions intact`);
