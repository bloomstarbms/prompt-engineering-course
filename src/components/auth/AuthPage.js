'use client';
import { useState } from 'react';
import { T } from '@/lib/theme';

export default function AuthPage({ onAuth }) {
  const [mode, setMode]       = useState('login'); // 'login' | 'register'
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

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

function Field({ label, type, value, placeholder, onChange, hint }) {
  return (
    <div>
      <label style={{
        display: 'block', fontFamily: T.mono, fontSize: 10,
        color: T.muted, letterSpacing: '0.1em', marginBottom: 6, textTransform: 'uppercase',
      }}>{label}</label>
      <input
        type={type} value={value} onChange={onChange}
        placeholder={placeholder} required
        style={{
          width: '100%', background: T.bg1, border: `1.5px solid ${T.border}`,
          borderRadius: 8, padding: '11px 14px', color: T.text,
          fontSize: 14, fontFamily: T.font, outline: 'none', transition: 'all 0.2s',
        }}
        onFocus={e => { e.target.style.borderColor = T.accent; e.target.style.boxShadow = `0 0 0 3px ${T.accentLight}`; }}
        onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = 'none'; }}
      />
      {hint && (
        <p style={{ fontFamily: T.font, fontSize: 11, color: T.faint, marginTop: 4 }}>{hint}</p>
      )}
    </div>
  );
}
