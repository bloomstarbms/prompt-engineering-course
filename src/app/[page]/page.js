/**
 * Dynamic route that handles all SPA "pages":
 *   /course  /profile  /cert  /auth  /quiz
 *
 * Each renders the same CourseApp shell, which reads usePathname() to
 * decide what to display. Specific routes (api/*, verify/*, admin,
 * reset-password) are still handled by their own Next.js route files and
 * take precedence over this dynamic segment.
 */
import CourseApp from '@/components/CourseApp';

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


// These are the only valid slugs this route serves.
// Any other single-segment path not matched by a specific route will still
// hit here — CourseApp falls through to the landing view for unknowns.
export function generateStaticParams() {
  return [
    { page: 'course'  },
    { page: 'profile' },
    { page: 'cert'    },
    { page: 'auth'    },
    { page: 'quiz'    },
  ];
}

export default function Page() {
  return <CourseApp />;
}
