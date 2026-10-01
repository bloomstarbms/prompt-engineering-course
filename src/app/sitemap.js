import { SITE_URL, indexableUrls } from '@/lib/seo';

/**
 * The sitemap lists exactly the indexable set and nothing else.
 *
 * It reads indexableUrls() rather than its own list, so it cannot drift from
 * what the pages' robots tags actually say. Today that is seven URLs: the
 * landing page, /about, /privacy, /terms, and the three public Module 01
 * lessons, whose bodies are server-rendered. (It was one URL until the
 * public lessons became indexable; a sitemap is an invitation, and a page
 * whose body loads in a client effect must not be invited.)
 *
 * No lastModified. We do not track per-page modification dates, and a value
 * of "now" regenerated on every deploy is a claim we cannot support — Google
 * discounts the field wholesale once it looks untrustworthy. Omitting it is
 * more useful than filling it in with a build timestamp. Same reasoning for
 * priority and changeFrequency, both of which Google ignores outright.
 */
export default function sitemap() {
  return indexableUrls().map(path => ({
    url: path === '/' ? SITE_URL : `${SITE_URL}${path}`,
  }));
}
