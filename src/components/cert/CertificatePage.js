'use client';
import { useState, useEffect, useRef } from 'react';
import { T, MOD_COLORS, getGrade } from '@/lib/theme';
import { MODULES, TOTAL_LESSONS } from '@/data/courseData';
import { issueCertificate, getUserCert } from '@/lib/db';

/* ── Site origin ──────────────────────────────────────────── */
function getSiteOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}
function displayUrl(path) {
  return getSiteOrigin().replace(/^https?:\/\//, '') + path;
}

/* ── LinkedIn button ──────────────────────────────────────── */
function LinkedInBtn({ cert, verifyUrl }) {
  if (!cert) return null;
  const issued = new Date(cert.issuedAt);
  const origin = getSiteOrigin();
  const params = new URLSearchParams({
    startTask:        'CERTIFICATION_NAME',
    name:             'Prompt Engineering Mastery — Zero to Mastery',
    organizationName: 'Prompten',
    issueYear:        String(issued.getFullYear()),
    issueMonth:       String(issued.getMonth() + 1),
    certUrl:          `${origin}${verifyUrl}`,
    certId:           cert.certId,
  });
  const href = `https://www.linkedin.com/profile/add?${params.toString()}`;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: '#0a66c2', color: '#fff',
        padding: '11px 22px', borderRadius: 8, border: 'none',
        fontFamily: T.font, fontWeight: 700, fontSize: 13,
        textDecoration: 'none', transition: 'all 0.15s',
        boxShadow: '0 4px 14px rgba(10,102,194,0.40)',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = '#004182'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = '#0a66c2'; e.currentTarget.style.transform = 'none'; }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
      Add to LinkedIn
    </a>
  );
}

/* ── Ornamental divider ───────────────────────────────────── */
function OrnamentDivider({ color = '#818cf8', width = 340, light = false }) {
  const a = light ? 0.35 : 0.5;
  const b = light ? 0.5  : 0.75;
  return (
    <svg width={width} height="14" viewBox={`0 0 ${width} 14`} style={{ display: 'block', margin: '0 auto' }}>
      <line x1="0" y1="7" x2={width * 0.35} y2="7" stroke={color} strokeWidth="0.6" opacity={a}/>
      <polygon points={`${width*0.38},7 ${width*0.395},3 ${width*0.41},7 ${width*0.395},11`} fill={color} opacity={a}/>
      <line x1={width*0.42} y1="4" x2={width*0.44} y2="7" stroke={color} strokeWidth="0.6" opacity={b}/>
      <line x1={width*0.44} y1="7" x2={width*0.46} y2="4" stroke={color} strokeWidth="0.6" opacity={b}/>
      <polygon points={`${width*0.485},7 ${width*0.5},2 ${width*0.515},7 ${width*0.5},12`} fill={color} opacity={b + 0.1}/>
      <line x1={width*0.54} y1="4" x2={width*0.56} y2="7" stroke={color} strokeWidth="0.6" opacity={b}/>
      <line x1={width*0.56} y1="7" x2={width*0.58} y2="4" stroke={color} strokeWidth="0.6" opacity={b}/>
      <polygon points={`${width*0.59},7 ${width*0.605},3 ${width*0.62},7 ${width*0.605},11`} fill={color} opacity={a}/>
      <line x1={width*0.63} y1="7" x2={width} y2="7" stroke={color} strokeWidth="0.6" opacity={a}/>
    </svg>
  );
}

/* ── Premium Prompten Crest ───────────────────────────────── */
function PremiumCrest({ color = '#818cf8', size = 108 }) {
  const cx = size / 2, cy = size / 2;
  const R = size * 0.47;   // outer ring
  const R2 = size * 0.38;  // dashed ring
  const R3 = size * 0.30;  // inner solid ring
  // 8 tick marks at 45° intervals on dashed ring
  const ticks = Array.from({ length: 16 }, (_, i) => {
    const a = (i * 22.5 - 90) * Math.PI / 180;
    const r1 = i % 2 === 0 ? R * 0.88 : R * 0.92;
    const r2 = R * 0.96;
    return { x1: cx + r1*Math.cos(a), y1: cy + r1*Math.sin(a), x2: cx + r2*Math.cos(a), y2: cy + r2*Math.sin(a), major: i%2===0 };
  });
  // 4 diamond dots at cardinal points on outer edge
  const diamonds = [0, 90, 180, 270].map(deg => {
    const a = (deg - 90) * Math.PI / 180;
    return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', margin: '0 auto' }}>
      {/* Outer glow ring */}
      <circle cx={cx} cy={cy} r={R} fill="none" stroke={color} strokeWidth="1" opacity="0.15"/>
      {/* Diamond dots at 4 cardinal points */}
      {diamonds.map((d, i) => (
        <polygon key={i}
          points={`${d.x},${d.y-4} ${d.x+3},${d.y} ${d.x},${d.y+4} ${d.x-3},${d.y}`}
          fill={color} opacity="0.6"
        />
      ))}
      {/* Dashed decorative ring */}
      <circle cx={cx} cy={cy} r={R2} fill="none" stroke={color} strokeWidth="1" strokeDasharray="3 5" opacity="0.45"/>
      {/* Tick marks */}
      {ticks.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
          stroke={color} strokeWidth={t.major ? '1.5' : '0.7'}
          opacity={t.major ? 0.55 : 0.3}
        />
      ))}
      {/* Inner filled circle */}
      <circle cx={cx} cy={cy} r={R3} fill={color} fillOpacity="0.07" stroke={color} strokeWidth="1.2" opacity="0.55"/>
      {/* Inner accent ring */}
      <circle cx={cx} cy={cy} r={R3 * 0.7} fill="none" stroke={color} strokeWidth="0.5" opacity="0.3"/>
      {/* Italic serif P lettermark */}
      <text x={cx} y={cy + size * 0.165}
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontStyle="italic"
        fontWeight="bold"
        fontSize={size * 0.38}
        fill={color}
        opacity="0.92"
      >P</text>
    </svg>
  );
}

