'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuthCtx } from '@/providers/AuthProvider';
import { CONSENT_NOTICE_ENABLED } from '@/lib/docs';
import { T } from '@/lib/theme';

/**
 * ─── THE DISMISSIBLE TERMS NOTICE ────────────────────────────────────────
 *
 * Shown once to a signed-in user whose consented_at is NULL — the accounts
 * that predate the Privacy Policy and Terms existing.
 *
 * WHY DISMISSIBLE RATHER THAN BLOCKING. The lawful basis for running the
 * course is contract, not consent. Nobody needs to grant permission for the
 * service they signed up for. What this buys is *evidence* of acceptance,
 * which is worth having but is not worth blocking a free course over — and
 * not worth 814 people being locked out at once if /api/consent misbehaves.
 * The blocking version still exists as ConsentGate; see CONSENT_MODE.
 *
 * ─── THE ONE INVARIANT ───────────────────────────────────────────────────
 *
 *   consented_at RECORDS A DELIBERATE ACCEPTANCE AND NOTHING ELSE.
 *
 * Not a dismissal. Not a timeout. Not "they kept using the site." The column
 * is evidence, and evidence that records something weaker than its name
 * claims is worse than no column at all, because it will be read as the
 * stronger thing. Exactly one function in this file calls the API, and it is
 * the one wired to the Accept button. `dismiss()` touches localStorage and
 * returns. There is no timer, no unmount handler and no navigation hook that
 * could write on the way past.
 *
 * ─── localStorage IS A CONVENIENCE SIGNAL, NOT A RECORD ──────────────────
 *
 * It suppresses re-display in one browser after a dismissal, so an ignored
 * banner does not nag on every page load. It is NEVER consulted to decide
 * whether someone has accepted — that question has exactly one answer and it
 * lives in the database. The consequence is deliberate and correct: dismiss
 * here, open the site on your phone, and the notice appears again, because
 * you still have not accepted. Clearing site data has the same effect.
 *
 * The key is per-user, so signing in as somebody else on a shared browser
 * does not silently inherit a dismissal that was not theirs.
 *
 * ─── NON-BLOCKING MEANS NON-BLOCKING ─────────────────────────────────────
 *
 * No backdrop, no inset:0 overlay, no focus trap, no scroll lock, no
 * autoFocus, no route guard. It is a fixed strip along the bottom that
 * covers nothing but its own footprint, and every control outside it stays
 * clickable. A user who ignores it entirely keeps the whole site.
 * role="status" rather than role="dialog" for the same reason: it announces,
 * it does not demand.
 */

/** Per-user, and namespaced so it is obvious where it came from in devtools. */
function storageKey(userId) {
  return `prompten.termsNotice.dismissed.${userId}`;
}

