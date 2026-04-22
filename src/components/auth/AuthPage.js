'use client';
import { useState } from 'react';
import { T } from '@/lib/theme';
import { getUser, resetPasswordByEmail } from '@/lib/auth';

export default function AuthPage({ onAuth }) {
  const [mode, setMode]       = useState('login'); // 'login' | 'register' | 'forgot'
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  /* ── Forgot-password state ── */
  const [forgotStep,   setForgotStep]   = useState('email');  // 'email' | 'reset' | 'done'
  const [forgotEmail,  setForgotEmail]  = useState('');
  const [forgotNewPw,  setForgotNewPw]  = useState('');
  const [forgotConfPw, setForgotConfPw] = useState('');
  const [forgotError,  setForgotError]  = useState('');

  function enterForgot() {
    setMode('forgot');
    setForgotStep('email');
    setForgotEmail('');
    setForgotNewPw('');
    setForgotConfPw('');
    setForgotError('');
  }

  function handleForgotLookup(e) {
    e.preventDefault();
    setForgotError('');
    const found = getUser(forgotEmail.trim());
    if (!found) {
      setForgotError('No account found with this email on this device. Passwords are stored in your browser — you must use the same device and browser where you registered.');
      return;
    }
    setForgotStep('reset');
  }

  function handleForgotReset(e) {
    e.preventDefault();
    setForgotError('');
    if (forgotNewPw.length < 6)  { setForgotError('Password must be at least 6 characters.'); return; }
    if (forgotNewPw !== forgotConfPw) { setForgotError('Passwords do not match.'); return; }
    const result = resetPasswordByEmail(forgotEmail.trim(), forgotNewPw);
    if (result.ok) { setForgotStep('done'); }
    else           { setForgotError(result.error); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    // Small delay for UX feel
    await new Promise(r => setTimeout(r, 300));
    const result = onAuth(mode, name, email, password);
    if (!result.ok) setError(result.error);
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

        {/* ── Forgot-password panel ── */}
        {mode === 'forgot' ? (
          <div>
            {/* Back link */}
            <button onClick={() => { setMode('login'); setError(''); }} style={{
              background: 'none', border: 'none', color: T.dim, cursor: 'pointer',
              fontFamily: T.font, fontSize: 13, padding: 0, marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>← Back to Log In</button>

            {forgotStep === 'done' ? (
              /* Success */
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%', margin: '0 auto 16px',
                  background: 'rgba(52,211,153,0.1)', border: '1.5px solid rgba(52,211,153,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, color: T.success,
                }}>✓</div>
                <div style={{ fontFamily: T.font, fontWeight: 700, fontSize: 16, color: T.text, marginBottom: 8 }}>
                  Password reset!
                </div>
                <p style={{ fontFamily: T.font, fontSize: 13, color: T.muted, marginBottom: 20 }}>
                  Your password has been updated. You can now log in with your new password.
                </p>
                <button onClick={() => { setMode('login'); setError(''); }} style={{
                  width: '100%', background: T.accent, border: 'none', color: '#fff',
                  borderRadius: 10, padding: '12px', cursor: 'pointer',
                  fontFamily: T.font, fontWeight: 700, fontSize: 14,
                }}>
                  Go to Log In →
                </button>
              </div>
            ) : forgotStep === 'email' ? (
              /* Step 1 — find account */
              <div>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontFamily: T.font, fontWeight: 700, fontSize: 17, color: T.text, marginBottom: 6 }}>
                    Reset your password
                  </div>
                  <p style={{ fontFamily: T.font, fontSize: 13, color: T.muted, lineHeight: 1.6 }}>
                    Enter the email you registered with. Because your account is stored in this browser, you must be on the same device and browser you used to sign up.
                  </p>
                </div>
                <form onSubmit={handleForgotLookup} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <Field
                    label="Registered Email"
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
                  <button type="submit" style={{
                    background: T.accent, border: 'none', color: '#fff',
                    padding: '12px', borderRadius: 10, cursor: 'pointer',
                    fontFamily: T.font, fontWeight: 700, fontSize: 14, transition: 'all 0.15s',
                    boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                  }}>
                    Find My Account →
                  </button>
                </form>
              </div>
            ) : (
              /* Step 2 — set new password */
              <div>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontFamily: T.font, fontWeight: 700, fontSize: 17, color: T.text, marginBottom: 4 }}>
                    Set a new password
                  </div>
                  <div style={{ fontFamily: T.mono, fontSize: 10, color: T.accent }}>{forgotEmail}</div>
                </div>
                <form onSubmit={handleForgotReset} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <Field
                    label="New Password"
                    type="password" value={forgotNewPw}
                    placeholder="At least 6 characters"
                    onChange={e => { setForgotNewPw(e.target.value); setForgotError(''); }}
                  />
                  <Field
                    label="Confirm New Password"
                    type="password" value={forgotConfPw}
                    placeholder="Repeat new password"
                    onChange={e => { setForgotConfPw(e.target.value); setForgotError(''); }}
                  />
                  {forgotError && (
                    <div style={{
                      background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)',
                      borderRadius: 8, padding: '10px 14px',
                      fontFamily: T.font, fontSize: 13, color: T.error, lineHeight: 1.5,
                    }}>{forgotError}</div>
                  )}
                  <button type="submit" style={{
                    background: T.accent, border: 'none', color: '#fff',
                    padding: '12px', borderRadius: 10, cursor: 'pointer',
                    fontFamily: T.font, fontWeight: 700, fontSize: 14, transition: 'all 0.15s',
                    boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                  }}>
                    Reset Password →
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
        Your progress is saved securely in your browser. Free forever.
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
