'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
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

/* ── Eye icons for password toggle ──────────────────────────────────── */
function EyeIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

/* ── Input / Textarea ────────────────────────────────────────────────── */
function Field({ label, value, onChange, type = 'text', multiline = false, readOnly = false, placeholder = '', maxLength }) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';
  const inputType  = isPassword && visible ? 'text' : type;

  const style = {
    width: '100%', boxSizing: 'border-box',
    background: readOnly ? T.bg2 : T.bg1,
    border: `1px solid ${T.border}`, borderRadius: 9,
    padding: isPassword ? '10px 42px 10px 14px' : '10px 14px',
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
          rows={3} readOnly={readOnly} style={{ ...style, padding: '10px 14px' }}
          onFocus={e => { if (!readOnly) e.target.style.borderColor = T.accent; }}
          onBlur={e => { e.target.style.borderColor = T.border; }}
        />
      ) : (
        <div style={{ position: 'relative' }}>
          <input
            type={inputType} value={value} onChange={e => onChange && onChange(e.target.value)}
            placeholder={placeholder} maxLength={maxLength}
            readOnly={readOnly} style={style}
            onFocus={e => { if (!readOnly) e.target.style.borderColor = T.accent; }}
            onBlur={e => { e.target.style.borderColor = T.border; }}
          />
          {isPassword && (
            <button
              type="button" tabIndex={-1}
              onClick={() => setVisible(v => !v)}
              style={{
                position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: T.dim, padding: 2, display: 'flex', alignItems: 'center',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = T.muted; }}
              onMouseLeave={e => { e.currentTarget.style.color = T.dim; }}
              aria-label={visible ? 'Hide password' : 'Show password'}
            >
              {visible ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          )}
        </div>
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

  /* avatar upload */
  const fileInputRef                      = useRef(null);
  const [uploadError,  setUploadError]    = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);

  /* logout confirm */
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  function markDirty() { setDirty(true); setSaveMsg(''); }

  /* Resize image to max maxPx on longest side, returns data URL */
  const resizeToDataURL = useCallback((file, maxPx = 200, quality = 0.85) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const { naturalWidth: w, naturalHeight: h } = img;
        const scale = Math.min(1, maxPx / Math.max(w, h));
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not load image')); };
      img.src = url;
    });
  }, []);

  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    e.target.value = '';           // allow re-selecting the same file
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file (JPG, PNG, GIF, WebP…)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image must be smaller than 10 MB.');
      return;
    }
    setUploadError('');
    setUploadLoading(true);
    try {
      const dataUrl = await resizeToDataURL(file, 200, 0.85);
      setAvatarUrl(dataUrl);
      markDirty();
    } catch {
      setUploadError('Failed to process image. Please try another file.');
    } finally {
      setUploadLoading(false);
    }
  }

  async function handleSave() {
    if (!name.trim()) { setSaveMsg('Name cannot be empty.'); return; }
    if (avatarUrl && !avatarUrl.startsWith('https://') && !avatarUrl.startsWith('data:image/')) {
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

        {/* Avatar upload */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: T.dim, letterSpacing: '0.08em', marginBottom: 8 }}>
            PROFILE PHOTO (optional)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Preview */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <Avatar name={name || user.name} avatarUrl={avatarUrl} size={62} fontSize={18} />
              {avatarUrl && (
                <button
                  type="button" tabIndex={-1}
                  onClick={() => { setAvatarUrl(''); markDirty(); setUploadError(''); }}
                  title="Remove photo"
                  style={{
                    position: 'absolute', top: -6, right: -6,
                    width: 18, height: 18, borderRadius: '50%',
                    background: T.error, border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 11, fontWeight: 700, lineHeight: 1,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
                  }}
                >×</button>
              )}
            </div>

            {/* Buttons + hint */}
            <div style={{ flex: 1 }}>
              <input
                ref={fileInputRef} type="file" accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                aria-hidden="true"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadLoading}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  background: T.bg2, border: `1px solid ${T.border2}`,
                  borderRadius: 8, padding: '8px 14px',
                  fontFamily: T.font, fontSize: 13, color: T.text,
                  cursor: uploadLoading ? 'default' : 'pointer',
                  opacity: uploadLoading ? 0.6 : 1,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!uploadLoading) e.currentTarget.style.borderColor = T.accent; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border2; }}
              >
                {uploadLoading ? (
                  <>
                    <span style={{
                      display: 'inline-block', width: 13, height: 13,
                      border: `2px solid ${T.dim}`, borderTopColor: T.accent,
                      borderRadius: '50%', animation: 'spin 0.7s linear infinite',
                    }} />
                    Processing…
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    {avatarUrl ? 'Change Photo' : 'Upload Photo'}
                  </>
                )}
              </button>
              <div style={{ fontFamily: T.font, fontSize: 11, color: T.dim, marginTop: 6, lineHeight: 1.5 }}>
                JPG, PNG, GIF or WebP · max 10 MB · resized to 200 px
              </div>
            </div>
          </div>

          {uploadError && (
            <div style={{
              fontFamily: T.font, fontSize: 12, color: T.error, marginTop: 8,
              padding: '6px 10px', borderRadius: 7,
              background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)',
            }}>
              {uploadError}
            </div>
          )}
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
