'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { T, getGrade } from '@/lib/theme';
import { MODULES, TOTAL_LESSONS, PASS_THRESHOLD } from '@/data/courseData';

/* ── Deterministic colour from name ─────────────────────────────────── */
const AVATAR_GRADIENTS = [
  ['#818cf8', '#6366f1'],
  ['#60a5fa', '#3b82f6'],
  ['#c084fc', '#a855f7'],
  ['#34d399', '#10b981'],
  ['#f87171', '#ef4444'],
  ['#fbbf24', '#f59e0b'],
  ['#22d3ee', '#06b6d4'],
  ['#fb923c', '#f97316'],
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

/* ── SVG Progress Ring ───────────────────────────────────────────────── */
function ProgressRing({ pct, size = 64, stroke = 5, color = T.accent }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (pct / 100);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.bg3} strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
    </svg>
  );
}

/* ── Avatar ──────────────────────────────────────────────────────────── */
function Avatar({ name, avatarUrl, size = 96, fontSize = 28 }) {
  const [imgOk, setImgOk] = useState(true);
  const [colors] = useState(() => gradientForName(name));
  useEffect(() => setImgOk(true), [avatarUrl]);
  if (avatarUrl && imgOk) {
    return (
      <img src={avatarUrl} alt={name} onError={() => setImgOk(false)}
        style={{
          width: size, height: size, borderRadius: '50%',
          objectFit: 'cover', display: 'block',
          border: `2.5px solid rgba(255,255,255,0.12)`,
          boxShadow: `0 0 0 3px ${colors[0]}30`,
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
      boxShadow: `0 0 0 3px ${colors[0]}30, 0 4px 20px ${colors[0]}40`,
    }}>
      {initials(name)}
    </div>
  );
}

/* ── Stat card ───────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, color = T.accent, icon }) {
  return (
    <div style={{
      background: T.bg1, border: `1px solid ${T.border}`,
      borderRadius: 14, padding: '18px 20px', flex: 1, minWidth: 110,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${color}, transparent)`,
        borderRadius: '14px 14px 0 0',
      }} />
      {icon && (
        <div style={{ fontFamily: T.mono, fontSize: 18, marginBottom: 8, lineHeight: 1 }}>{icon}</div>
      )}
      <div style={{ fontFamily: T.display, fontWeight: 800, fontSize: 26, color, lineHeight: 1, letterSpacing: '-0.03em' }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontFamily: T.mono, fontSize: 10, color: T.dim, marginTop: 3, letterSpacing: '0.04em' }}>{sub}</div>
      )}
      <div style={{ fontFamily: T.font, fontSize: 11, color: T.muted, marginTop: 6, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

/* ── Module progress card ────────────────────────────────────────────── */
function ModuleCard({ mod, mi, completed, quizScores }) {
  const total = mod.lessons.length;
  const done  = mod.lessons.filter((_, li) => completed[`${mi}-${li}`]).length;
  const pct   = Math.round(done / total * 100);

  const qEntries = mod.lessons.map((_, li) => quizScores[`${mi}-${li}`]).filter(Boolean);
  const qCorrect = qEntries.reduce((a, q) => a + q.score, 0);
  const qTotal   = qEntries.reduce((a, q) => a + q.total, 0);
  const qPct     = qTotal > 0 ? Math.round(qCorrect / qTotal * 100) : null;
  const qGrade   = qPct !== null ? getGrade(qPct) : null;

  const isComplete = done === total;
  const isStarted  = done > 0 || qEntries.length > 0;

  return (
    <div style={{
      background: T.bg1,
      border: `1px solid ${isComplete ? mod.color + '35' : T.border}`,
      borderRadius: 12, padding: '14px 16px',
      borderTop: `2px solid ${isComplete ? mod.color : mod.color + '22'}`,
      transition: 'border-color 0.2s',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: `${mod.color}14`, border: `1px solid ${mod.color}28`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
        }}>{mod.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: T.mono, fontSize: 9, color: mod.color, letterSpacing: '0.1em', marginBottom: 2 }}>
            {mod.tag}
          </div>
          <div style={{
            fontFamily: T.font, fontWeight: 600, fontSize: 12, color: T.text,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{mod.title}</div>
        </div>
        {isComplete ? (
          <div style={{
            background: `${T.success}14`, border: `1px solid ${T.success}30`,
            borderRadius: 6, padding: '3px 8px',
            fontFamily: T.mono, fontSize: 9, color: T.success, letterSpacing: '0.06em',
          }}>✓ DONE</div>
        ) : !isStarted ? (
          <div style={{
            fontFamily: T.mono, fontSize: 9, color: T.faint, letterSpacing: '0.06em',
          }}>NOT STARTED</div>
        ) : null}
      </div>

      {/* Progress bar */}
      <div style={{ background: T.bg3, borderRadius: 100, height: 4, marginBottom: 8, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: 4, borderRadius: 100,
          background: isComplete
            ? `linear-gradient(90deg, ${mod.color}, ${T.success})`
            : mod.color,
          transition: 'width 0.6s ease',
        }} />
      </div>

      {/* Footer stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: T.mono, fontSize: 10, color: T.dim }}>
          {done}/{total} <span style={{ color: T.faint }}>lessons</span>
        </span>
        {qGrade ? (
          <span style={{ fontFamily: T.mono, fontSize: 10, color: qGrade.color, fontWeight: 700 }}>
            {qPct}% · {qGrade.letter}
          </span>
        ) : qEntries.length === 0 && isStarted ? (
          <span style={{ fontFamily: T.mono, fontSize: 9, color: T.faint }}>no quizzes yet</span>
        ) : null}
      </div>
    </div>
  );
}

/* ── Section header ──────────────────────────────────────────────────── */
function SectionTitle({ children, action }) {
  return (
    <div style={{
      fontFamily: T.mono, fontSize: 10, color: T.dim,
      letterSpacing: '0.12em', marginBottom: 16, marginTop: 32,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{ flex: 1, height: 1, background: T.border }} />
      {children}
      <div style={{ flex: 1, height: 1, background: T.border }} />
      {action}
    </div>
  );
}

/* ── Eye icons ───────────────────────────────────────────────────────── */
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
function Field({ label, value, onChange, type = 'text', multiline = false, readOnly = false, placeholder = '', maxLength, hint }) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';
  const inputType  = isPassword && visible ? 'text' : type;
  const style = {
    width: '100%', boxSizing: 'border-box',
    background: readOnly ? T.bg2 : T.bg1,
    border: `1.5px solid ${T.border}`, borderRadius: 9,
    padding: isPassword ? '10px 42px 10px 14px' : '10px 14px',
    fontFamily: T.font, fontSize: 14, color: readOnly ? T.muted : T.text,
    outline: 'none', resize: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
  };
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontFamily: T.mono, fontSize: 10, color: T.dim, letterSpacing: '0.08em', marginBottom: 6 }}>
        {label}
      </div>
      {multiline ? (
        <textarea value={value} onChange={e => onChange && onChange(e.target.value)}
          placeholder={placeholder} maxLength={maxLength} rows={3}
          readOnly={readOnly} style={{ ...style, padding: '10px 14px' }}
          onFocus={e => { if (!readOnly) { e.target.style.borderColor = T.accent; e.target.style.boxShadow = `0 0 0 3px ${T.accentLight}`; } }}
          onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = 'none'; }}
        />
      ) : (
        <div style={{ position: 'relative' }}>
          <input type={inputType} value={value}
            onChange={e => onChange && onChange(e.target.value)}
            placeholder={placeholder} maxLength={maxLength}
            readOnly={readOnly} style={style}
            onFocus={e => { if (!readOnly) { e.target.style.borderColor = T.accent; e.target.style.boxShadow = `0 0 0 3px ${T.accentLight}`; } }}
            onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = 'none'; }}
          />
          {isPassword && (
            <button type="button" tabIndex={-1} onClick={() => setVisible(v => !v)}
              style={{
                position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: visible ? T.accent : T.dim, padding: 2, display: 'flex', alignItems: 'center',
                transition: 'color 0.15s',
              }}
              aria-label={visible ? 'Hide password' : 'Show password'}
            >
              {visible ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          )}
        </div>
      )}
      {hint && <div style={{ fontFamily: T.font, fontSize: 11, color: T.faint, marginTop: 4 }}>{hint}</div>}
      {maxLength && !readOnly && (
        <div style={{ fontFamily: T.mono, fontSize: 9, color: T.faint, textAlign: 'right', marginTop: 3 }}>
          {value.length}/{maxLength}
        </div>
      )}
    </div>
  );
}

