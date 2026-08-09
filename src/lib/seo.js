import { publicLessons, lessonHref } from '@/lib/courseRoutes';
import { DOCS_PUBLISHED, DOC_PAGES } from '@/lib/docs';

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
 * RESOLVED. This used to record that the default page title said "Prompt
 * Engineering — Zero to Mastery" — an established brand (zerotomastery.io)
 * with no relationship to this site — and that renaming was a brand decision
 * rather than an SEO one. The decision was taken: that name is gone from every
 * surface, including the certificate, the LinkedIn credential and the /verify
 * page. PromptMastery is the site name; "Prompt Engineering" is the course
 * name on credential surfaces; "Prompten" is the issuer.
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
 * TRUE ONLY BECAUSE THE PUBLIC LESSON BODIES ARE NOW IN THE SERVER HTML.
 *
 * Verified against the deployment, not the build, before this was flipped:
 *
 *   3 public lessons   6838 / 4884 / 5402 chars of visible text over the wire,
 *                      authored prose present, and 6613 chars still rendered
 *                      with scripts blocked in a sandboxed frame
 *   23 gated lessons   489 chars each — the same number measured before any of
 *                      this work began, so no gated body reached a payload
 *
 * If this is ever set true again after a change to how bodies load, re-run
 * that check first. The failure it guards against is silent: three empty pages
 * in the index, invited by a sitemap, visible in no application test.
 */
export const PUBLIC_LESSONS_INDEXABLE = true;

/** Every URL that may be indexed, right now. Truthful at every commit. */
export function indexableUrls() {
  // The document pages are public content — GAID requires the privacy notice
  // to be reachable — but only once they say something. While they still hold
  // value placeholders they are neither indexed nor listed. See lib/docs.js.
  const urls = ['/'];
  if (DOCS_PUBLISHED) urls.push(...DOC_PAGES.map(d => d.href));
  if (PUBLIC_LESSONS_INDEXABLE) {
    for (const p of publicLessons()) urls.push(lessonHref(p.mi, p.li));
  }
  return urls;
}

/** Whether a site-relative path may be indexed. */
export function isIndexable(path) {
  return indexableUrls().includes(path);
}
