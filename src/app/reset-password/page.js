'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { T } from '@/lib/theme';

/* ── Eye icons ── */
const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

function PasswordField({ label, value, onChange, placeholder }) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label style={{
        display: 'block', fontFamily: T.mono, fontSize: 10,
        color: T.muted, letterSpacing: '0.1em', marginBottom: 6, textTransform: 'uppercase',
      }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required
          style={{
            width: '100%', background: T.bg1, border: `1.5px solid ${T.border}`,
            borderRadius: 8, padding: '11px 42px 11px 14px',
            color: T.text, fontSize: 14, fontFamily: T.font,
            outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box',
          }}
          onFocus={e => { e.target.style.borderColor = T.accent; e.target.style.boxShadow = `0 0 0 3px ${T.accentLight}`; }}
          onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = 'none'; }}
        />
        <button
          type="button" tabIndex={-1}
          onClick={() => setVisible(v => !v)}
          style={{
            position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: visible ? T.accent : T.dim, padding: 4,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'color 0.15s', lineHeight: 0,
          }}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [done,      setDone]      = useState(false);
  const [sessionOk, setSessionOk] = useState(false);

  /* Supabase appends the recovery tokens to the URL hash when the user
     clicks the reset link. onAuthStateChange fires a PASSWORD_RECOVERY
     event which sets a temporary session — after that updateUser() works. */
  useEffect(() => {
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionOk(true);
      }
    });
    /* Also check if we already have a valid recovery session on mount */
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionOk(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm)  { setError('Passwords do not match.');               return; }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setDone(true);
  }

  return (
    <div style={{
      minHeight: '100vh', background: T.bg1,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px 20px',
    }}>
      {/* Brand */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: T.accentLight, border: `1px solid ${T.accentBorder}`,
          borderRadius: 100, padding: '5px 14px', marginBottom: 20,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.accent, display: 'block' }} />
          <span style={{ fontFamily: T.mono, fontSize: 11, color: T.accent, letterSpacing: '0.1em' }}>
            PROMPT ENGINEERING
          </span>
        </div>
        <h1 style={{
          fontFamily: "'Inter', sans-serif", fontWeight: 700,
          fontSize: 'clamp(24px,5vw,30px)', letterSpacing: '-0.04em',
          color: T.text, lineHeight: 1.1, marginBottom: 6,
        }}>
          Set a new password
        </h1>
      </div>

      {/* Card */}
      <div style={{
        background: T.bg, border: `1px solid ${T.border}`,
        borderRadius: 16, padding: 'clamp(28px,5vw,36px)',
        width: '100%', maxWidth: 420,
        boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
      }}>
        {done ? (
          /* ── SUCCESS ── */
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%', margin: '0 auto 16px',
              background: 'rgba(52,211,153,0.1)', border: '1.5px solid rgba(52,211,153,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, color: '#34d399',
            }}>✓</div>
            <div style={{ fontFamily: T.font, fontWeight: 700, fontSize: 16, color: T.text, marginBottom: 8 }}>
              Password updated!
            </div>
            <p style={{ fontFamily: T.font, fontSize: 13, color: T.muted, lineHeight: 1.6, marginBottom: 20 }}>
              Your password has been changed. You can now log in with your new password.
            </p>
            <a href="/" style={{
              display: 'block', background: T.accent, border: 'none', color: '#fff',
              borderRadius: 10, padding: '12px', cursor: 'pointer',
              fontFamily: T.font, fontWeight: 700, fontSize: 14,
              textDecoration: 'none', textAlign: 'center',
            }}>
              Go to Course →
            </a>
          </div>

        ) : !sessionOk ? (
          /* ── NO VALID SESSION (user landed here without clicking the link) ── */
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%', margin: '0 auto 16px',
              background: 'rgba(220,38,38,0.08)', border: '1.5px solid rgba(220,38,38,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24,
            }}>🔗</div>
            <div style={{ fontFamily: T.font, fontWeight: 700, fontSize: 16, color: T.text, marginBottom: 8 }}>
              Invalid or expired link
            </div>
            <p style={{ fontFamily: T.font, fontSize: 13, color: T.muted, lineHeight: 1.6, marginBottom: 20 }}>
              This password reset link is no longer valid. Please request a new one from the login page.
            </p>
            <a href="/" style={{
              display: 'block', background: T.accent, border: 'none', color: '#fff',
              borderRadius: 10, padding: '12px', cursor: 'pointer',
              fontFamily: T.font, fontWeight: 700, fontSize: 14,
              textDecoration: 'none', textAlign: 'center',
            }}>
              ← Back to Log In
            </a>
          </div>

        ) : (
          /* ── RESET FORM ── */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <PasswordField
              label="New Password"
              value={password}
              onChange={setPassword}
              placeholder="At least 6 characters"
            />
            <PasswordField
              label="Confirm New Password"
              value={confirm}
              onChange={setConfirm}
              placeholder="Repeat new password"
            />

            {error && (
              <div style={{
                background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)',
                borderRadius: 8, padding: '10px 14px',
                fontFamily: T.font, fontSize: 13, color: T.error, lineHeight: 1.5,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 4,
                background: loading ? T.bg3 : T.accent, border: 'none',
                color: loading ? T.dim : '#fff',
                padding: '13px', borderRadius: 10,
                cursor: loading ? 'default' : 'pointer',
                fontFamily: T.font, fontWeight: 700, fontSize: 15,
                letterSpacing: '-0.01em', transition: 'all 0.15s',
                boxShadow: loading ? 'none' : '0 4px 14px rgba(99,102,241,0.40)',
              }}
            >
              {loading ? 'Updating…' : 'Set New Password →'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
