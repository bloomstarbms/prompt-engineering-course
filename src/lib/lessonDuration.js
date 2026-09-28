/**
 * What a lesson's `dur` means, and how it is computed.
 *
 *   dur = ceil( words / WORDS_PER_MINUTE  +  questions × SECONDS_PER_QUESTION / 60 )
 *
 *   words      the lesson's own text: its `intro` (courseData.js) plus its body
 *              (src/data/modules/<moduleSlug>.js), counted by countWords below
 *   questions  the number of questions in that lesson's quiz (QUIZZES[`${m}-${l}`])
 *
 * So `dur` is estimated time to read the lesson once and take its quiz. It does
 * NOT include time spent on the concept diagram, re-reading, or practice.
 *
 * WORDS_PER_MINUTE = 200. Adult silent reading of general prose is usually put
 * at 230–250 wpm; this is technical material with code and prompt examples that
 * people stop to re-read, so it is set below that.
 *
 * SECONDS_PER_QUESTION = 45. A four-option multiple-choice question is roughly
 * 30–40 words to read, plus time to decide. This is a judgement, not a
 * measurement — we have no timing data from real readers.
 *
 * Rounded UP to a whole minute: an estimate that runs short is worse for the
 * reader than one that runs long.
 *
 * WHY THIS FILE EXISTS. `dur` used to be typed by hand. The values were set for
 * the YouTube videos lessons originally had, and stayed after the videos were
 * removed in July 2026: 501 minutes claimed, against 84 minutes of reading at
 * 200 wpm (16,888 words) and 81 quiz questions. Nothing checked them. The stored values in courseData.js are now verified against this
 * formula by scripts/check-course-integrity.mjs, which fails the build if any
 * disagree. They stay stored (not computed at runtime) because computing them
 * needs every lesson body, and the bodies are split out of the always-loaded
 * bundle on purpose.
 *
 * `dur` feeds the visible lesson time, and in structured data both the
 * per-lesson `timeRequired` and the course-level `courseWorkload`
 * (src/lib/jsonld.js). Changing either constant changes all three.
 *
 * No imports, deliberately: the integrity guard loads this with plain Node,
 * which cannot resolve the '@/…' alias.
 */

export const WORDS_PER_MINUTE = 200;
export const SECONDS_PER_QUESTION = 45;

/**
 * Words a reader actually reads. Markdown links count their label, not their
 * URL; tokens with no letter or digit (`---`, `-`, `|`, `##`, `→`) are markup or
 * decoration, not words.
 */
export function countWords(text) {
  return String(text ?? '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .split(/\s+/)
    .filter(t => /[\p{L}\p{N}]/u.test(t))
    .length;
}

/** Whole minutes to read `words` and answer `questions`. */
export function lessonMinutes(words, questions) {
  return Math.ceil(words / WORDS_PER_MINUTE + (questions * SECONDS_PER_QUESTION) / 60);
}

/** The `dur` string a lesson should carry. */
export function durLabel(minutes) {
  return `${minutes} min`;
}
