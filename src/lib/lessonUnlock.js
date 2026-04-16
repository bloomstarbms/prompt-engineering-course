import { MODULES, PASS_THRESHOLD } from '@/data/courseData';

/**
 * Returns true if lesson [mi][li] is accessible given current progress.
 * A lesson is unlocked when:
 *   - It's the very first lesson (mi=0, li=0), OR
 *   - The previous lesson is marked complete AND (if it had a quiz) that
 *     quiz was passed at >= PASS_THRESHOLD.
 *
 * Single source of truth — imported by both CourseApp and Sidebar.
 */
export function isLessonUnlocked(mi, li, completed, quizScores) {
  if (mi === 0 && li === 0) return true;

  let pmi = mi, pli = li - 1;
  if (pli < 0) {
    pmi = mi - 1;
    if (pmi < 0) return true;
    pli = MODULES[pmi].lessons.length - 1;
  }

  const pk = `${pmi}-${pli}`;
  if (!completed[pk]) return false;

  const qs = quizScores[pk];
  if (qs && Math.round(qs.score / qs.total * 100) < PASS_THRESHOLD) return false;

  return true;
}
