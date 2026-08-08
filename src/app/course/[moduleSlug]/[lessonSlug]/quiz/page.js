import { notFound } from 'next/navigation';
import CourseApp from '@/components/CourseApp';
import { resolvePosition, allLessonParams } from '@/lib/courseRoutes';

/**
 * NOINDEX — permanent. This is an app surface, not a document.
 *
 * Quiz routes belong with /profile and /cert, not with the three public
 * lessons: they require an account, they render an interactive form rather
 * than content, and there is nothing here for a crawler to index. All 26 stay
 * noindex forever and none of them appear in the sitemap — indexable set and
 * sitemap must describe exactly the same URLs.
 *
 * `follow: true` so link equity still flows back to the lesson.
 */
export const metadata = {
  robots: { index: false, follow: true },
};

/**
 * The quiz for one lesson: /course/<moduleSlug>/<lessonSlug>/quiz
 *
 * This route exists because the quiz WRITES. onQuizDone stores
 * quiz_scores[`${m}-${l}`] and completed[`${m}-${l}`], so the position it
 * believes it is at determines which lesson gets credited.
 *
 * The previous top-level /quiz had no position of its own and re-derived one
 * from progress.lastLesson. When that was stale it served a different
 * lesson's quiz and wrote the result to that lesson's key — a reader who
 * opened a shared lesson link and passed its quiz was credited for a lesson
 * they never opened. Resolving position from the URL removes the inference
 * rather than making it more reliable.
 *
 * Same resolution as the lesson route, and deliberately the same 404: an
 * unknown slug pair is a wrong URL, not a redirect target.
 */
export function generateStaticParams() {
  return allLessonParams();
}

export default function LessonQuizPage({ params }) {
  const pos = resolvePosition(params.moduleSlug, params.lessonSlug);
  if (!pos) notFound();
  return <CourseApp initialM={pos.mi} initialL={pos.li} />;
}
