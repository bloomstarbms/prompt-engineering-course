import { SITE_URL } from '@/lib/seo';

/**
 * Crawling is allowed almost everywhere. That is deliberate, and it is not the
 * same decision as indexing.
 *
 * A `Disallow` blocks crawling, not indexing. A blocked URL can still be
 * indexed from inbound links as a bare result with no snippet, and — worse —
 * a crawler that cannot fetch the page can never read the noindex tag telling
 * it to drop the page. Disallowing the routes we want de-indexed would
 * permanently freeze them in the index. So the gated lessons, /course,
 * /profile, /cert, /auth, /quiz and the nested quiz routes are all crawlable
 * and all carry noindex, which is what actually removes them.
 *
 * /api/* is the one exception, and the distinction is the point: those
 * endpoints return JSON, nothing links to them, and we never need a noindex
 * tag honoured there. Disallow is safe precisely because we are not trying to
 * remove anything — only to stop wasting crawl budget.
 */
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
