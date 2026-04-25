'use client';
import { useState } from 'react';
import { T } from '@/lib/theme';
import { MODULES, TOTAL_LESSONS } from '@/data/courseData';
import { supabase } from '@/lib/supabase';

/* ── Eye icons ── */
const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

function Field({ label, type, value, placeholder, onChange, hint, autoComplete }) {
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
          autoComplete={autoComplete}
          style={{
            width: '100%', background: T.bg1, border: `1.5px solid ${T.border}`,
            borderRadius: 9, padding: isPassword ? '11px 42px 11px 14px' : '11px 14px',
            color: T.text, fontSize: 14, fontFamily: T.font,
            outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box',
          }}
          onFocus={e => { e.target.style.borderColor = T.accent; e.target.style.boxShadow = `0 0 0 3px ${T.accentLight}`; }}
          onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = 'none'; }}
        />
        {isPassword && (
          <button type="button" tabIndex={-1} onClick={() => setVisible(v => !v)}
            style={{
              position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: visible ? T.accent : T.dim, padding: 4, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              transition: 'color 0.15s', lineHeight: 0,
            }}
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
      {hint && <p style={{ fontFamily: T.font, fontSize: 11, color: T.faint, marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

/* ── Left panel feature list ── */
const FEATURES = [
  { icon: '🎬', title: `${TOTAL_LESSONS} video lessons`, desc: 'Watch + read notes side-by-side' },
  { icon: '🧠', title: 'Graded quizzes', desc: 'Every lesson has a knowledge check' },
  { icon: '☁️', title: 'Cloud-synced progress', desc: 'Resume from any device, any time' },
  { icon: '🎓', title: 'Verified certificate', desc: 'Publicly verifiable certificate of completion' },
];

const MOD_COLORS = MODULES.slice(0, 6).map(m => m.color);

export default function AuthPage({ onAuth }) {
  const [mode, setMode]         = useState('login');
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const [forgotEmail,   setForgotEmail]   = useState('');
  const [forgotError,   setForgotError]   = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent,    setForgotSent]    = useState(false);

  function enterForgot() { setMode('forgot'); setForgotEmail(''); setForgotError(''); setForgotSent(false); }

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
    await new Promise(r => setTimeout(r, 280));
    const result = await onAuth(mode, name, email, password);
    if (result.needsConfirm) {
      setMode('confirm');
    } else if (!result.ok) {
      setError(result.error);
    }
    setLoading(false);
  }

  const isConfirm = mode === 'confirm';
  const isForgot  = mode === 'forgot';

  return (
    <div style={{
      minHeight: '100vh', background: T.bg,
      display: 'flex', alignItems: 'stretch',
      fontFamily: T.font,
    }}>

      {/* ── Left panel (hidden on mobile) ─────────────────────── */}
      <div style={{
        flex: '0 0 420px', display: 'none',
        flexDirection: 'column', justifyContent: 'center',
        background: `radial-gradient(ellipse 80% 80% at 20% 50%, rgba(99,102,241,0.12) 0%, transparent 70%), ${T.bg1}`,
        borderRight: `1px solid ${T.border}`,
        padding: '48px 40px',
        ['@media (min-width: 768px)']: { display: 'flex' },
      }} className="auth-left-panel">
        <style>{`
          @media (min-width: 768px) { .auth-left-panel { display: flex !important; } }
          @keyframes authFadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          .auth-feature { animation: authFadeUp 0.4s ease both; }
          .auth-feature:nth-child(1) { animation-delay: 0.05s; }
          .auth-feature:nth-child(2) { animation-delay: 0.10s; }
          .auth-feature:nth-child(3) { animation-delay: 0.15s; }
          .auth-feature:nth-child(4) { animation-delay: 0.20s; }
        `}</style>

        {/* Brand */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: T.accentLight, border: `1px solid ${T.accentBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: T.mono, fontSize: 12, color: T.accent, fontWeight: 700,
            }}>PE</div>
            <span style={{ fontFamily: T.display, fontWeight: 800, fontSize: 17, color: T.text, letterSpacing: '-0.02em' }}>
              PromptMastery
            </span>
          </div>
          <div style={{
            fontFamily: T.display, fontWeight: 700,
            fontSize: 'clamp(24px,3vw,30px)', color: T.text,
            letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 10,
          }}>
            Master the art of<br />
            <span style={{
              background: 'linear-gradient(120deg, #818cf8, #c084fc)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>prompting.</span>
          </div>
          <p style={{ fontFamily: T.font, fontSize: 14, color: T.muted, lineHeight: 1.65, maxWidth: 300, margin: 0 }}>
            A technically rigorous, career-grade curriculum. Free forever.
          </p>
        </div>

        {/* Stats chips */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 36 }}>
          {[
            [`${MODULES.length}`, 'Modules'],
            [String(TOTAL_LESSONS), 'Lessons'],
            ['Free', 'Forever'],
            ['1', 'Certificate'],
          ].map(([n, l]) => (
            <div key={l} style={{
              background: T.bg2, border: `1px solid ${T.border}`,
              borderRadius: 8, padding: '8px 14px', textAlign: 'center',
            }}>
              <div style={{ fontFamily: T.display, fontWeight: 800, fontSize: 18, color: T.text, letterSpacing: '-0.02em', lineHeight: 1 }}>{n}</div>
              <div style={{ fontFamily: T.mono, fontSize: 9, color: T.dim, letterSpacing: '0.07em', marginTop: 3 }}>{l.toUpperCase()}</div>
            </div>
          ))}
        </div>

        {/* Feature list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 40 }}>
          {FEATURES.map((f, i) => (
            <div key={i} className="auth-feature" style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                background: T.bg2, border: `1px solid ${T.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
              }}>{f.icon}</div>
              <div>
                <div style={{ fontFamily: T.font, fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 2 }}>{f.title}</div>
                <div style={{ fontFamily: T.font, fontSize: 12, color: T.muted, lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Module color strip */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {MOD_COLORS.map((c, i) => (
            <div key={i} style={{
              height: 3, flex: 1, borderRadius: 2,
              background: c, opacity: 0.7,
            }} />
          ))}
        </div>
      </div>

      {/* ── Right panel (form) ────────────────────────────────── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(32px,6vw,64px) clamp(20px,5vw,48px)',
        background: T.bg,
        overflowY: 'auto',
      }}>
        {/* Mobile-only brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }} className="mobile-brand">
          <style>{`.mobile-brand { display: block; } @media (min-width: 768px) { .mobile-brand { display: none; } }`}</style>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: T.accentLight, border: `1px solid ${T.accentBorder}`,
            borderRadius: 100, padding: '5px 14px', marginBottom: 16,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.accent, display: 'block' }} />
            <span style={{ fontFamily: T.mono, fontSize: 11, color: T.accent, letterSpacing: '0.1em' }}>
              PROMPT ENGINEERING
            </span>
          </div>
          <h1 style={{
            fontFamily: T.display, fontWeight: 700, fontSize: 28,
            letterSpacing: '-0.04em', color: T.text, lineHeight: 1.1, marginBottom: 6,
          }}>Zero to Mastery</h1>
        </div>

        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Subtitle */}
          <div style={{ marginBottom: 28 }}>
            <h2 style={{
              fontFamily: T.display, fontWeight: 700, fontSize: 22,
              color: T.text, letterSpacing: '-0.03em', lineHeight: 1.2, margin: '0 0 6px',
            }}>
              {mode === 'login'    ? 'Welcome back'
               : mode === 'register' ? 'Create your account'
               : mode === 'forgot'   ? 'Reset your password'
               : 'Check your email'}
            </h2>
            <p style={{ fontFamily: T.font, fontSize: 13, color: T.muted, lineHeight: 1.6, margin: 0 }}>
              {mode === 'login'    ? 'Continue where you left off.'
               : mode === 'register' ? 'Track progress and earn a certificate. Free forever.'
               : mode === 'forgot'   ? "Enter your email and we'll send a reset link."
               : 'A confirmation link is on its way to your inbox.'}
            </p>
          </div>

          {/* ── Form card ── */}
          <div style={{
            background: T.bg1, border: `1px solid ${T.border}`,
            borderRadius: 16, padding: 'clamp(24px,4vw,32px)',
            boxShadow: T.shadowLg,
          }}>

            {/* Email confirm state */}
            {isConfirm ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px',
                  background: 'rgba(129,140,248,0.1)', border: `1.5px solid ${T.accentBorder}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
                }}>📧</div>
                <div style={{ fontFamily: T.font, fontWeight: 700, fontSize: 16, color: T.text, marginBottom: 8 }}>
                  Check your email
                </div>
                <p style={{ fontFamily: T.font, fontSize: 13, color: T.muted, lineHeight: 1.6, marginBottom: 22 }}>
                  We sent a confirmation link to <strong style={{ color: T.text }}>{email}</strong>.
                  Click it to activate your account, then come back to log in.
                </p>
                <button onClick={() => { setMode('login'); setError(''); }} style={{
                  width: '100%', background: T.accent, border: 'none', color: '#fff',
                  borderRadius: 10, padding: '13px', cursor: 'pointer',
                  fontFamily: T.font, fontWeight: 700, fontSize: 14,
                  boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                }}>
                  Go to Log In →
                </button>
              </div>

            ) : isForgot ? (
              /* Forgot password panel */
              <div>
                <button onClick={() => { setMode('login'); setError(''); }} style={{
                  background: 'none', border: 'none', color: T.dim, cursor: 'pointer',
                  fontFamily: T.font, fontSize: 13, padding: 0, marginBottom: 20,
                  display: 'flex', alignItems: 'center', gap: 5, transition: 'color 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.color = T.text}
                  onMouseLeave={e => e.currentTarget.style.color = T.dim}
                >← Back to Log In</button>

                {forgotSent ? (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px',
                      background: 'rgba(52,211,153,0.1)', border: '1.5px solid rgba(52,211,153,0.35)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22, color: T.success,
                    }}>✓</div>
                    <div style={{ fontFamily: T.font, fontWeight: 700, fontSize: 16, color: T.text, marginBottom: 8 }}>
                      Reset link sent!
                    </div>
                    <p style={{ fontFamily: T.font, fontSize: 13, color: T.muted, marginBottom: 22, lineHeight: 1.6 }}>
                      Check your inbox. The link expires in 1 hour.
                    </p>
                    <button onClick={() => { setMode('login'); setError(''); }} style={{
                      width: '100%', background: T.accent, border: 'none', color: '#fff',
                      borderRadius: 10, padding: '13px', cursor: 'pointer',
                      fontFamily: T.font, fontWeight: 700, fontSize: 14,
                      boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                    }}>
                      Back to Log In →
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <Field label="Email Address" type="email" value={forgotEmail}
                      placeholder="you@example.com" autoComplete="email"
                      onChange={e => { setForgotEmail(e.target.value); setForgotError(''); }} />
                    {forgotError && <ErrorBox>{forgotError}</ErrorBox>}
                    <SubmitBtn loading={forgotLoading}>
                      {forgotLoading ? 'Sending…' : 'Send Reset Link →'}
                    </SubmitBtn>
                  </form>
                )}
              </div>

            ) : (
              /* Login / Register panel */
              <>
                {/* Toggle */}
                <div style={{
                  display: 'flex', background: T.bg2, borderRadius: 10, padding: 4, marginBottom: 26,
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
                    <Field label="Full Name" type="text" value={name}
                      placeholder="Your full name" autoComplete="name"
                      onChange={e => setName(e.target.value)}
                      hint="This name appears on your certificate" />
                  )}
                  <Field label="Email Address" type="email" value={email}
                    placeholder="you@example.com" autoComplete="email"
                    onChange={e => setEmail(e.target.value)} />
                  <Field label="Password" type="password" value={password}
                    placeholder={mode === 'register' ? 'At least 6 characters' : '••••••••'}
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    onChange={e => setPassword(e.target.value)} />

                  {error && <ErrorBox>{error}</ErrorBox>}

                  {mode === 'login' && (
                    <div style={{ textAlign: 'right', marginTop: -6 }}>
                      <button type="button" onClick={enterForgot} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontFamily: T.font, fontSize: 12, color: T.dim, padding: 0,
                        transition: 'color 0.15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.color = T.accent}
                        onMouseLeave={e => e.currentTarget.style.color = T.dim}
                      >Forgot password?</button>
                    </div>
                  )}

                  <SubmitBtn loading={loading}>
                    {loading ? 'Please wait…' : mode === 'login' ? 'Log In →' : 'Create Account →'}
                  </SubmitBtn>
                </form>

                <p style={{ marginTop: 18, textAlign: 'center', fontFamily: T.font, fontSize: 13, color: T.dim }}>
                  {mode === 'login' ? (
                    <>Don't have an account?{' '}
                      <button onClick={() => { setMode('register'); setError(''); }} style={{
                        background: 'none', border: 'none', color: T.accent,
                        cursor: 'pointer', fontFamily: T.font, fontSize: 13, fontWeight: 700, padding: 0,
                      }}>Register free</button>
                    </>
                  ) : (
                    <>Already have an account?{' '}
                      <button onClick={() => { setMode('login'); setError(''); }} style={{
                        background: 'none', border: 'none', color: T.accent,
                        cursor: 'pointer', fontFamily: T.font, fontSize: 13, fontWeight: 700, padding: 0,
                      }}>Log in</button>
                    </>
                  )}
                </p>
              </>
            )}
          </div>

          {!isConfirm && !isForgot && (
            <p style={{
              marginTop: 20, fontFamily: T.font, fontSize: 12, color: T.faint,
              textAlign: 'center', lineHeight: 1.6,
            }}>
              Your progress is saved securely in the cloud.<br />Access from any device. Free forever.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Shared sub-components ── */
function ErrorBox({ children }) {
  return (
    <div style={{
      background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.22)',
      borderRadius: 9, padding: '10px 14px',
      fontFamily: T.font, fontSize: 13,
      color: T.error, lineHeight: 1.5,
    }}>{children}</div>
  );
}

function SubmitBtn({ loading, children }) {
  return (
    <button type="submit" disabled={loading} style={{
      marginTop: 4,
      background: loading ? T.bg2 : T.accent,
      border: 'none',
      color: loading ? T.dim : '#fff',
      padding: '13px', borderRadius: 10,
      cursor: loading ? 'default' : 'pointer',
      fontFamily: T.font, fontWeight: 700, fontSize: 15,
      letterSpacing: '-0.01em', transition: 'all 0.15s',
      boxShadow: loading ? 'none' : '0 4px 14px rgba(99,102,241,0.40)',
      width: '100%',
    }}>
      {children}
    </button>
  );
}
