'use client';
import { useState, useRef, useEffect } from 'react';
import { T, getGrade } from '@/lib/theme';
import { MODULES, TOTAL_LESSONS, PASS_THRESHOLD } from '@/data/courseData';

/* ── Deterministic colour from name ─────────────────────────────────── */
const AVATAR_GRADIENTS = [
  ['#818cf8', '#6366f1'], // indigo
  ['#60a5fa', '#3b82f6'], // blue
  ['#c084fc', '#a855f7'], // purple
  ['#34d399', '#10b981'], // emerald
  ['#f87171', '#ef4444'], // rose
  ['#fbbf24', '#f59e0b'], // amber
  ['#22d3ee', '#06b6d4'], // cyan
  ['#fb923c', '#f97316'], // orange
];

function gradientForName(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return AVATAR_GRADIENTS[Math.abs(h) % AVATAR_GRADIENTS.length];
}

function initials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* ── Avatar component ────────────────────────────────────────────────── */
function Avatar({ name, avatarUrl, size = 96, fontSize = 28 }) {
  const [imgOk, setImgOk] = useState(true);
  const [colors]          = useState(() => gradientForName(name));

  useEffect(() => setImgOk(true), [avatarUrl]);

  if (avatarUrl && imgOk) {
    return (
      <img
        src={avatarUrl} alt={name}
        onError={() => setImgOk(false)}
        style={{
          width: size, height: size, borderRadius: '50%',
          objectFit: 'cover', display: 'block',
          border: `2px solid rgba(255,255,255,0.10)`,
        }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: T.display, fontWeight: 800, fontSize,
      color: '#fff', letterSpacing: '-0.02em',
      boxShadow: `0 0 0 2px rgba(255,255,255,0.08), 0 4px 16px ${colors[0]}40`,
    }}>
      {initials(name)}
    </div>
  );
}

/* ── Stat card ───────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, color = T.accent }) {
  return (
    <div style={{
      background: T.bg1, border: `1px solid ${T.border}`,
      borderRadius: 12, padding: '16px 20px', flex: 1, minWidth: 120,
    }}>
      <div style={{ fontFamily: T.display, fontWeight: 800, fontSize: 28, color, lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontFamily: T.mono, fontSize: 10, color: T.dim, marginTop: 3 }}>{sub}</div>
      )}
      <div style={{ fontFamily: T.font, fontSize: 11, color: T.muted, marginTop: 6 }}>{label}</div>
    </div>
  );
}

/* ── Input / Textarea ────────────────────────────────────────────────── */
function Field({ label, value, onChange, type = 'text', multiline = false, readOnly = false, placeholder = '', maxLength }) {
  const style = {
    width: '100%', boxSizing: 'border-box',
    background: readOnly ? T.bg2 : T.bg1,
    border: `1px solid ${T.border}`, borderRadius: 9,
    padding: '10px 14px',
    fontFamily: T.font, fontSize: 14, color: readOnly ? T.muted : T.text,
    outline: 'none', resize: 'none',
    transition: 'border-color 0.15s',
  };
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontFamily: T.mono, fontSize: 10, color: T.dim, letterSpacing: '0.08em', marginBottom: 6 }}>
        {label}
      </div>
      {multiline ? (
        <textarea
          value={value} onChange={e => onChange && onChange(e.target.value)}
          placeholder={placeholder} maxLength={maxLength}
          rows={3} readOnly={readOnly} style={style}
          onFocus={e => { if (!readOnly) e.target.style.borderColor = T.accent; }}
          onBlur={e => { e.target.style.borderColor = T.border; }}
        />
      ) : (
        <input
          type={type} value={value} onChange={e => onChange && onChange(e.target.value)}
          placeholder={placeholder} maxLength={maxLength}
          readOnly={readOnly} style={style}
          onFocus={e => { if (!readOnly) e.target.style.borderColor = T.accent; }}
          onBlur={e => { e.target.style.borderColor = T.border; }}
        />
      )}
      {maxLength && !readOnly && (
        <div style={{ fontFamily: T.mono, fontSize: 9, color: T.faint, textAlign: 'right', marginTop: 3 }}>
          {value.length}/{maxLength}
        </div>
      )}
    </div>
  );
}

