import { MODULES } from '@/data/courseData';

/**
 * Slug ↔ position mapping for course URLs.
 *
 * ─── THE RULE THIS FILE EXISTS TO ENFORCE ─────────────────────────────────
 * progress.completed and progress.quiz_scores are keyed by POSITION —
 * `${m}-${l}` — and always will be. Slugs are a URL surface layered on top;
 * they are never a storage key and never derived from one.
 *
 * Direction matters:
 *
 *   resolvePosition(moduleSlug, lessonSlug) -> { mi, li }
 *       AUTHORITATIVE. Routing resolves a URL to a position exactly once, at
 *       the route boundary. Everything downstream works in indices.
 *
 *   lessonHref(mi, li) -> '/course/<moduleSlug>/<lessonSlug>'
 *       PRESENTATION ONLY. Builds a link for a position we already hold. It
 *       must never be round-tripped back into a storage key — take the index
 *       you already have instead of re-deriving it from a URL you just built.
 *
 * Both read the same authored slugs in courseData.js, so they cannot disagree.
 * scripts/check-course-integrity.mjs fails the build if a slug ever moves to a
 * different position, which is what stops a URL change from silently
 * repointing stored progress.
 * ────────────────────────────────────────────────────────────────────────── */

/** Slug pair -> { mi, li }, or null if either slug is unknown. */
export function resolvePosition(moduleSlug, lessonSlug) {
  if (!moduleSlug || !lessonSlug) return null;
  const mi = MODULES.findIndex(m => m.slug === moduleSlug);
  if (mi === -1) return null;
  const li = MODULES[mi].lessons.findIndex(l => l.slug === lessonSlug);
  if (li === -1) return null;
  return { mi, li };
}

/** Position -> canonical lesson URL. Presentation only; see the note above. */
export function lessonHref(mi, li) {
  const m = MODULES[mi];
  const l = m?.lessons?.[li];
  if (!m || !l) return '/course';
  return `/course/${m.slug}/${l.slug}`;
}

/** Position -> that lesson's quiz URL.
 *
 *  The quiz lives under its lesson rather than at a top-level /quiz because
 *  it WRITES to quiz_scores[`${m}-${l}`] and completed[`${m}-${l}`]. A route
 *  that infers its own position can write to the wrong key; a route that
 *  reads it from the URL cannot. Presentation only, same rule as lessonHref.
 */
export function quizHref(mi, li) {
  const href = lessonHref(mi, li);
  return href === '/course' ? '/course' : `${href}/quiz`;
}

/** Position -> the module's first lesson. Used by landing-page module cards. */
export function moduleHref(mi) {
  return lessonHref(mi, 0);
}

/**
 * A stored resume position, clamped to something that exists.
 *
 * `progress` is user-writable by design — that is the accepted limit we live
 * with on quiz scores — so `last_lesson` is untrusted input, not app-authored
 * data. The build guard freezes the shape of MODULES; it says nothing about
 * what is in a row. Anyone can PATCH their own row to {m:99,l:99}.
 *
 * That matters because CourseApp computes `MODULES[activeM].lessons[activeL]`
 * before any branch runs, on every route that does not carry a position in the
 * URL — `/`, `/course`, `/profile`, `/cert`, `/auth`. An unresolvable position
 * throws there, so the reader is locked out of every one of those routes at
 * once, with no in-app way back: the only surfaces that could fix the value
 * are the ones that crash. Recovery would mean editing the database by hand.
 *
 * Clamping on read costs a lookup and removes that entirely. Self-inflicted or
 * not, a user should not be able to brick their own account.
 */
export function clampPosition(pos) {
  const m = Number(pos?.m);
  const l = Number(pos?.l);
  if (!Number.isInteger(m) || !Number.isInteger(l)) return { m: 0, l: 0 };
  if (!MODULES[m]?.lessons?.[l]) return { m: 0, l: 0 };
  return { m, l };
}

/** True when a lesson is readable without an account (Task 3b). */
export function isPublicLesson(mi, li) {
  return MODULES[mi]?.lessons?.[li]?.isPublic === true;
}

/** Every public lesson, for sitemap generation and static params. */
export function publicLessons() {
  const out = [];
  MODULES.forEach((m, mi) => m.lessons.forEach((l, li) => {
    if (l.isPublic) out.push({ mi, li, moduleSlug: m.slug, lessonSlug: l.slug, module: m, lesson: l });
  }));
  return out;
}

/** Every lesson as a slug pair — used to pre-generate routes. */
export function allLessonParams() {
  return MODULES.flatMap(m =>
    m.lessons.map(l => ({ moduleSlug: m.slug, lessonSlug: l.slug })));
}
