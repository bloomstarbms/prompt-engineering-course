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
 * NOW TRUE. Everything the documents depend on is settled and verified:
 *
 *   placeholders   all filled — controller name, dates, retention period,
 *                  Supabase region (eu-west-1, read from the dashboard)
 *   contact        privacy@prompten.xyz and hello@prompten.xyz, both on the
 *                  domain, so they can be redirected later. A personal address
 *                  once published and scraped cannot be taken back.
 *   delivery       CONFIRMED, not assumed. Two test messages sent from a
 *                  separate account, both landed in the destination inbox —
 *                  and in the Inbox rather than Spam. The DNS records
 *                  resolving was NOT treated as sufficient: records existing
 *                  is not mail arriving, and an earlier round of tests sent
 *                  before the forwarding account existed produced exactly the
 *                  silence that a broken route would have.
 *
 * Both addresses were tested, not just one. They share a catch-all so they
 * should behave identically — but "should behave identically" is an argument,
 * and the failure mode here is somebody writing to you and concluding they
 * were ignored.
 */
export const DOCS_PUBLISHED = true;

/**
 * ─── THE ONE-TIME ACCEPTANCE PROMPT, HELD SEPARATELY ─────────────────────
 *
 * Deliberately NOT the same flag as DOCS_PUBLISHED, and this is the whole
 * reason it exists as its own constant.
 *
 * Publishing the documents is invisible to existing users. Switching on the
 * acceptance prompt is not: it puts a blocking screen in front of all 814
 * accounts the next time each one signs in. Those are different sized
 * decisions and they should not be taken by the same edit — least of all by
 * accident, as a side effect of filling in a privacy policy.
 *
 * Set this true when you actually want people prompted. consented_at IS NULL
 * identifies the same population whenever it runs, so there is no deadline and
 * nothing degrades by waiting.
 */
export const CONSENT_PROMPT_ENABLED = false;

/** The document pages, in footer order. Single source for links and sitemap. */
export const DOC_PAGES = [
  { href: '/about', label: 'About' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
];
