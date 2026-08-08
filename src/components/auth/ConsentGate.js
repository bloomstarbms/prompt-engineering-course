'use client';
import { useState } from 'react';
import { T } from '@/lib/theme';

/**
 * One-time acceptance for accounts that predate the Terms and Privacy Policy.
 *
 * Shown after sign-in when consented_at IS NULL — which is exactly the 814
 * accounts created before those documents existed, plus anything migrated from
 * a legacy localStorage account. NULL means never asked, not refused.
 *
 * DORMANT UNTIL DOCS_PUBLISHED. The caller gates on that flag. Asking someone
 * to accept documents that still read "[TODO — your name]" would record
 * consent to nothing, and it is a one-shot prompt: whoever sees the
 * placeholder version is never asked again. consented_at IS NULL identifies
 * the same people whenever it runs, so there is no cost to waiting.
 *
 * Deliberately NOT dismissable, and deliberately escapable. There is no close
 * button, because a prompt that can be waved away records nothing. But Sign
 * out is always available: someone who does not accept must be able to leave
 * rather than be trapped in a modal. Both documents open in a new tab, so
 * reading them does not dismiss this.
 */
export default function ConsentGate({ userName, onAccept, onSignOut }) {
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!checked) {
      setError('Please tick the box to continue.');
      return;
    }
    setError('');
    setBusy(true);
    const result = await onAccept();
    setBusy(false);
    if (!result?.ok) setError(result?.error || 'Could not record your acceptance. Please try again.');
  }

  const link = {
    color: T.accent, textDecoration: 'underline', textUnderlineOffset: 2,
  };

  return (
    <div
      style={{
        minHeight: '100dvh', background: T.bg, display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: 24,
        fontFamily: T.font,
      }}
    >
      <div
        style={{
          width: '100%', maxWidth: 520, background: T.bg1,
          border: `1px solid ${T.border}`, borderRadius: 16, padding: '30px 28px',
          boxShadow: T.shadowSm,
        }}
      >
        <div style={{ fontFamily: T.mono, fontSize: 10.5, color: T.dim, letterSpacing: '0.1em', marginBottom: 12 }}>
          ONE-TIME NOTICE
        </div>

        <h1
          style={{
            fontFamily: T.display, fontWeight: 700, color: T.text,
            fontSize: 22, letterSpacing: '-0.02em', margin: '0 0 12px', lineHeight: 1.25,
          }}
        >
          {userName ? `${userName}, we've published our terms` : "We've published our terms"}
        </h1>

        <p style={{ color: T.muted, fontSize: 14.5, lineHeight: 1.7, margin: '0 0 18px' }}>
          Your account was created before this site had a written Privacy Policy and Terms of
          Use. They are now published, and they describe what we collect and why — nothing
          about your account or your progress has changed. Please have a look and confirm.
        </p>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 16 }}>
          <input
            type="checkbox"
            checked={checked}
            onChange={e => { setChecked(e.target.checked); setError(''); }}
            style={{ marginTop: 3, width: 15, height: 15, accentColor: T.accent, cursor: 'pointer', flexShrink: 0 }}
          />
          <span style={{ fontSize: 13, color: T.muted, lineHeight: 1.6 }}>
            I am 18 or older and I accept the{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer" style={link}>Terms of Use</a>
            {' '}and{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" style={link}>Privacy Policy</a>.
          </span>
        </label>

        {error && (
          <div
            /* Same treatment as AuthPage's ErrorBox. T.danger does not exist —
               the token is T.error — and using it built cleanly while rendering
               `undefined14` as a colour, i.e. an invisible error message that
               only appears when something has already gone wrong. */
            style={{
              background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.22)',
              color: T.error, borderRadius: 9, padding: '10px 14px',
              fontSize: 13, lineHeight: 1.5, marginBottom: 14,
            }}
          >
            {error}
          </div>
        )}

        <button
          onClick={submit}
          disabled={busy}
          style={{
            width: '100%', background: busy ? T.bg3 : T.accent, border: 'none',
            color: busy ? T.dim : '#fff', cursor: busy ? 'default' : 'pointer',
            padding: '12px 20px', borderRadius: 9, fontSize: 14, fontWeight: 700,
            fontFamily: T.font, transition: 'all 0.15s',
          }}
        >
          {busy ? 'Saving…' : 'Continue'}
        </button>

        <button
          onClick={onSignOut}
          style={{
            width: '100%', background: 'none', border: 'none', marginTop: 12,
            color: T.dim, cursor: 'pointer', fontSize: 12.5, fontFamily: T.font,
          }}
        >
          Sign out instead
        </button>
      </div>
    </div>
  );
}