/* ── Section header ──────────────────────────────────────────────────── */
function SectionTitle({ children }) {
  return (
    <div style={{
      fontFamily: T.mono, fontSize: 10, color: T.dim,
      letterSpacing: '0.12em', marginBottom: 14, marginTop: 28,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{ flex: 1, height: 1, background: T.border }} />
      {children}
      <div style={{ flex: 1, height: 1, background: T.border }} />
    </div>
  );
}

/* ── Main ProfilePage ────────────────────────────────────────────────── */
export default function ProfilePage({ user, progress, onBack, onLogout, updateProfile, updatePassword }) {
  const { completed, quizScores } = progress;
  const completedCount = Object.keys(completed).length;

  /* stats */
  const totalCorrect  = Object.values(quizScores).reduce((a, v) => a + v.score, 0);
  const totalPossible = Object.values(quizScores).reduce((a, v) => a + v.total, 0);
  const avgPct        = totalPossible > 0 ? Math.round(totalCorrect / totalPossible * 100) : null;
  const avgGrade      = avgPct !== null ? getGrade(avgPct) : null;
  const quizzesCount  = Object.keys(quizScores).length;

  /* edit state */
  const [name,      setName]      = useState(user.name      || '');
  const [bio,       setBio]       = useState(user.bio       || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [dirty,     setDirty]     = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [saveMsg,   setSaveMsg]   = useState('');

  /* password */
  const [showPw,    setShowPw]    = useState(false);
  const [curPw,     setCurPw]     = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [confPw,    setConfPw]    = useState('');
  const [pwMsg,     setPwMsg]     = useState({ ok: null, text: '' });
  const [pwLoading, setPwLoading] = useState(false);

  /* logout confirm */
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  function markDirty() { setDirty(true); setSaveMsg(''); }

  async function handleSave() {
    if (!name.trim()) { setSaveMsg('Name cannot be empty.'); return; }
    if (avatarUrl && !avatarUrl.startsWith('https://')) {
      setSaveMsg('Avatar URL must start with https://');
      return;
    }
    setSaving(true);
    const result = updateProfile({ name, bio, avatarUrl });
    setSaving(false);
    if (result.ok) {
      setDirty(false);
      setSaveMsg('✓ Profile saved');
      setTimeout(() => setSaveMsg(''), 3000);
    } else {
      setSaveMsg(result.error || 'Save failed.');
    }
  }

  function handleCancel() {
    setName(user.name || '');
    setBio(user.bio || '');
    setAvatarUrl(user.avatarUrl || '');
    setDirty(false);
    setSaveMsg('');
  }

  async function handlePasswordChange() {
    if (!curPw)           { setPwMsg({ ok: false, text: 'Enter your current password.' }); return; }
    if (newPw.length < 6) { setPwMsg({ ok: false, text: 'New password must be at least 6 characters.' }); return; }
    if (newPw !== confPw) { setPwMsg({ ok: false, text: 'New passwords do not match.' }); return; }
    setPwLoading(true);
    const result = updatePassword(curPw, newPw);
    setPwLoading(false);
    if (result.ok) {
      setPwMsg({ ok: true, text: '✓ Password updated successfully.' });
      setCurPw(''); setNewPw(''); setConfPw('');
      setTimeout(() => { setPwMsg({ ok: null, text: '' }); setShowPw(false); }, 3000);
    } else {
      setPwMsg({ ok: false, text: result.error || 'Failed to update password.' });
    }
  }

  const progressPct = Math.round(completedCount / TOTAL_LESSONS * 100);
  const [colors]    = useState(() => gradientForName(user.name));

  return (
    <div style={{
      minHeight: '100vh', background: T.bg,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: 'clamp(24px,5vw,56px) clamp(16px,5vw,24px)',
    }}>
      <div style={{ width: '100%', maxWidth: 560 }}>

        {/* ── Back ── */}
        <button onClick={onBack} style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
          color: T.muted, cursor: 'pointer', fontFamily: T.font, fontSize: 13, padding: 0, marginBottom: 32,
        }}>← Back to Course</button>

        {/* ── Avatar + Name header ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
          <Avatar name={name || user.name} avatarUrl={avatarUrl} size={80} fontSize={24} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: T.display, fontWeight: 800,
              fontSize: 'clamp(20px,4vw,26px)', color: T.text,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              letterSpacing: '-0.02em',
            }}>
              {name || user.name}
            </div>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.dim, marginTop: 4 }}>
              {user.email}
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              marginTop: 8, background: `${colors[0]}15`,
              border: `1px solid ${colors[0]}30`,
              borderRadius: 20, padding: '3px 10px',
            }}>
              <div style={{
                width: 60, height: 3, borderRadius: 2,
                background: T.bg3, overflow: 'hidden',
              }}>
                <div style={{ width: `${progressPct}%`, height: '100%', background: colors[0], borderRadius: 2, transition: 'width 0.4s' }} />
              </div>
              <span style={{ fontFamily: T.mono, fontSize: 9, color: colors[0] }}>
                {progressPct}% COMPLETE
              </span>
            </div>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
          <StatCard label="Lessons Done" value={completedCount} sub={`of ${TOTAL_LESSONS}`} color={T.accent} />
          <StatCard
            label="Quiz Average"
            value={avgGrade ? `${avgPct}%` : '—'}
            sub={avgGrade ? avgGrade.label : 'no quizzes yet'}
            color={avgGrade ? avgGrade.color : T.dim}
          />
          <StatCard label="Quizzes Passed" value={quizzesCount} sub="completed" color={T.success} />
        </div>

        {/* ── Edit Profile ── */}
        <SectionTitle>PROFILE INFO</SectionTitle>

        <Field
          label="DISPLAY NAME"
          value={name}
          onChange={v => { setName(v); markDirty(); }}
          placeholder="Your name"
          maxLength={60}
        />
        <Field
          label="EMAIL — cannot be changed"
          value={user.email}
          readOnly
        />
        <Field
          label="BIO"
          value={bio}
          onChange={v => { setBio(v); markDirty(); }}
          placeholder="Tell us about yourself..."
          multiline
          maxLength={280}
        />

        {/* Avatar URL */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: T.dim, letterSpacing: '0.08em', marginBottom: 6 }}>
            AVATAR IMAGE URL (optional)
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="url" value={avatarUrl}
              onChange={e => { setAvatarUrl(e.target.value); markDirty(); }}
              placeholder="https://example.com/photo.jpg (must be https)"
              style={{
                flex: 1, background: T.bg1, border: `1px solid ${T.border}`,
                borderRadius: 9, padding: '10px 14px',
                fontFamily: T.font, fontSize: 13, color: T.text, outline: 'none',
              }}
              onFocus={e => { e.target.style.borderColor = T.accent; }}
              onBlur={e => { e.target.style.borderColor = T.border; }}
            />
            <Avatar name={name || user.name} avatarUrl={avatarUrl} size={38} fontSize={12} />
          </div>
          <div style={{ fontFamily: T.font, fontSize: 11, color: T.dim, marginTop: 5 }}>
            Paste a direct image URL (https only). If it doesn't load, your initials avatar is shown.
          </div>
        </div>

        {/* Save / Cancel */}
        {dirty && (
          <div style={{ display: 'flex', gap: 10, marginTop: 6, marginBottom: 4 }}>
            <button onClick={handleSave} disabled={saving} style={{
              flex: 1, background: T.accent, border: 'none', color: '#fff',
              borderRadius: 9, padding: '11px 0', cursor: saving ? 'default' : 'pointer',
              fontFamily: T.font, fontWeight: 700, fontSize: 14,
              opacity: saving ? 0.7 : 1, transition: 'all 0.15s',
            }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button onClick={handleCancel} style={{
              flex: 1, background: 'none', border: `1px solid ${T.border}`, color: T.muted,
              borderRadius: 9, padding: '11px 0', cursor: 'pointer',
              fontFamily: T.font, fontWeight: 600, fontSize: 14, transition: 'all 0.15s',
            }}>
              Cancel
            </button>
          </div>
        )}
        {saveMsg && (
          <div style={{
            fontFamily: T.font, fontSize: 13, marginTop: 8, padding: '8px 12px',
            borderRadius: 8,
            color:      saveMsg.startsWith('✓') ? T.success : T.error,
            background: saveMsg.startsWith('✓') ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)',
            border:     `1px solid ${saveMsg.startsWith('✓') ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'}`,
          }}>
            {saveMsg}
          </div>
        )}

        {/* ── Change Password ── */}
        <SectionTitle>SECURITY</SectionTitle>

        <button onClick={() => { setShowPw(p => !p); setPwMsg({ ok: null, text: '' }); }} style={{
          width: '100%', background: T.bg1, border: `1px solid ${T.border}`,
          borderRadius: 9, padding: '11px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', color: T.muted, fontFamily: T.font, fontSize: 14,
          transition: 'all 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.border2; e.currentTarget.style.color = T.text; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}
        >
          <span>🔒 Change Password</span>
          <span style={{ fontFamily: T.mono, fontSize: 11 }}>{showPw ? '▲' : '▼'}</span>
        </button>

        {showPw && (
          <div style={{
            background: T.bg1, border: `1px solid ${T.border}`,
            borderTop: 'none', borderRadius: '0 0 9px 9px',
            padding: '16px',
          }}>
            <Field label="CURRENT PASSWORD"  value={curPw}  onChange={setCurPw}  type="password" placeholder="••••••••" />
            <Field label="NEW PASSWORD"       value={newPw}  onChange={setNewPw}  type="password" placeholder="Min 6 characters" />
            <Field label="CONFIRM NEW PASSWORD" value={confPw} onChange={setConfPw} type="password" placeholder="Repeat new password" />

            {pwMsg.text && (
              <div style={{
                fontFamily: T.font, fontSize: 13, marginBottom: 12, padding: '8px 12px',
                borderRadius: 8,
                color:      pwMsg.ok ? T.success : T.error,
                background: pwMsg.ok ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)',
                border:     `1px solid ${pwMsg.ok ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'}`,
              }}>
                {pwMsg.text}
              </div>
            )}

            <button onClick={handlePasswordChange} disabled={pwLoading} style={{
              width: '100%', background: T.bg2, border: `1px solid ${T.border2}`, color: T.text,
              borderRadius: 8, padding: '10px', cursor: pwLoading ? 'default' : 'pointer',
              fontFamily: T.font, fontWeight: 700, fontSize: 14,
              opacity: pwLoading ? 0.7 : 1, transition: 'all 0.15s',
            }}>
              {pwLoading ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        )}

        {/* ── Sign Out ── */}
        <SectionTitle>ACCOUNT</SectionTitle>

        {!logoutConfirm ? (
          <button onClick={() => setLogoutConfirm(true)} style={{
            width: '100%', background: 'rgba(248,113,113,0.06)',
            border: '1px solid rgba(248,113,113,0.25)', color: T.error,
            borderRadius: 9, padding: '12px', cursor: 'pointer',
            fontFamily: T.font, fontWeight: 700, fontSize: 14,
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.06)'; }}
          >
            Sign Out
          </button>
        ) : (
          <div style={{
            background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.25)',
            borderRadius: 9, padding: '16px',
          }}>
            <div style={{ fontFamily: T.font, fontSize: 14, color: T.text, marginBottom: 14, textAlign: 'center' }}>
              Sign out of your account? You'll need your password to log back in.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onLogout} style={{
                flex: 1, background: T.error, border: 'none', color: '#fff',
                borderRadius: 8, padding: '10px', cursor: 'pointer',
                fontFamily: T.font, fontWeight: 700, fontSize: 14,
              }}>
                Yes, Sign Out
              </button>
              <button onClick={() => setLogoutConfirm(false)} style={{
                flex: 1, background: 'none', border: `1px solid ${T.border}`, color: T.muted,
                borderRadius: 8, padding: '10px', cursor: 'pointer',
                fontFamily: T.font, fontWeight: 600, fontSize: 14,
              }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <div style={{ height: 48 }} />
      </div>
    </div>
  );
}