/* ── Official circular stamp seal ─────────────────────────── */
function OfficialSeal({ color = '#818cf8', size = 90 }) {
  const cx = size / 2, cy = size / 2;
  const R = size * 0.46;
  const R2 = size * 0.37;
  const cardinals = [0, 90, 180, 270].map(deg => {
    const a = (deg - 90) * Math.PI / 180;
    return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={R} fill="none" stroke={color} strokeWidth="1.5" opacity="0.5"/>
      {/* Cardinal dots */}
      {cardinals.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r="2.2" fill={color} opacity="0.7"/>
      ))}
      {/* Inner ring */}
      <circle cx={cx} cy={cy} r={R2} fill={color} fillOpacity="0.07" stroke={color} strokeWidth="1" opacity="0.45"/>
      {/* Arc text paths */}
      <defs>
        <path id={`seal-top-${size}`} d={`M ${cx - R*0.88},${cy} A ${R*0.88},${R*0.88} 0 0,1 ${cx + R*0.88},${cy}`}/>
        <path id={`seal-bot-${size}`} d={`M ${cx - R*0.82},${cy+4} A ${R*0.82},${R*0.82} 0 0,0 ${cx + R*0.82},${cy+4}`}/>
      </defs>
      <text fontFamily="'Courier New', monospace" fontSize={size*0.085} fill={color} fontWeight="700" letterSpacing="1.8" opacity="0.8">
        <textPath href={`#seal-top-${size}`} startOffset="50%" textAnchor="middle">PROMPTEN · CERTIFIED ·</textPath>
      </text>
      <text fontFamily="'Courier New', monospace" fontSize={size*0.085} fill={color} fontWeight="700" letterSpacing="1.8" opacity="0.65">
        <textPath href={`#seal-bot-${size}`} startOffset="50%" textAnchor="middle">PROMPT ENGINEERING · 2026</textPath>
      </text>
      {/* Central P */}
      <text x={cx} y={cy + size*0.11}
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontStyle="italic" fontWeight="bold"
        fontSize={size * 0.32}
        fill={color} opacity="0.88"
      >P</text>
      {/* Thin rule under P */}
      <line x1={cx - size*0.14} y1={cy + size*0.16} x2={cx + size*0.14} y2={cy + size*0.16}
        stroke={color} strokeWidth="0.6" opacity="0.35"/>
    </svg>
  );
}

/* ── Grade + score badges ─────────────────────────────────── */
function GradeRow({ grade, pct }) {
  const GOLD = '#f59e0b';
  return (
    <div className="cert-grade-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 22 }}>
      {/* Grade */}
      <div className="cert-grade-badge" style={{
        display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
        background: 'rgba(251,159,9,0.10)', border: `1.5px solid rgba(251,159,9,0.35)`,
        borderRadius: 10, padding: '6px 18px', minWidth: 64,
      }}>
        <span className="cert-grade-letter" style={{
          fontFamily: 'Georgia, serif', fontWeight: 'bold', fontSize: 26,
          color: GOLD, lineHeight: 1, letterSpacing: '-0.02em',
        }}>{grade.letter}</span>
        <span className="cert-grade-label" style={{
          fontFamily: 'var(--font-mono, monospace)', fontSize: 8,
          color: 'rgba(245,158,11,0.65)', letterSpacing: '0.14em', marginTop: 2,
        }}>GRADE</span>
      </div>
      {/* Score */}
      <div className="cert-score-badge" style={{
        display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
        background: 'rgba(129,140,248,0.09)', border: `1.5px solid rgba(129,140,248,0.28)`,
        borderRadius: 10, padding: '6px 18px', minWidth: 64,
      }}>
        <span className="cert-score-value" style={{
          fontFamily: 'Georgia, serif', fontWeight: 'bold', fontSize: 26,
          color: '#a5b4fc', lineHeight: 1, letterSpacing: '-0.02em',
        }}>{pct}%</span>
        <span className="cert-score-label" style={{
          fontFamily: 'var(--font-mono, monospace)', fontSize: 8,
          color: 'rgba(129,140,248,0.60)', letterSpacing: '0.14em', marginTop: 2,
        }}>SCORE</span>
      </div>
    </div>
  );
}

