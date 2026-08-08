import { notFound } from 'next/navigation';
import CourseApp from '@/components/CourseApp';
import { resolvePosition, allLessonParams } from '@/lib/courseRoutes';

/**
 * HOLDING MEASURE — remove in Task 4.
 *
 * These routes currently serve an empty client-rendered shell that inherits the
 * landing page's title, description and og tags verbatim. 32 prerendered pages
 * presently share one title. Left indexable that is worse than the single
 * sparse page this started as: duplicate titles and thin content across every
 * lesson URL.
 *
 * noindex rather than a robots.txt Disallow, deliberately. Disallow blocks
 * crawling, not indexing — a blocked URL can still be indexed from inbound
 * links as a bare link with no snippet, and if any of these are already indexed
 * the crawler can never fetch the page to learn it should be dropped. noindex
 * permits the crawl and actively de-indexes. It also reverses cleanly: in
 * Task 4 the URLs are already known, so removing it flips them to indexable
 * rather than requiring rediscovery.
 *
 * `follow: true` so link equity still flows and the crawler reaches the
 * landing page.
 *
 * REMOVE THIS once these routes server-render real content and carry their own
 * title, description, canonical and og tags.
 */
export const metadata = {
  robots: { index: false, follow: true },
};


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
