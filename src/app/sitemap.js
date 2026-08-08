import { SITE_URL, indexableUrls } from '@/lib/seo';

/**
 * The sitemap lists exactly the indexable set and nothing else.
 *
 * It reads indexableUrls() rather than its own list, so it cannot drift from
 * what the pages' robots tags actually say. Today that is one URL — the
 * landing page — because every other route carries noindex. It grows to four
 * in the same commit that makes the three public lessons indexable, not
 * before: a sitemap is an invitation, and inviting a crawler to a page whose
 * body loads in a client effect is asking to have three empty pages indexed.
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
