import { notFound } from 'next/navigation';
import CourseApp from '@/components/CourseApp';
import { resolvePosition, allLessonParams } from '@/lib/courseRoutes';

/**
 * Real, shareable lesson URLs: /course/<moduleSlug>/<lessonSlug>
 *
 * This server component does one job — turn the URL into a position, or 404.
 * Resolution happens here and only here; CourseApp receives plain indices and
 * continues to key progress by them exactly as before.
 *
 * An unknown slug calls notFound() so it renders the real 404 page with a 404
 * status, rather than redirecting to the landing page or leaving an empty SPA
 * shell — both of which look to a crawler like a working page.
 */
export function generateStaticParams() {
  return allLessonParams();
}

export default function LessonPage({ params }) {
  const pos = resolvePosition(params.moduleSlug, params.lessonSlug);
  if (!pos) notFound();
  return <CourseApp initialM={pos.mi} initialL={pos.li} />;
}
