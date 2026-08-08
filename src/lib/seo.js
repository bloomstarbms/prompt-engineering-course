import { publicLessons, lessonHref } from '@/lib/courseRoutes';

/**
 * Canonical host and site identity.
 *
 * Hardcoded rather than read from an env var with a localhost fallback. The
 * root layout previously did `process.env.NEXT_PUBLIC_SITE_URL || 'http://
 * localhost:3000'` for metadataBase — if that variable is ever missing from
 * the Vercel project, every canonical and og:image URL silently points at
 * localhost. That failure is invisible in the app and visible only to
 * crawlers, which is the worst combination. The env var still wins when set,
 * so previews can override; the fallback is now production, not a dev machine.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.prompten.xyz').replace(/\/$/, '');

/**
 * One name, used everywhere in metadata.
 *
 * FLAGGED, NOT ACTED ON: the default page title is "Prompt Engineering — Zero
 * to Mastery", and "Zero to Mastery" is an established brand (zerotomastery.io).
 * That title is unchanged here because renaming is a brand decision, not an SEO
 * one. Everything this file feeds says PromptMastery and nothing else, so the
 * second name is confined to that single string when the decision is made.
 */
export const SITE_NAME = 'PromptMastery';

/** Absolute URL for a site-relative path. */
export function absolute(path) {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Trim a description to a length search engines will actually show, cutting on
 * a word boundary rather than mid-word. Lesson intros are written as prose and
 * run well past what a SERP renders.
 */
export function clampDescription(text, max = 155) {
  const t = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 60 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.\s]+$/, '')}\u2026`;
}

/**
 * ─── THE INDEXABLE SET ───────────────────────────────────────────────────
 * The single source of truth for what search engines may index. Both the
 * sitemap and every route's `robots` metadata read from here, so the two
 * cannot describe different sets — the invariant is structural rather than
 * something a future edit has to remember.
 *
 * Everything not returned by indexableUrls() carries noindex and appears in
 * no sitemap. That is the whole rule.
 */

/**
 * FLIPS TO TRUE ONLY WHEN THE PUBLIC LESSON BODIES ARE IN THE SERVER HTML.
 *
 * It is false today because those bodies still load in a client effect, so
 * the pages are empty to a crawler. Setting this true before the SSR work
 * would invite Google to index three blank pages and point a sitemap at them
 * — worse than the sparse single page this started as, and the exact thing
 * the noindex commit exists to prevent.
 *
 * Do not flip it because the routes render. Flip it when view-source contains
 * the lesson prose.
 */
export const PUBLIC_LESSONS_INDEXABLE = false;

/** Every URL that may be indexed, right now. Truthful at every commit. */
export function indexableUrls() {
  const urls = ['/'];
  if (PUBLIC_LESSONS_INDEXABLE) {
    for (const p of publicLessons()) urls.push(lessonHref(p.mi, p.li));
  }
  return urls;
}

/** Whether a site-relative path may be indexed. */
export function isIndexable(path) {
  return indexableUrls().includes(path);
}