/* ── Main ProfilePage ────────────────────────────────────────────────── */
export default function ProfilePage({
  user, userId, progress, canSeeCert,
  onBack, onLogout, onCert,
  updateProfile, updatePassword,
}) {
  const { completed, quizScores } = progress;
  const completedCount = Object.keys(completed).length;
  const progressPct    = Math.round(completedCount / TOTAL_LESSONS * 100);

  /* overall quiz stats */
  const totalCorrect  = Object.values(quizScores).reduce((a, v) => a + v.score, 0);
  const totalPossible = Object.values(quizScores).reduce((a, v) => a + v.total, 0);
  const avgPct        = totalPossible > 0 ? Math.round(totalCorrect / totalPossible * 100) : null;
  const avgGrade      = avgPct !== null ? getGrade(avgPct) : null;
  const quizzesCount  = Object.values(quizScores).filter(
    s => s.total > 0 && Math.round(s.score / s.total * 100) >= PASS_THRESHOLD
  ).length;
  const totalQuizzesTaken = Object.keys(quizScores).length;

  /* avatar gradient for hero tint */
  const [colors] = useState(() => gradientForName(user.name));

  /* edit state */
  const [name,      setName]      = useState(user.name      || '');
  const [bio,       setBio]       = useState(user.bio       || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [dirty,     setDirty]     = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [saveMsg,   setSaveMsg]   = useState('');
  function markDirty() { setDirty(true); setSaveMsg(''); }

  /* password */
  const [showPw,    setShowPw]    = useState(false);
  const [curPw,     setCurPw]     = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [confPw,    setConfPw]    = useState('');
  const [pwMsg,     setPwMsg]     = useState({ ok: null, text: '' });
  const [pwLoading, setPwLoading] = useState(false);

  /* avatar upload */
  const fileInputRef                        = useRef(null);
  const [uploadError,   setUploadError]     = useState('');
  const [uploadLoading, setUploadLoading]   = useState(false);

  /* logout confirm */
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  const resizeToDataURL = useCallback((file, maxPx = 200, quality = 0.85) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const { naturalWidth: w, naturalHeight: h } = img;
        const scale  = Math.min(1, maxPx / Math.max(w, h));
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
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { setUploadError('Please select an image file.'); return; }
    if (file.size > 10 * 1024 * 1024) { setUploadError('Image must be smaller than 10 MB.'); return; }
    setUploadError('');
    setUploadLoading(true);
    try {
      const dataUrl = await resizeToDataURL(file, 200, 0.85);
      setAvatarUrl(dataUrl);
      markDirty();
    } catch {
      setUploadError('Failed to process image. Try another file.');
    } finally {
      setUploadLoading(false);
    }
  }

  async function handleSave() {
    if (!name.trim()) { setSaveMsg('Name cannot be empty.'); return; }
    if (avatarUrl && !avatarUrl.startsWith('https://') && !avatarUrl.startsWith('data:image/')) {
      setSaveMsg('Avatar URL must start with https://'); return;
    }
    setSaving(true);
    const result = await updateProfile({ name, bio, avatarUrl });
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
    if (!curPw) { setPwMsg({ ok: false, text: 'Enter your current password.' }); return; }
    if (newPw.length < 6) { setPwMsg({ ok: false, text: 'New password must be at least 6 characters.' }); return; }
    if (newPw !== confPw) { setPwMsg({ ok: false, text: 'Passwords do not match.' }); return; }
    setPwLoading(true);
    const result = await updatePassword(curPw, newPw);
    setPwLoading(false);
    if (result.ok) {
      setPwMsg({ ok: true, text: '✓ Password updated successfully.' });
      setCurPw(''); setNewPw(''); setConfPw('');
      setTimeout(() => { setPwMsg({ ok: null, text: '' }); setShowPw(false); }, 3000);
    } else {
      setPwMsg({ ok: false, text: result.error || 'Failed to update password.' });
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Hero Header ──────────────────────────────────────────────── */}
      <div style={{
        background: `radial-gradient(ellipse 80% 100% at 50% -20%, ${colors[0]}18 0%, transparent 70%), linear-gradient(180deg, ${T.bg1} 0%, ${T.bg} 100%)`,
        borderBottom: `1px solid ${T.border}`,
        padding: 'clamp(20px,4vw,36px) clamp(16px,5vw,40px) 0',
      }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>

          {/* Back */}
          <button onClick={onBack} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none',
            color: T.muted, cursor: 'pointer', fontFamily: T.font,
            fontSize: 13, padding: 0, marginBottom: 28, transition: 'color 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = T.text}
            onMouseLeave={e => e.currentTarget.style.color = T.muted}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Back to Course
          </button>

          {/* Avatar + info row */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, marginBottom: 24, flexWrap: 'wrap' }}>
            {/* Avatar with ring */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ position: 'absolute', inset: -5, borderRadius: '50%', zIndex: 0 }}>
                <ProgressRing pct={progressPct} size={116} stroke={4} color={colors[0]} />
              </div>
              <div style={{ position: 'relative', zIndex: 1, margin: 5 }}>
                <Avatar name={name || user.name} avatarUrl={avatarUrl} size={96} fontSize={26} />
              </div>
              {progressPct === 100 && (
                <div style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 26, height: 26, borderRadius: '50%', zIndex: 2,
                  background: `linear-gradient(135deg, ${T.success}, #059669)`,
                  border: `2px solid ${T.bg}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13,
                }}>✓</div>
              )}
            </div>

            {/* Name / email / progress */}
            <div style={{ flex: 1, minWidth: 180, paddingBottom: 8 }}>
              <div style={{
                fontFamily: T.display, fontWeight: 800,
                fontSize: 'clamp(22px,4vw,30px)', color: T.text,
                letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 6,
              }}>
                {name || user.name}
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: T.dim, marginBottom: 12 }}>
                {user.email}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: `${colors[0]}14`, border: `1px solid ${colors[0]}28`,
                  borderRadius: 20, padding: '4px 12px',
                }}>
                  <div style={{ width: 72, height: 3, borderRadius: 2, background: T.bg3, overflow: 'hidden' }}>
                    <div style={{ width: `${progressPct}%`, height: '100%', background: colors[0], borderRadius: 2, transition: 'width 0.5s' }} />
                  </div>
                  <span style={{ fontFamily: T.mono, fontSize: 10, color: colors[0], fontWeight: 700 }}>
                    {progressPct}%
                  </span>
                </div>
                {progressPct === 100 && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    background: `${T.success}12`, border: `1px solid ${T.success}25`,
                    borderRadius: 20, padding: '4px 12px',
                  }}>
                    <span style={{ fontFamily: T.mono, fontSize: 10, color: T.success }}>🎓 COURSE COMPLETE</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Stats Row ── */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '0 0 -1px' }}>
            <StatCard
              label="Lessons Done"
              value={completedCount}
              sub={`of ${TOTAL_LESSONS} total`}
              color={colors[0]}
            />
            <StatCard
              label="Quiz Average"
              value={avgGrade ? `${avgPct}%` : '—'}
              sub={avgGrade ? avgGrade.label : 'no quizzes yet'}
              color={avgGrade ? avgGrade.color : T.dim}
            />
            <StatCard
              label="Quizzes Passed"
              value={quizzesCount}
              sub={totalQuizzesTaken > 0 ? `of ${totalQuizzesTaken} taken` : 'none taken yet'}
              color={T.success}
            />
            <StatCard
              label="Completion"
              value={`${progressPct}%`}
              sub={progressPct === 100 ? 'Course complete!' : `${TOTAL_LESSONS - completedCount} lessons left`}
              color={progressPct === 100 ? T.success : T.accent}
            />
          </div>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div style={{
        maxWidth: 680, margin: '0 auto',
        padding: '0 clamp(16px,5vw,40px) 48px',
      }}>

        {/* ── Certificate Banner ── */}
        {canSeeCert && (
          <>
            <SectionTitle>CERTIFICATE</SectionTitle>
            <button onClick={onCert} style={{
              width: '100%', cursor: 'pointer', textAlign: 'left',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.10) 0%, rgba(129,140,248,0.06) 100%)',
              border: `1.5px solid ${T.accentBorder}`,
              borderRadius: 14, padding: '20px 22px',
              display: 'flex', alignItems: 'center', gap: 18,
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99,102,241,0.16) 0%, rgba(129,140,248,0.10) 100%)'; e.currentTarget.style.boxShadow = `0 4px 24px rgba(99,102,241,0.20)`; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99,102,241,0.10) 0%, rgba(129,140,248,0.06) 100%)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: 13, flexShrink: 0,
                background: T.accentLight, border: `1.5px solid ${T.accentBorder}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
              }}>🎓</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: T.font, fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 4 }}>
                  Certificate of Completion
                </div>
                <div style={{ fontFamily: T.font, fontSize: 13, color: T.muted }}>
                  {completedCount === TOTAL_LESSONS
                    ? 'You completed the full course — view and download your certificate.'
                    : 'You have a certificate issued — view it any time.'}
                </div>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </>
        )}

        {/* ── Module Progress ── */}
        <SectionTitle>COURSE PROGRESS</SectionTitle>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))',
          gap: 10,
        }}>
          {MODULES.map((mod, mi) => (
            <ModuleCard
              key={mi} mod={mod} mi={mi}
              completed={completed} quizScores={quizScores}
            />
          ))}
        </div>

        {/* ── Edit Profile ── */}
        <SectionTitle>PROFILE INFO</SectionTitle>

        {/* Avatar section */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: T.dim, letterSpacing: '0.08em', marginBottom: 10 }}>
            PROFILE PHOTO (optional)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <Avatar name={name || user.name} avatarUrl={avatarUrl} size={60} fontSize={18} />
              {avatarUrl && (
                <button type="button" tabIndex={-1}
                  onClick={() => { setAvatarUrl(''); markDirty(); setUploadError(''); }}
                  title="Remove photo"
                  style={{
                    position: 'absolute', top: -5, right: -5,
                    width: 18, height: 18, borderRadius: '50%',
                    background: T.error, border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 11, fontWeight: 700,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                  }}
                >×</button>
              )}
            </div>
            <div>
              <input ref={fileInputRef} type="file" accept="image/*"
                onChange={handleFileSelect} style={{ display: 'none' }} aria-hidden="true" />
              <button type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadLoading}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  background: T.bg2, border: `1px solid ${T.border2}`,
                  borderRadius: 8, padding: '8px 14px',
                  fontFamily: T.font, fontSize: 13, color: T.text,
                  cursor: uploadLoading ? 'default' : 'pointer',
                  opacity: uploadLoading ? 0.6 : 1, transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!uploadLoading) e.currentTarget.style.borderColor = T.accent; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border2; }}
              >
                {uploadLoading ? (
                  <>
                    <span style={{ display: 'inline-block', width: 13, height: 13, border: `2px solid ${T.dim}`, borderTopColor: T.accent, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    Processing…
                  </>
                ) : (
                  <>{avatarUrl ? 'Change Photo' : 'Upload Photo'}</>
                )}
              </button>
              <div style={{ fontFamily: T.font, fontSize: 11, color: T.dim, marginTop: 5, lineHeight: 1.5 }}>
                JPG, PNG, GIF or WebP · max 10 MB · resized to 200 px
              </div>
            </div>
          </div>
          {uploadError && (
            <div style={{
              fontFamily: T.font, fontSize: 12, color: T.error, marginTop: 8,
              padding: '6px 10px', borderRadius: 7,
              background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)',
            }}>{uploadError}</div>
          )}
        </div>

        <Field label="DISPLAY NAME" value={name}
          onChange={v => { setName(v); markDirty(); }} placeholder="Your name" maxLength={60}
          hint="This name appears on your certificate" />
        <Field label="EMAIL — cannot be changed" value={user.email} readOnly />
        <Field label="BIO" value={bio}
          onChange={v => { setBio(v); markDirty(); }}
          placeholder="Tell us about yourself…" multiline maxLength={280} />

        {/* Save / Cancel */}
        {dirty && (
          <div style={{ display: 'flex', gap: 10, marginTop: 6, marginBottom: 4 }}>
            <button onClick={handleSave} disabled={saving} style={{
              flex: 1, background: T.accent, border: 'none', color: '#fff',
              borderRadius: 9, padding: '12px 0', cursor: saving ? 'default' : 'pointer',
              fontFamily: T.font, fontWeight: 700, fontSize: 14,
              opacity: saving ? 0.7 : 1, transition: 'all 0.15s',
              boxShadow: saving ? 'none' : '0 4px 14px rgba(99,102,241,0.35)',
            }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button onClick={handleCancel} style={{
              flex: 1, background: 'none', border: `1px solid ${T.border}`, color: T.muted,
              borderRadius: 9, padding: '12px 0', cursor: 'pointer',
              fontFamily: T.font, fontWeight: 600, fontSize: 14, transition: 'all 0.15s',
            }}>Cancel</button>
          </div>
        )}
        {saveMsg && (
          <div style={{
            fontFamily: T.font, fontSize: 13, marginTop: 8, padding: '9px 14px', borderRadius: 9,
            color:      saveMsg.startsWith('✓') ? T.success : T.error,
            background: saveMsg.startsWith('✓') ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)',
            border:     `1px solid ${saveMsg.startsWith('✓') ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'}`,
          }}>{saveMsg}</div>
        )}

        {/* ── Security ── */}
        <SectionTitle>SECURITY</SectionTitle>

        <button onClick={() => { setShowPw(p => !p); setPwMsg({ ok: null, text: '' }); }} style={{
          width: '100%', background: T.bg1, border: `1px solid ${T.border}`,
          borderRadius: 10, padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', color: T.muted, fontFamily: T.font, fontSize: 14,
          transition: 'all 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.border2; e.currentTarget.style.color = T.text; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Change Password
          </div>
          <span style={{ fontFamily: T.mono, fontSize: 11 }}>{showPw ? '▲' : '▼'}</span>
        </button>

        {showPw && (
          <div style={{
            background: T.bg1, border: `1px solid ${T.border}`,
            borderTop: 'none', borderRadius: '0 0 10px 10px', padding: 16,
          }}>
            <Field label="CURRENT PASSWORD"    value={curPw}  onChange={setCurPw}  type="password" placeholder="••••••••" />
            <Field label="NEW PASSWORD"         value={newPw}  onChange={setNewPw}  type="password" placeholder="Min 6 characters" />
            <Field label="CONFIRM NEW PASSWORD" value={confPw} onChange={setConfPw} type="password" placeholder="Repeat new password" />
            {pwMsg.text && (
              <div style={{
                fontFamily: T.font, fontSize: 13, marginBottom: 12, padding: '9px 13px', borderRadius: 8,
                color:      pwMsg.ok ? T.success : T.error,
                background: pwMsg.ok ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)',
                border:     `1px solid ${pwMsg.ok ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'}`,
              }}>{pwMsg.text}</div>
            )}
            <button onClick={handlePasswordChange} disabled={pwLoading} style={{
              width: '100%', background: T.bg2, border: `1px solid ${T.border2}`, color: T.text,
              borderRadius: 8, padding: '11px', cursor: pwLoading ? 'default' : 'pointer',
              fontFamily: T.font, fontWeight: 700, fontSize: 14,
              opacity: pwLoading ? 0.7 : 1, transition: 'all 0.15s',
            }}>
              {pwLoading ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        )}

        {/* ── Account ── */}
        <SectionTitle>ACCOUNT</SectionTitle>

        {!logoutConfirm ? (
          <button onClick={() => setLogoutConfirm(true)} style={{
            width: '100%', background: 'rgba(248,113,113,0.06)',
            border: '1px solid rgba(248,113,113,0.22)', color: T.error,
            borderRadius: 10, padding: '12px', cursor: 'pointer',
            fontFamily: T.font, fontWeight: 700, fontSize: 14, transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.06)'; }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign Out
          </button>
        ) : (
          <div style={{
            background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.22)',
            borderRadius: 10, padding: '18px',
          }}>
            <div style={{ fontFamily: T.font, fontSize: 14, color: T.text, marginBottom: 16, textAlign: 'center', lineHeight: 1.5 }}>
              Sign out of your account?<br />
              <span style={{ fontSize: 12, color: T.muted }}>You'll need your password to log back in.</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onLogout} style={{
                flex: 1, background: T.error, border: 'none', color: '#fff',
                borderRadius: 8, padding: '11px', cursor: 'pointer',
                fontFamily: T.font, fontWeight: 700, fontSize: 14,
              }}>Yes, Sign Out</button>
              <button onClick={() => setLogoutConfirm(false)} style={{
                flex: 1, background: 'none', border: `1px solid ${T.border}`, color: T.muted,
                borderRadius: 8, padding: '11px', cursor: 'pointer',
                fontFamily: T.font, fontWeight: 600, fontSize: 14,
              }}>Cancel</button>
            </div>
          </div>
        )}

        <div style={{ height: 48 }} />
      </div>
    </div>
  );
}