export default function ConsentNotice() {
  const { user, userId, ready, acceptTerms } = useAuthCtx();

  // `null` means "not yet read" — distinct from false. The first render on the
  // server, and the first client render before hydration, must not decide
  // anything from localStorage, or the markup mismatches and React complains.
  const [dismissed, setDismissed] = useState(null);
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;
    try {
      setDismissed(window.localStorage.getItem(storageKey(userId)) === '1');
    } catch {
      // Private mode, blocked storage, quota — a browser that cannot remember
      // the dismissal shows the notice again. Annoying, never wrong.
      setDismissed(false);
    }
  }, [userId]);

  /* DISMISS — WRITES NOTHING TO THE DATABASE. No fetch, no API call, no
     side effect beyond this one localStorage key. If you are ever tempted to
     "also record that they saw it", record it somewhere that is not
     consented_at. */
  const dismiss = useCallback(() => {
    setDismissed(true);
    if (!userId) return;
    try { window.localStorage.setItem(storageKey(userId), '1'); } catch { /* see above */ }
  }, [userId]);

  /* ACCEPT — the only path that writes. acceptTerms() POSTs to /api/consent
     with the session's access token; the server verifies the token, stamps
     its own clock and writes with the service role under an
     `is('consented_at', null)` predicate, so the first write wins. The client
     cannot write the column directly: the migration 007 trigger raises 42501
     on any user-role attempt, verified against production. */
  const accept = useCallback(async () => {
    setBusy(true);
    setError('');
    const res = await acceptTerms();
    setBusy(false);
    if (!res?.ok) {
      // Stay on screen and let them retry. Do NOT dismiss on failure — a
      // silent disappearance would read as success.
      setError(res?.error || 'Could not record your acceptance. Please try again.');
      return;
    }
    // No localStorage write here on purpose. The user object now carries a
    // consentedAt, so the visibility test below is false everywhere, in every
    // browser, forever. The database is the source of truth; writing a local
    // flag as well would create a second answer to a settled question.
  }, [acceptTerms]);

  if (!CONSENT_NOTICE_ENABLED) return null;
  if (!ready || !user || !userId) return null;
  if (user.consentedAt != null) return null;   // already accepted — the DB says so
  if (dismissed !== false) return null;        // null = not yet read; true = dismissed here

  const link = { color: T.accent, textDecoration: 'underline', textUnderlineOffset: 2 };

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 60,
        display: 'flex', justifyContent: 'center',
        padding: '0 12px 12px',
        // The strip sits at the bottom and nothing else is covered. No
        // backdrop element exists, so there is no full-screen layer to
        // swallow clicks even by accident.
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          pointerEvents: 'auto',
          width: '100%', maxWidth: 720,
          background: T.bg1, border: `1px solid ${T.border}`,
          borderRadius: 12, boxShadow: T.shadowSm,
          padding: '14px 16px',
          fontFamily: T.font,
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12,
        }}
      >
        <div style={{ flex: '1 1 300px', minWidth: 0 }}>
          <div style={{ fontSize: 13.5, color: T.text, fontWeight: 600, marginBottom: 3 }}>
            We&apos;ve published our Terms and Privacy Policy
          </div>
          <div style={{ fontSize: 12.5, color: T.muted, lineHeight: 1.6 }}>
            Your account predates them. Continued use of the course is subject to the{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer" style={link}>Terms of Use</a>
            {' '}and{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" style={link}>Privacy Policy</a>.
          </div>

          {error && (
            <div style={{ marginTop: 8, fontSize: 12, color: T.error, lineHeight: 1.5 }}>
              {error}
            </div>
          )}

          {/* ERASURE ROUTE — kept, but NO LONGER LOAD-BEARING.
              In the blocking ConsentGate this line was structurally required:
              that screen was the only reachable surface, so without a contact
              address the choices were "accept" or "leave and stay in the
              database", which makes consent a condition of deletion and falls
              foul of the NDPA. Here the user can reach /privacy, the footer
              and every other route freely, so the legal weight is carried
              elsewhere. It stays because it is cheap and useful — but do not
              read its presence here as the same obligation. If this component
              ever becomes blocking, the obligation returns. */}
          <div style={{ marginTop: 8, fontSize: 11.5, color: T.dim, lineHeight: 1.5 }}>
            Want your account and data deleted instead? Email{' '}
            <a href="mailto:privacy@prompten.xyz?subject=Account%20deletion%20request" style={link}>
              privacy@prompten.xyz
            </a>. You do not have to accept these terms to do that.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button
            onClick={dismiss}
            aria-label="Dismiss this notice"
            style={{
              background: 'none', border: `1px solid ${T.border}`, color: T.dim,
              padding: '8px 14px', borderRadius: 8, fontSize: 12.5,
              fontFamily: T.font, cursor: 'pointer',
            }}
          >
            Later
          </button>
          <button
            onClick={accept}
            disabled={busy}
            style={{
              background: busy ? T.bg3 : T.accent, border: 'none',
              color: busy ? T.dim : '#fff',
              padding: '8px 16px', borderRadius: 8, fontSize: 12.5, fontWeight: 700,
              fontFamily: T.font, cursor: busy ? 'default' : 'pointer',
            }}
          >
            {busy ? 'Saving…' : 'I accept'}
          </button>
        </div>
      </div>
    </div>
  );
}
