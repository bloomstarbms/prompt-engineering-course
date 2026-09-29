/**
 * Dynamic route that handles all SPA "pages":
 *   /course  /profile  /cert  /auth
 *
 * Each renders the same CourseApp shell, which reads usePathname() to
 * decide what to display. Specific routes (api/*, verify/*, admin,
 * reset-password) are still handled by their own Next.js route files and
 * take precedence over this dynamic segment.
 *
 * ANY OTHER SEGMENT IS A 404. This route used to render the landing view for
 * every single-segment path it was handed — /asdf, /wp-admin, /COURSE — each
 * a 200 (noindex, but still an unbounded set of soft 404s duplicating the
 * landing page). It now checks the segment against APP_PAGES and calls
 * notFound() otherwise. Matching is exact and case-sensitive; /COURSE 404s.
 */
import { notFound } from 'next/navigation';
import CourseApp from '@/components/CourseApp';
import { APP_PAGES } from '@/lib/courseRoutes';

/**
 * NOINDEX — mostly steady state, not a holding measure. Read to the end
 * before removing this: a blanket removal is a regression.
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
 * NOT A HOLDING MEASURE — this is the steady state for these routes.
 *
 * /course, /profile, /cert and /auth are application surfaces, not content.
 * They have nothing to index now and will have nothing to index later, so this
 * tag stays. Do not remove it in Task 4.
 *
 * THE FULL INDEXABLE SET, so Task 4 does not have to rediscover it:
 *
 *   indexable   the landing page, /about, /privacy, /terms,
 *               and the 3 public Module 01 lessons              (7 URLs)
 *   noindex     the 4 app surfaces above
 *               the 23 gated lesson URLs   (no content without an account)
 *               all 26 lesson quiz URLs    (interactive, account-only)
 *               /admin, /reset-password, /verify/<id>  (own route files)
 *   404         any other path, including unknown single segments here
 *
 * The sitemap lists exactly the indexable set and nothing else. Quiz routes
 * are noindex for the same reason /profile is — they are a form, not a
 * document — and they carry their own tag in the quiz route file.
 */
export const metadata = {
  robots: { index: false, follow: true },
};


// These are the only valid slugs this route serves. Any other single-segment
// path not matched by a specific route still reaches this file, and Page()
// below 404s it.
export function generateStaticParams() {
  // 'quiz' is gone: it now lives at /course/<m>/<l>/quiz so it can read its
  // position from the URL rather than inferring one from lastLesson. A stale
  // bookmark of /quiz is 301'd to /course by vercel.json, before this route
  // is reached.
  return APP_PAGES.map(page => ({ page }));
}

export default function Page({ params }) {
  if (!APP_PAGES.includes(params?.page)) notFound();
  return <CourseApp />;
}
