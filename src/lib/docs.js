/**
 * ─── ARE THE DOCUMENT PAGES PUBLISHED? ───────────────────────────────────
 *
 * /about, /privacy and /terms are written and deployed, but they still carry
 * value placeholders — [DATE], the controller name, the Supabase region, the
 * retention period, the contact addresses. Until those are filled they are
 * built and reachable by direct URL for review, and nothing else.
 *
 * A privacy policy reading "[TODO — your name]" damages trust more than having
 * no policy at all, and an incomplete notice is arguably worse than a missing
 * one legally. So this is not a soft launch — it is not a launch.
 *
 * ONE FLAG GOVERNS THREE SURFACES, deliberately, because holding only one of
 * them would be worse than holding none:
 *
 *   1. indexableUrls()  — out of the sitemap and marked noindex.
 *   2. The homepage footer links — hidden, so nothing points a reader at them.
 *   3. The registration checkbox — reduced to the age confirmation alone.
 *      A checkbox reading "I accept the Terms and Privacy Policy" while those
 *      documents say [TODO] asks people to agree to a placeholder. The 18+
 *      confirmation still stands on its own and is still required.
 *
 * TO PUBLISH: fill the placeholders in src/content/legal.js and
 * src/content/about.js, stand up the privacy@ address so section 8 is
 * actionable, then set this true. All three surfaces move together.
 */
export const DOCS_PUBLISHED = false;

/** The document pages, in footer order. Single source for links and sitemap. */
export const DOC_PAGES = [
  { href: '/about', label: 'About' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
];
