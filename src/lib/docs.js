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
 * ─── HOW WE ASK THE 763 PRE-DOCUMENT ACCOUNTS TO ACCEPT ──────────────────
 *
 * ONE VARIABLE, THREE VALUES — not two booleans. Two booleans can both be
 * true; a single variable cannot hold two values at once. That is the whole
 * reason this is a string rather than the pair of flags it started as. There
 * is no edit, no merge and no misreading that can put a blocking modal and a
 * dismissible banner on screen together, because there is nowhere to write it
 * down. The build also asserts it — see scripts/check-course-integrity.mjs.
 *
 *   'off'       Nobody is asked. consented_at stays NULL for anyone who
 *               predates the documents. This is the resting state and it
 *               costs nothing: consented_at IS NULL identifies the same
 *               population whenever it runs, so there is no deadline.
 *
 *   'notice'    A dismissible banner. Non-blocking: the site stays fully
 *               usable, navigation is not gated, focus is not trapped.
 *               Accept writes consented_at through /api/consent. Dismiss
 *               writes NOTHING to the database. THIS IS THE INTENDED MODE.
 *
 *   'blocking'  The full-screen ConsentGate. Built, tested, and deliberately
 *               kept — but not shipped. See below.
 *
 * WHY NOT BLOCKING. The lawful basis for running the course is contract, not
 * consent: nobody has to grant permission for the service they signed up for.
 * What the prompt buys is *evidence* of terms acceptance from the accounts
 * that predate the documents. Evidence is worth having. It is not worth a
 * blocking screen on a free course, and it is not worth every one of 763
 * people being locked out simultaneously if /api/consent misbehaves.
 *
 * The blocking gate stays in the tree because the legal advice could change
 * and rebuilding a tested screen from a git history is worse than keeping it.
 */
export const CONSENT_MODE = 'off';   // 'off' | 'notice' | 'blocking'

/** Derived, never assigned. Mutually exclusive by construction. */
export const CONSENT_PROMPT_ENABLED = CONSENT_MODE === 'blocking';
export const CONSENT_NOTICE_ENABLED = CONSENT_MODE === 'notice';

/** The document pages, in footer order. Single source for links and sitemap. */
export const DOC_PAGES = [
  { href: '/about', label: 'About' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
];
