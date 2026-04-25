'use client';
import { useState } from 'react';
import { T } from '@/lib/theme';
import { supabase } from '@/lib/supabase';

export default function AuthPage({ onAuth }) {
  const [mode, setMode]         = useState('login'); // 'login' | 'register' | 'forgot' | 'confirm'
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  /* ── Forgot-password state ── */
  const [forgotEmail,   setForgotEmail]   = useState('');
  const [forgotError,   setForgotError]   = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent,    setForgotSent]    = useState(false);

  function enterForgot() {
    setMode('forgot');
    setForgotEmail('');
    setForgotError('');
    setForgotSent(false);
  }

  async function handleForgotSubmit(e) {
    e.preventDefault();
    setForgotError('');
    if (!forgotEmail.trim()) { setForgotError('Please enter your email address.'); return; }
    setForgotLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setForgotLoading(false);
    if (error) { setForgotError(error.message); return; }
    setForgotSent(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 300));
    const result = await onAuth(mode, name, email, password);
    if (result.needsConfirm) {
      setMode('confirm');
    } else if (!result.ok) {
      setError(result.error);
    }
    setLoading(false);
  }

  return (
    <div style={{
      minHeight: '100vh', background: T.bg1,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '24px 20px',
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
          fontFamily: T.display, fontWeight: 700,
          fontSize: 'clamp(26px,5vw,34px)', letterSpacing: '-0.04em',
          color: T.text, lineHeight: 1.1, marginBottom: 6,
        }}>
          Zero to Mastery
        </h1>
        <p style={{ fontFamily: T.font, fontSize: 14, color: T.muted, lineHeight: 1.6 }}>
          {mode === 'login'
            ? 'Welcome back. Continue where you left off.'
            : 'Create your account to track progress and earn a certificate.'}
        </p>
      </div>

      {/* Card */}
      <div style={{
        background: T.bg, border: `1px solid ${T.border}`,
        borderRadius: 16, padding: 'clamp(28px,5vw,36px)',
        width: '100%', maxWidth: 420,
        boxShadow: T.shadowLg,
      }}>

        {/* ── Email confirmation screen (after register with unverified email) ── */}
        {mode === 'confirm' ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%', margin: '0 auto 16px',
              background: 'rgba(129,140,248,0.1)', border: `1.5px solid ${T.accentBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24,
            }}>📧</div>
            <div style={{ fontFamily: T.font, fontWeight: 700, fontSize: 16, color: T.text, marginBottom: 8 }}>
              Check your email
            </div>
            <p style={{ fontFamily: T.font, fontSize: 13, color: T.muted, lineHeight: 1.6, marginBottom: 20 }}>
              We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then come back here to log in.
            </p>
            <button onClick={() => { setMode('login'); setError(''); }} style={{
              width: '100%', background: T.accent, border: 'none', color: '#fff',
              borderRadius: 10, padding: '12px', cursor: 'pointer',
              fontFamily: T.font, fontWeight: 700, fontSize: 14,
            }}>
              Go to Log In →
            </button>
          </div>

        ) : mode === 'forgot' ? (
          /* ── Forgot-password panel ── */
          <div>
            <button onClick={() => { setMode('login'); setError(''); }} style={{
              background: 'none', border: 'none', color: T.dim, cursor: 'pointer',
              fontFamily: T.font, fontSize: 13, padding: 0, marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>← Back to Log In</button>

            {forgotSent ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%', margin: '0 auto 16px',
                  background: 'rgba(52,211,153,0.1)', border: '1.5px solid rgba(52,211,153,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, color: T.success,
                }}>✓</div>
                <div style={{ fontFamily: T.font, fontWeight: 700, fontSize: 16, color: T.text, marginBottom: 8 }}>
                  Reset email sent!
                </div>
                <p style={{ fontFamily: T.font, fontSize: 13, color: T.muted, marginBottom: 20, lineHeight: 1.6 }}>
                  Check your inbox for a password reset link. It expires in 1 hour.
                </p>
                <button onClick={() => { setMode('login'); setError(''); }} style={{
                  width: '100%', background: T.accent, border: 'none', color: '#fff',
                  borderRadius: 10, padding: '12px', cursor: 'pointer',
                  fontFamily: T.font, fontWeight: 700, fontSize: 14,
                }}>
                  Back to Log In →
                </button>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontFamily: T.font, fontWeight: 700, fontSize: 17, color: T.text, marginBottom: 6 }}>
                    Reset your password
                  </div>
                  <p style={{ fontFamily: T.font, fontSize: 13, color: T.muted, lineHeight: 1.6 }}>
                    Enter your email and we'll send you a reset link.
                  </p>
                </div>
                <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <Field
                    label="Email Address"
                    type="email" value={forgotEmail}
                    placeholder="you@example.com"
                    onChange={e => { setForgotEmail(e.target.value); setForgotError(''); }}
                  />
                  {forgotError && (
                    <div style={{
                      background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)',
                      borderRadius: 8, padding: '10px 14px',
                      fontFamily: T.font, fontSize: 13, color: T.error, lineHeight: 1.5,
                    }}>{forgotError}</div>
                  )}
                  <button type="submit" disabled={forgotLoading} style={{
                    background: forgotLoading ? T.bg3 : T.accent, border: 'none',
                    color: forgotLoading ? T.dim : '#fff',
                    padding: '12px', borderRadius: 10,
                    cursor: forgotLoading ? 'default' : 'pointer',
                    fontFamily: T.font, fontWeight: 700, fontSize: 14, transition: 'all 0.15s',
                    boxShadow: forgotLoading ? 'none' : '0 4px 14px rgba(99,102,241,0.35)',
                  }}>
                    {forgotLoading ? 'Sending…' : 'Send Reset Link →'}
                  </button>
                </form>
              </div>
            )}
          </div>

        ) : (
          /* ── Normal login / register panel ── */
          <>
            {/* Toggle */}
            <div style={{
              display: 'flex', background: T.bg2, borderRadius: 10,
              padding: 4, marginBottom: 28,
            }}>
              {['login', 'register'].map(m => (
                <button key={m} onClick={() => { setMode(m); setError(''); }} style={{
                  flex: 1, padding: '9px 0',
                  background: mode === m ? T.bg : 'transparent',
                  border: 'none', borderRadius: 7,
                  fontFamily: T.font, fontWeight: 700, fontSize: 13,
                  color: mode === m ? T.text : T.dim,
                  cursor: 'pointer', transition: 'all 0.15s',
                  boxShadow: mode === m ? T.shadowSm : 'none',
                }}>
                  {m === 'login' ? 'Log In' : 'Register'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {mode === 'register' && (
                <Field
                  label="Full Name"
                  type="text" value={name}
                  placeholder="Your full name"
                  onChange={e => setName(e.target.value)}
                  hint="This appears on your certificate"
                />
              )}
              <Field
                label="Email Address"
                type="email" value={email}
                placeholder="you@example.com"
                onChange={e => setEmail(e.target.value)}
              />
              <Field
                label="Password"
                type="password" value={password}
                placeholder={mode === 'register' ? 'At least 6 characters' : '••••••••'}
                onChange={e => setPassword(e.target.value)}
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

              {/* Forgot password link — login only */}
              {mode === 'login' && (
                <div style={{ textAlign: 'right', marginTop: -6 }}>
                  <button type="button" onClick={enterForgot} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: T.font, fontSize: 12, color: T.dim, padding: 0,
                    transition: 'color 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.color = T.accent}
                    onMouseLeave={e => e.currentTarget.style.color = T.dim}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                marginTop: 4,
                background: loading ? T.bg3 : T.accent, border: 'none', color: loading ? T.dim : '#fff',
                padding: '13px', borderRadius: 10, cursor: loading ? 'default' : 'pointer',
                fontFamily: T.font, fontWeight: 700, fontSize: 15,
                letterSpacing: '-0.01em', transition: 'all 0.15s',
                boxShadow: loading ? 'none' : '0 4px 14px rgba(99,102,241,0.40)',
              }}>
                {loading ? 'Please wait…' : mode === 'login' ? 'Log In →' : 'Create Account →'}
              </button>
            </form>

            {mode === 'login' && (
              <p style={{
                marginTop: 20, textAlign: 'center',
                fontFamily: T.font, fontSize: 13, color: T.dim,
              }}>
                Don't have an account?{' '}
                <button onClick={() => { setMode('register'); setError(''); }} style={{
                  background: 'none', border: 'none', color: T.accent,
                  cursor: 'pointer', fontFamily: T.font, fontSize: 13, fontWeight: 700,
                  padding: 0,
                }}>
                  Register free
                </button>
              </p>
            )}

            {mode === 'register' && (
              <p style={{
                marginTop: 20, textAlign: 'center',
                fontFamily: T.font, fontSize: 13, color: T.dim,
              }}>
                Already have an account?{' '}
                <button onClick={() => { setMode('login'); setError(''); }} style={{
                  background: 'none', border: 'none', color: T.accent,
                  cursor: 'pointer', fontFamily: T.font, fontSize: 13, fontWeight: 700,
                  padding: 0,
                }}>
                  Log in
                </button>
              </p>
            )}
          </>
        )}
      </div>

      {/* Note */}
      <p style={{
        marginTop: 24, fontFamily: T.font, fontSize: 12, color: T.faint,
        textAlign: 'center', maxWidth: 340, lineHeight: 1.6,
      }}>
        Your progress is saved securely in the cloud. Access from any device. Free forever.
      </p>
    </div>
  );
}

/* ── Eye icons for password toggle ─────────────────────────────────── */
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

function Field({ label, type, value, placeholder, onChange, hint }) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';
  const inputType  = isPassword && visible ? 'text' : type;

  return (
    <div>
      <label style={{
        display: 'block', fontFamily: T.mono, fontSize: 10,
        color: T.muted, letterSpacing: '0.1em', marginBottom: 6, textTransform: 'uppercase',
      }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={inputType} value={value} onChange={onChange}
          placeholder={placeholder} required
          style={{
            width: '100%', background: T.bg1, border: `1.5px solid ${T.border}`,
            borderRadius: 8,
            padding: isPassword ? '11px 42px 11px 14px' : '11px 14px',
            color: T.text, fontSize: 14, fontFamily: T.font,
            outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box',
          }}
          onFocus={e => { e.target.style.borderColor = T.accent; e.target.style.boxShadow = `0 0 0 3px ${T.accentLight}`; }}
          onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = 'none'; }}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setVisible(v => !v)}
            style={{
              position: 'absolute', right: 11, top: '50%',
              transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: visible ? T.accent : T.dim, padding: 4,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'color 0.15s', lineHeight: 0,
            }}
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
      {hint && (
        <p style={{ fontFamily: T.font, fontSize: 11, color: T.faint, marginTop: 4 }}>{hint}</p>
      )}
    </div>
  );
}
