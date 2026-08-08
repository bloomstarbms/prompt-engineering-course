/**
 * Dynamic route that handles all SPA "pages":
 *   /course  /profile  /cert  /auth
 *
 * Each renders the same CourseApp shell, which reads usePathname() to
 * decide what to display. Specific routes (api/*, verify/*, admin,
 * reset-password) are still handled by their own Next.js route files and
 * take precedence over this dynamic segment.
 */
import CourseApp from '@/components/CourseApp';

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
 *   indexable   the landing page, plus the 3 public Module 01 lessons
 *   noindex     the 4 app surfaces above
 *               the 23 gated lesson URLs   (no content without an account)
 *               all 26 lesson quiz URLs    (interactive, account-only)
 *
 * The sitemap lists exactly the indexable set and nothing else. Quiz routes
 * are noindex for the same reason /profile is — they are a form, not a
 * document — and they carry their own tag in the quiz route file.
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
    // 'quiz' is gone: it now lives at /course/<m>/<l>/quiz so it can read its
    // position from the URL rather than inferring one from lastLesson. A stale
    // bookmark of /quiz falls through to the landing view, and the
    // auto-redirect in CourseApp sends a signed-in reader on to /course.
  ];
}

export default function Page() {
  return <CourseApp />;
}