/* ── Approval pill ────────────────────────────────────────── */
function ApprovalPill({ label, bg, border, textColor, icon }) {
  return (
    <div className="cert-pill" style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: bg, border: `1px solid ${border}`,
      borderRadius: 20, padding: '5px 12px',
    }}>
      {icon}
      <span className="cert-pill-text" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 8, color: textColor, fontWeight: 700, letterSpacing: '0.1em' }}>{label}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
/*  MAIN PAGE                                                 */
/* ══════════════════════════════════════════════════════════ */
export default function CertificatePage({ user, userId, quizScores, onBack, updateProfile }) {
  const [cert, setCert]     = useState(null);
  const [copied, setCopied] = useState(false);

  const [nameConfirmed, setNameConfirmed] = useState(!user?.nameIsDefault);
  const [nameInput,     setNameInput]     = useState('');
  const [nameSaving,    setNameSaving]    = useState(false);
  const [nameError,     setNameError]     = useState('');
  const nameRef = useRef(null);
  useEffect(() => { if (!nameConfirmed && nameRef.current) nameRef.current.focus(); }, [nameConfirmed]);

  const totalCorrect  = Object.values(quizScores).reduce((a, v) => a + v.score, 0);
  const totalPossible = Object.values(quizScores).reduce((a, v) => a + v.total, 0);
  const pct   = totalPossible > 0 ? Math.round(totalCorrect / totalPossible * 100) : 0;
  const grade = getGrade(pct);

  const moduleScores = MODULES.map((m, mi) => {
    let c = 0, t = 0;
    m.lessons.forEach((_, li) => {
      const s = quizScores[`${mi}-${li}`];
      if (s) { c += s.score; t += s.total; }
    });
    return { tag: m.tag, title: m.title, color: m.color || MOD_COLORS[mi], pct: t > 0 ? Math.round(c / t * 100) : null };
  });

  useEffect(() => {
    if (!userId || !nameConfirmed) return;
    async function fetchOrIssueCert() {
      try {
        const existing = await getUserCert(userId);
        if (existing) {
          setCert(existing);
        } else {
          const newCert = await issueCertificate(userId, {
            name: user.name, email: user.email, pct, grade: grade.letter,
            moduleScores, totalCorrect, totalPossible,
          });
          setCert(newCert);
        }
      } catch (e) {
        console.error('[CertificatePage] cert error', e);
      }
    }
    fetchOrIssueCert();
  }, [userId, nameConfirmed]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleNameSave() {
    const trimmed = nameInput.trim();
    if (!trimmed) { setNameError('Please enter your full name.'); return; }
    if (trimmed.length < 2) { setNameError('Name must be at least 2 characters.'); return; }
    setNameSaving(true); setNameError('');
    try {
      if (updateProfile) await updateProfile({ name: trimmed, bio: user.bio || '', avatarUrl: user.avatarUrl || '' });
      user.name = trimmed;
      setNameConfirmed(true);
    } catch {
      setNameError('Could not save name. Please try again.');
    }
    setNameSaving(false);
  }

  function copyVerifyLink() {
    if (!cert) return;
    navigator.clipboard.writeText(`${getSiteOrigin()}/verify/${cert.certId}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  const verifyUrl  = cert ? `/verify/${cert.certId}` : null;
  const issuedDate = cert
    ? new Date(cert.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  const ACCENT = '#818cf8';
  const ACCENT2 = '#a5b4fc';

  /* ── Name gate ─────────────────────────────────────────── */
  if (!nameConfirmed) return (
    <div style={{
      minHeight: '100vh', background: T.bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 'clamp(24px,5vw,48px) clamp(16px,5vw,24px)',
      fontFamily: T.font,
    }}>
      <div style={{
        width: '100%', maxWidth: 480,
        background: T.bg2, border: `1px solid ${T.border2}`,
        borderRadius: 16, padding: 'clamp(28px,5vw,40px)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 56, height: 56, borderRadius: 14,
            background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.30)',
            fontSize: 26,
          }}>🏆</div>
        </div>
        <h2 style={{ fontFamily: T.display, fontWeight: 800, fontSize: 22, color: T.text, margin: '0 0 8px', letterSpacing: '-0.03em', textAlign: 'center' }}>
          You&apos;ve earned your certificate!
        </h2>
        <p style={{ fontFamily: T.font, fontSize: 14, color: T.muted, lineHeight: 1.7, margin: '0 0 24px', textAlign: 'center' }}>
          Before we engrave your name on the certificate, please enter your
          full name below so it looks great on LinkedIn and beyond.
        </p>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: T.dim, letterSpacing: '0.09em', marginBottom: 7, textTransform: 'uppercase' }}>
            Your Full Name
          </div>
          <input
            ref={nameRef} type="text" value={nameInput}
            onChange={e => { setNameInput(e.target.value); setNameError(''); }}
            onKeyDown={e => { if (e.key === 'Enter') handleNameSave(); }}
            placeholder="e.g. Alex Johnson" maxLength={80}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: T.bg, border: `1.5px solid ${nameError ? T.error + '60' : T.border}`,
              borderRadius: 10, padding: '12px 14px',
              fontFamily: T.font, fontSize: 14, color: T.text,
              outline: 'none', transition: 'border-color 0.15s',
            }}
            onFocus={e => { e.target.style.borderColor = T.accent; e.target.style.boxShadow = `0 0 0 3px rgba(129,140,248,0.12)`; }}
            onBlur={e => { e.target.style.borderColor = nameError ? T.error + '60' : T.border; e.target.style.boxShadow = 'none'; }}
          />
          {nameError && <p style={{ fontFamily: T.font, fontSize: 12, color: T.error, margin: '6px 0 0' }}>{nameError}</p>}
        </div>
        <button onClick={handleNameSave} disabled={nameSaving} style={{
          width: '100%', padding: '13px 0',
          background: nameSaving ? T.bg3 : T.accent, border: 'none',
          borderRadius: 10, color: '#fff', fontFamily: T.font,
          fontWeight: 700, fontSize: 14, cursor: nameSaving ? 'default' : 'pointer',
          transition: 'all 0.15s',
        }}>
          {nameSaving ? 'Saving…' : 'Continue to Certificate →'}
        </button>
        <button onClick={onBack} style={{
          display: 'block', width: '100%', marginTop: 12, padding: '8px 0',
          background: 'none', border: 'none', fontFamily: T.font, fontSize: 13,
          color: T.dim, cursor: 'pointer', transition: 'color 0.15s', textAlign: 'center',
        }}
          onMouseEnter={e => e.currentTarget.style.color = T.muted}
          onMouseLeave={e => e.currentTarget.style.color = T.dim}
        >← Back to course</button>
      </div>
    </div>
  );

  /* ── Certificate page ──────────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', background: T.bg, padding: 'clamp(24px,5vw,48px) clamp(16px,5vw,24px)' }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&display=swap');

        @keyframes certReveal {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes shimmerName {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes floatSeal {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50%       { transform: translateY(-2px) rotate(0.5deg); }
        }

        /* ────────────────── PRINT / SAVE AS PDF ────────────────── */
        @media print {
          @page { size: A4 landscape; margin: 0; }

          html, body {
            margin: 0 !important; padding: 0 !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .no-print { display: none !important; }

          .cert-wrapper {
            background: #fff !important;
            min-height: 100vh !important;
            padding: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }

          /* ── Card shell ── */
          .cert-card {
            background: #ffffff !important;
            border: 2pt solid #4f46e5 !important;
            /* Double-rule frame effect */
            box-shadow:
              inset 0 0 0 4px #ffffff,
              inset 0 0 0 7px #c7d2fe !important;
            border-radius: 8px !important;
            padding: 26px 44px 20px !important;
            width: 940px !important;
            max-width: 940px !important;
            zoom: 0.73 !important;
            page-break-inside: avoid !important;
            animation: none !important;
          }

          /* Rainbow bar stays */
          .cert-top-bar {
            background: linear-gradient(90deg,#818cf8,#6366f1,#a855f7,#ec4899,#f59e0b,#10b981,#3b82f6) !important;
            -webkit-print-color-adjust: exact; print-color-adjust: exact;
          }
          /* Decorative blobs & glow — screen only */
          .cert-blob, .cert-glow { display: none !important; }
          /* Corner ornaments in light indigo for print */
          .cert-corner { border-color: #a5b4fc !important; }

          /* ── Typography overrides — dark text on white ── */
          .cert-presented-by   { color: #6b7280 !important; }
          .cert-issuer-name    { color: #4338ca !important; -webkit-text-fill-color: #4338ca !important; background: none !important; }
          .cert-section-label  { color: #6366f1 !important; }
          .cert-course-title   { color: #1e1b4b !important; -webkit-text-fill-color: #1e1b4b !important; background: none !important; }
          .cert-course-sub     { color: #6b7280 !important; }
          .cert-certifies-text { color: #9ca3af !important; }
          .cert-name           { color: #1e1b4b !important; -webkit-text-fill-color: #1e1b4b !important;
                                  background: none !important; background-size: unset !important; animation: none !important; }

          /* Grade/score badges */
          .cert-grade-row      { margin-bottom: 16px !important; }
          .cert-grade-badge    { background: #fffbeb !important; border-color: #fbbf24 !important; }
          .cert-grade-letter   { color: #92400e !important; }
          .cert-grade-label    { color: #b45309 !important; }
          .cert-score-badge    { background: #eef2ff !important; border-color: #818cf8 !important; }
          .cert-score-value    { color: #3730a3 !important; }
          .cert-score-label    { color: #4f46e5 !important; }

          .cert-body-text      { color: #374151 !important; }
          .cert-divider        { background: #e5e7eb !important; }
          .cert-ornament-line  { stroke: #a5b4fc !important; }

          /* Approval pills */
          .cert-approval-label { color: #9ca3af !important; }
          .cert-pill           { border-color: rgba(0,0,0,0.1) !important; }
          .cert-pill-text      { color: inherit !important; }

          /* Signature row */
          .cert-sig-name       { color: #4338ca !important; border-bottom-color: #c7d2fe !important; }
          .cert-sig-sub        { color: #9ca3af !important; }
          .cert-date-value     { color: #374151 !important; border-bottom-color: #e5e7eb !important; }
          .cert-date-label     { color: #9ca3af !important; }

          /* Footer */
          .cert-footer-rule    { border-top-color: #e5e7eb !important; }
          .cert-footer-label   { color: #9ca3af !important; }
          .cert-footer-value   { color: #374151 !important; }
          .cert-footer-verify  { color: #4f46e5 !important; }

          /* Tighten spacing for print */
          .cert-crest-wrap     { margin-bottom: 12px !important; }
          .cert-issuer-pill    { margin-bottom: 14px !important; }
          .cert-divider-wrap   { margin: 10px 0 !important; }
          .cert-name-wrap      { margin-bottom: 6px !important; }
          .cert-approval-row   { margin-bottom: 12px !important; }
          .cert-sig-row        { margin-bottom: 8px !important; }
        }
      `}</style>

      <div className="cert-wrapper" style={{ maxWidth: 820, margin: '0 auto' }}>

        {/* Back */}
        <button onClick={onBack} className="no-print" style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', color: T.muted,
          cursor: 'pointer', fontFamily: T.font, fontSize: 13, padding: 0, marginBottom: 28,
          transition: 'color 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.color = T.text}
          onMouseLeave={e => e.currentTarget.style.color = T.muted}
        >← Back to Course</button>

        {/* ══════════════════ CERTIFICATE CARD ══════════════════ */}
        <div className="cert-card" style={{
          position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(145deg, #09090f 0%, #0b0913 45%, #0d0a18 100%)',
          border: `1.5px solid rgba(129,140,248,0.28)`,
          borderRadius: 18,
          padding: 'clamp(40px,6vw,60px) clamp(32px,6vw,60px) clamp(32px,5vw,48px)',
          boxShadow: [
            '0 0 0 1px rgba(255,255,255,0.03)',
            '0 40px 90px rgba(0,0,0,0.65)',
            `0 0 120px rgba(129,140,248,0.08)`,
            `inset 0 1px 0 rgba(255,255,255,0.06)`,
          ].join(','),
          animation: 'certReveal 0.85s cubic-bezier(0.22,1,0.36,1) both',
        }}>

          {/* Rainbow spectrum top bar */}
          <div className="cert-top-bar" style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 4,
            background: `linear-gradient(90deg, ${MOD_COLORS[0]}, ${MOD_COLORS[1]}, ${MOD_COLORS[2]}, ${MOD_COLORS[3]}, ${MOD_COLORS[4]}, ${MOD_COLORS[5]}, ${MOD_COLORS[6]})`,
          }}/>
          {/* Thin double-rule below bar */}
          <div style={{
            position: 'absolute', top: 6, left: 0, right: 0, height: '1px',
            background: `rgba(129,140,248,0.15)`,
          }}/>

          {/* Ambient glow blobs */}
          <div className="cert-blob" style={{
            position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%',
            background: `radial-gradient(circle, rgba(129,140,248,0.07) 0%, transparent 70%)`, pointerEvents: 'none',
          }}/>
          <div className="cert-blob" style={{
            position: 'absolute', bottom: -80, left: -80, width: 360, height: 360, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(168,85,247,0.05) 0%, transparent 70%)', pointerEvents: 'none',
          }}/>
          <div className="cert-blob" style={{
            position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)',
            width: 500, height: 300, borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(99,102,241,0.04) 0%, transparent 70%)', pointerEvents: 'none',
          }}/>

          {/* Corner ornaments — more elaborate */}
          {[
            { top: 20, left: 20 },
            { top: 20, right: 20 },
            { bottom: 20, left: 20 },
            { bottom: 20, right: 20 },
          ].map((pos, i) => (
            <div key={i} className="cert-corner" style={{
              position: 'absolute', ...pos, width: 32, height: 32,
              borderTop:    i < 2  ? `2px solid rgba(129,140,248,0.35)` : undefined,
              borderBottom: i >= 2 ? `2px solid rgba(129,140,248,0.35)` : undefined,
              borderLeft:   i % 2 === 0 ? `2px solid rgba(129,140,248,0.35)` : undefined,
              borderRight:  i % 2 === 1 ? `2px solid rgba(129,140,248,0.35)` : undefined,
              borderRadius: i === 0 ? '4px 0 0 0' : i === 1 ? '0 4px 0 0' : i === 2 ? '0 0 0 4px' : '0 0 4px 0',
            }}/>
          ))}
          {/* Extra inner corner accents */}
          {[
            { top: 26, left: 26 },
            { top: 26, right: 26 },
            { bottom: 26, left: 26 },
            { bottom: 26, right: 26 },
          ].map((pos, i) => (
            <div key={`inner-${i}`} style={{
              position: 'absolute', ...pos, width: 8, height: 8,
              borderTop:    i < 2  ? `1px solid rgba(129,140,248,0.20)` : undefined,
              borderBottom: i >= 2 ? `1px solid rgba(129,140,248,0.20)` : undefined,
              borderLeft:   i % 2 === 0 ? `1px solid rgba(129,140,248,0.20)` : undefined,
              borderRight:  i % 2 === 1 ? `1px solid rgba(129,140,248,0.20)` : undefined,
            }}/>
          ))}

          {/* ════════ CERTIFICATE CONTENT ════════ */}
          <div style={{ textAlign: 'center', position: 'relative' }}>

            {/* ── Crest emblem ── */}
            <div className="cert-crest-wrap" style={{ marginBottom: 16 }}>
              <PremiumCrest color={ACCENT} size={108}/>
            </div>

            {/* ── Issued by pill ── */}
            <div className="cert-issuer-pill" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: 'rgba(129,140,248,0.07)',
              border: `1px solid rgba(129,140,248,0.22)`,
              borderRadius: 24, padding: '6px 20px', marginBottom: 18,
            }}>
              <span className="cert-presented-by" style={{
                fontFamily: T.mono, fontSize: 8,
                color: 'rgba(255,255,255,0.28)', letterSpacing: '0.2em',
              }}>PRESENTED BY</span>
              <span className="cert-issuer-name" style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: 15, fontWeight: 700, letterSpacing: '0.06em',
                background: `linear-gradient(135deg, #e0e7ff 0%, ${ACCENT} 60%, #c4b5fd 100%)`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>Prompten</span>
            </div>

            {/* ── Certificate of Completion label ── */}
            <div className="cert-section-label" style={{
              fontFamily: T.mono, fontSize: 9,
              color: `${ACCENT}75`, letterSpacing: '0.32em', marginBottom: 10,
            }}>
              CERTIFICATE OF COMPLETION
            </div>

            {/* ── Course title ── */}
            <div className="cert-course-title" style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontWeight: 900, fontSize: 'clamp(28px,4.5vw,40px)',
              letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 8,
              background: `linear-gradient(135deg, #ffffff 0%, ${ACCENT2} 55%, #c4b5fd 100%)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Prompt Engineering Mastery
            </div>

            <div className="cert-course-sub" style={{
              fontFamily: T.font, fontStyle: 'italic',
              fontSize: 13, color: 'rgba(255,255,255,0.32)', marginBottom: 18,
              letterSpacing: '0.02em',
            }}>
              Zero to Mastery &nbsp;·&nbsp; {TOTAL_LESSONS} Lessons &nbsp;·&nbsp; {MODULES.length} Modules &nbsp;·&nbsp; Full Programme
            </div>

            {/* ── Ornament divider ── */}
            <div className="cert-divider-wrap" style={{ margin: '12px 0 18px' }}>
              <OrnamentDivider color={ACCENT} width={340}/>
            </div>

            {/* ── This certifies that ── */}
            <div className="cert-certifies-text" style={{
              fontFamily: T.mono, fontSize: 8,
              color: 'rgba(255,255,255,0.22)', letterSpacing: '0.28em', marginBottom: 10,
            }}>
              THIS CERTIFIES THAT
            </div>

            {/* ── Recipient name ── */}
            <div className="cert-name-wrap" style={{ marginBottom: 12 }}>
              <div className="cert-name" style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontStyle: 'italic', fontWeight: 700,
                fontSize: 'clamp(34px,6vw,58px)',
                letterSpacing: '-0.01em', lineHeight: 1.1,
                background: `linear-gradient(120deg, #ffffff 0%, ${ACCENT2} 40%, #e0e7ff 70%, ${ACCENT} 100%)`,
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                animation: 'shimmerName 8s ease-in-out infinite',
              }}>
                {user.name}
              </div>
            </div>

            {/* ── Grade + Score badges ── */}
            <GradeRow grade={grade} pct={pct}/>

            {/* ── Body description ── */}
            <p className="cert-body-text" style={{
              fontFamily: T.font,
              fontSize: 'clamp(12px,1.7vw,13.5px)',
              color: 'rgba(255,255,255,0.38)',
              lineHeight: 1.85, margin: '0 auto 22px',
              maxWidth: 560,
            }}>
              has successfully completed the comprehensive{' '}
              <em style={{ color: 'rgba(255,255,255,0.55)' }}>Prompt Engineering Mastery</em>{' '}
              programme, demonstrating expert proficiency in the design, evaluation,
              and deployment of effective prompts across leading AI language models,
              in accordance with best practices established by the AI industry&apos;s
              foremost research organisations.
            </p>

            {/* ── Full-width divider ── */}
            <div className="cert-divider" style={{
              height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 18,
            }}/>

            {/* ── Approval badges ── */}
            <div className="cert-approval-row" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexWrap: 'wrap', gap: 8, marginBottom: 24,
            }}>
              <span className="cert-approval-label" style={{
                fontFamily: T.mono, fontSize: 8,
                color: 'rgba(255,255,255,0.20)', letterSpacing: '0.18em',
              }}>CURRICULUM APPROVED BY</span>

              <ApprovalPill label="Anthropic" bg="rgba(217,119,6,0.10)" border="rgba(217,119,6,0.32)" textColor="#D97706"
                icon={<svg viewBox="0 0 24 24" width="12" height="12" fill="#D97706"><path d="M7 3L11.5 3L4.5 21L0 21Z"/><path d="M12.5 3L17 3L24 21L19.5 21Z"/></svg>}
              />
              <ApprovalPill label="OpenAI" bg="rgba(255,255,255,0.04)" border="rgba(255,255,255,0.16)" textColor="rgba(255,255,255,0.75)"
                icon={<svg viewBox="0 0 24 24" width="12" height="12" fill="rgba(255,255,255,0.80)"><path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9 6.065 6.065 0 0 0-4.512-2.01 6.046 6.046 0 0 0-5.975 5.13 5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .511 4.91 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.77.77 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.77.77 0 0 0 .388.677l5.815 3.354-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.896zm16.597 3.855l-5.833-3.387L15.12 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.104v-5.678a.79.79 0 0 0-.407-.666zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.41 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.376-3.454l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/></svg>}
              />
              <ApprovalPill label="ChatGPT" bg="rgba(16,163,127,0.10)" border="rgba(16,163,127,0.30)" textColor="#10a37f"
                icon={<svg viewBox="0 0 24 24" width="12" height="12" fill="#10a37f"><path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9 6.065 6.065 0 0 0-4.512-2.01 6.046 6.046 0 0 0-5.975 5.13 5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .511 4.91 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.77.77 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.77.77 0 0 0 .388.677l5.815 3.354-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.896zm16.597 3.855l-5.833-3.387L15.12 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.104v-5.678a.79.79 0 0 0-.407-.666zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.41 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.376-3.454l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/></svg>}
              />
              <ApprovalPill label="Google" bg="rgba(66,133,244,0.10)" border="rgba(66,133,244,0.28)" textColor="#4285F4"
                icon={<svg viewBox="0 0 24 24" width="12" height="12"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>}
              />
            </div>

            {/* ── Thin ornament line before signature ── */}
            <div className="cert-divider-wrap" style={{ margin: '0 0 20px' }}>
              <OrnamentDivider color={ACCENT} width={280} light/>
            </div>

            {/* ── Signature · Seal · Date row ── */}
            <div className="cert-sig-row" style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 20,
            }}>
              {/* Signature — left */}
              <div style={{ textAlign: 'left', minWidth: 150 }}>
                <div className="cert-sig-name" style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontStyle: 'italic', fontSize: 24,
                  color: ACCENT2, letterSpacing: '0.03em',
                  borderBottom: `1px solid rgba(129,140,248,0.20)`,
                  paddingBottom: 7, marginBottom: 6,
                }}>Prompten</div>
                <div className="cert-sig-sub" style={{
                  fontFamily: T.mono, fontSize: 7.5,
                  color: 'rgba(255,255,255,0.22)', letterSpacing: '0.16em',
                }}>AUTHORISED SIGNATURE</div>
              </div>

              {/* Official seal — centre, with subtle float animation */}
              <div style={{ textAlign: 'center', animation: 'floatSeal 7s ease-in-out infinite' }}>
                <OfficialSeal color={ACCENT} size={92}/>
              </div>

              {/* Issue date — right */}
              <div style={{ textAlign: 'right', minWidth: 150 }}>
                <div className="cert-date-value" style={{
                  fontFamily: T.font, fontSize: 14, fontWeight: 600,
                  color: 'rgba(255,255,255,0.65)',
                  borderBottom: `1px solid rgba(255,255,255,0.10)`,
                  paddingBottom: 7, marginBottom: 6,
                }}>{issuedDate || '—'}</div>
                <div className="cert-date-label" style={{
                  fontFamily: T.mono, fontSize: 7.5,
                  color: 'rgba(255,255,255,0.22)', letterSpacing: '0.16em',
                }}>DATE OF ISSUE</div>
              </div>
            </div>

            {/* ── Footer: credential ID + verify URL ── */}
            <div className="cert-footer-rule" style={{
              borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 14,
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', flexWrap: 'wrap', gap: 8,
            }}>
              {cert && (
                <div style={{ textAlign: 'left' }}>
                  <div className="cert-footer-label" style={{ fontFamily: T.mono, fontSize: 7.5, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.16em', marginBottom: 3 }}>
                    CREDENTIAL ID
                  </div>
                  <div className="cert-footer-value" style={{ fontFamily: T.mono, fontSize: 10.5, color: 'rgba(255,255,255,0.45)', fontWeight: 700 }}>
                    {cert.certId}
                  </div>
                </div>
              )}
              {verifyUrl && (
                <div style={{ textAlign: 'center' }}>
                  <div className="cert-footer-label" style={{ fontFamily: T.mono, fontSize: 7.5, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.14em', marginBottom: 3 }}>
                    VERIFY AT
                  </div>
                  <div className="cert-footer-verify" style={{ fontFamily: T.mono, fontSize: 9.5, color: `${ACCENT}75` }}>
                    {displayUrl(verifyUrl)}
                  </div>
                </div>
              )}
              {issuedDate && (
                <div style={{ textAlign: 'right' }}>
                  <div className="cert-footer-label" style={{ fontFamily: T.mono, fontSize: 7.5, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.16em', marginBottom: 3 }}>
                    ISSUED
                  </div>
                  <div className="cert-footer-value" style={{ fontFamily: T.mono, fontSize: 10.5, color: 'rgba(255,255,255,0.45)' }}>
                    {issuedDate.toUpperCase()}
                  </div>
                </div>
              )}
            </div>

          </div>{/* /centre */}
        </div>{/* /cert-card */}

        {/* ══════════ ACTION BUTTONS ══════════ */}
        <div className="no-print" style={{
          display: 'flex', gap: 10, marginTop: 24,
          flexWrap: 'wrap', justifyContent: 'center',
        }}>
          <LinkedInBtn cert={cert} verifyUrl={verifyUrl}/>

          <button onClick={() => window.print()} style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: T.bg1, border: `1px solid ${T.border2}`,
            color: T.muted, cursor: 'pointer', padding: '11px 20px', borderRadius: 8,
            fontSize: 13, fontFamily: T.font, fontWeight: 600, transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = T.text; e.currentTarget.style.borderColor = T.accent; }}
            onMouseLeave={e => { e.currentTarget.style.color = T.muted; e.currentTarget.style.borderColor = T.border2; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
            </svg>
            Save as PDF
          </button>

          {cert && (
            <button onClick={copyVerifyLink} style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: copied ? 'rgba(52,211,153,0.08)' : T.bg1,
              border: `1px solid ${copied ? 'rgba(52,211,153,0.35)' : T.border2}`,
              color: copied ? T.success : T.muted,
              cursor: 'pointer', padding: '11px 20px', borderRadius: 8,
              fontSize: 13, fontFamily: T.font, fontWeight: 600, transition: 'all 0.2s',
            }}>
              {copied ? '✓ Copied!' : '🔗 Copy Verify Link'}
            </button>
          )}

          {cert && (
            <a href={verifyUrl} target="_blank" rel="noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: T.bg1, border: `1px solid ${T.border2}`,
              color: T.muted, padding: '11px 20px', borderRadius: 8,
              fontSize: 13, fontFamily: T.font, fontWeight: 600, textDecoration: 'none',
              transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.color = T.text; e.currentTarget.style.borderColor = T.accent; }}
              onMouseLeave={e => { e.currentTarget.style.color = T.muted; e.currentTarget.style.borderColor = T.border2; }}
            >
              ↗ Verify Online
            </a>
          )}
        </div>

        {cert && (
          <p className="no-print" style={{
            marginTop: 14, textAlign: 'center',
            fontFamily: T.font, fontSize: 12, color: T.faint, lineHeight: 1.6,
          }}>
            Credential ID <strong style={{ color: T.muted }}>{cert.certId}</strong> · verifiable at{' '}
            <a href={verifyUrl} target="_blank" rel="noreferrer" style={{ color: T.dim }}>
              {displayUrl(verifyUrl)}
            </a>
          </p>
        )}

        <div className="no-print" style={{ height: 40 }}/>
      </div>
    </div>
  );
}
