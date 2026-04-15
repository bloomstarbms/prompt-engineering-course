'use client';
import { useState, useEffect, useRef } from 'react';
import { T, MOD_COLORS, getGrade } from '@/lib/theme';
import { MODULES, TOTAL_LESSONS } from '@/data/courseData';
import { issueCertificate, getUserCert } from '@/lib/auth';

/* ── helpers ── */
function pad(n) { return String(n).padStart(2, '0'); }

function LinkedInBtn({ cert, user, pct, verifyUrl }) {
  if (!cert) return null;
  const issued = new Date(cert.issuedAt);
  const params = new URLSearchParams({
    startTask:      'CERTIFICATION_NAME',
    name:           'Prompt Engineering Mastery',
    organizationId: '',
    issueYear:      issued.getFullYear(),
    issueMonth:     issued.getMonth() + 1,
    certUrl:        typeof window !== 'undefined'
                      ? `${window.location.origin}${verifyUrl}` : verifyUrl,
    certId:         cert.certId,
  });
  const href = `https://www.linkedin.com/profile/add?${params.toString()}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: '#0a66c2', border: 'none', color: '#fff',
        padding: '11px 22px', borderRadius: 8,
        fontFamily: T.font, fontWeight: 700, fontSize: 13,
        textDecoration: 'none', transition: 'all 0.15s',
        boxShadow: '0 4px 14px rgba(10,102,194,0.4)',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = '#004182'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = '#0a66c2'; e.currentTarget.style.transform = 'none'; }}
    >
      {/* LinkedIn icon */}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
      Add to LinkedIn
    </a>
  );
}

/* ── decorative SVG seal ── */
function Seal({ grade, color, pct }) {
  return (
    <div style={{ position: 'relative', width: 110, height: 110, margin: '0 auto 24px' }}>
      <svg width="110" height="110" viewBox="0 0 110 110" style={{ position: 'absolute', inset: 0 }}>
        {/* Outer ring */}
        <circle cx="55" cy="55" r="50" fill="none" stroke={`${color}28`} strokeWidth="2" />
        {/* Dashed ring */}
        <circle cx="55" cy="55" r="44" fill="none" stroke={`${color}40`} strokeWidth="1"
          strokeDasharray="4 4" />
        {/* Inner fill */}
        <circle cx="55" cy="55" r="38" fill={`${color}0d`} stroke={`${color}30`} strokeWidth="1.5" />
        {/* Star points */}
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * 30 - 90) * Math.PI / 180;
          const x1 = 55 + 47 * Math.cos(a);
          const y1 = 55 + 47 * Math.sin(a);
          const x2 = 55 + 51 * Math.cos(a);
          const y2 = 55 + 51 * Math.sin(a);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={`${color}50`} strokeWidth="1.5" />;
        })}
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0,
      }}>
        <div style={{
          fontFamily: T.display, fontWeight: 900, fontSize: 36,
          color, lineHeight: 1, letterSpacing: '-0.04em',
        }}>{grade.letter}</div>
        <div style={{ fontFamily: T.mono, fontSize: 10, color: `${color}b0`, letterSpacing: '0.08em', marginTop: 2 }}>{pct}%</div>
      </div>
    </div>
  );
}

export default function CertificatePage({ user, quizScores, onBack }) {
  const [cert, setCert]     = useState(null);
  const [copied, setCopied] = useState(false);
  const certCardRef         = useRef(null);

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
    const existing = getUserCert(user.email);
    if (existing) {
      setCert(existing);
    } else {
      const newCert = issueCertificate({
        name: user.name, email: user.email, pct, grade: grade.letter,
        moduleScores, totalCorrect, totalPossible,
      });
      setCert(newCert);
    }
  }, [user.email]); // eslint-disable-line react-hooks/exhaustive-deps

  function copyVerifyLink() {
    if (!cert) return;
    const url = `${window.location.origin}/verify/${cert.certId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  const verifyUrl  = cert ? `/verify/${cert.certId}` : '';
  const issuedDate = cert
    ? new Date(cert.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div style={{ minHeight: '100vh', background: T.bg, padding: 'clamp(24px,5vw,48px) clamp(16px,5vw,24px)' }}>

      <style>{`
        @keyframes certReveal {
          from { opacity: 0; transform: scale(0.95) translateY(16px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
        @keyframes floatName {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-4px); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media print {
          .no-print { display: none !important; }
          body { background: #09090b !important; }
        }
      `}</style>

      <div style={{ maxWidth: 720, margin: '0 auto' }}>

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

        {/* ── Certificate card ── */}
        <div
          ref={certCardRef}
          style={{
            background: 'linear-gradient(160deg, #111116 0%, #0d0d12 60%, #0f0d18 100%)',
            border: `1px solid ${grade.color}30`,
            borderRadius: 24,
            padding: 'clamp(32px,6vw,56px) clamp(24px,6vw,52px)',
            boxShadow: `0 0 0 1px rgba(255,255,255,0.04), 0 32px 64px rgba(0,0,0,0.5), 0 0 80px ${grade.color}12`,
            animation: 'certReveal 0.75s cubic-bezier(0.34,1.56,0.64,1) both',
            position: 'relative', overflow: 'hidden',
          }}
        >
          {/* Background glow blobs */}
          <div style={{
            position: 'absolute', top: -60, right: -60, width: 280, height: 280, borderRadius: '50%',
            background: `radial-gradient(circle, ${grade.color}12 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: -80, left: -40, width: 240, height: 240, borderRadius: '50%',
            background: `radial-gradient(circle, ${MOD_COLORS[1]}0a 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />

          {/* Rainbow top bar */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 3,
            background: `linear-gradient(90deg, ${MOD_COLORS[0]}, ${MOD_COLORS[1]}, ${MOD_COLORS[2]}, ${MOD_COLORS[3]}, ${MOD_COLORS[4]}, ${MOD_COLORS[5]}, ${MOD_COLORS[6]})`,
          }} />

          {/* Corner ornaments */}
          {[
            { top: 20, left: 20 },
            { top: 20, right: 20 },
            { bottom: 20, left: 20 },
            { bottom: 20, right: 20 },
          ].map((pos, i) => (
            <div key={i} style={{
              position: 'absolute', ...pos,
              width: 22, height: 22,
              borderTop:    (i < 2)  ? `1.5px solid ${grade.color}35` : undefined,
              borderBottom: (i >= 2) ? `1.5px solid ${grade.color}35` : undefined,
              borderLeft:   (i % 2 === 0) ? `1.5px solid ${grade.color}35` : undefined,
              borderRight:  (i % 2 === 1) ? `1.5px solid ${grade.color}35` : undefined,
            }} />
          ))}

          <div style={{ textAlign: 'center', position: 'relative' }}>

            {/* Issuer badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20, padding: '5px 14px', marginBottom: 28,
            }}>
              <span style={{ fontFamily: T.mono, fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.15em' }}>
                ISSUED BY
              </span>
              <a
                href="https://x.com/bloomstarbms"
                target="_blank" rel="noopener noreferrer"
                style={{ fontFamily: T.mono, fontSize: 9, color: grade.color, letterSpacing: '0.12em',
                  textDecoration: 'none', fontWeight: 700 }}
              >
                @bloomstarbms
              </a>
            </div>

            {/* Seal */}
            <Seal grade={grade} color={grade.color} pct={pct} />

            {/* Title */}
            <div style={{
              fontFamily: T.mono, fontSize: 10, color: 'rgba(255,255,255,0.3)',
              letterSpacing: '0.22em', marginBottom: 6,
            }}>
              CERTIFICATE OF COMPLETION
            </div>
            <div style={{
              fontFamily: T.display, fontWeight: 900,
              fontSize: 'clamp(22px,4vw,30px)', color: '#fff',
              letterSpacing: '-0.03em', marginBottom: 4,
              background: `linear-gradient(135deg, #fff 30%, ${grade.color} 100%)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Prompt Engineering Mastery
            </div>
            <div style={{
              fontFamily: T.font, fontStyle: 'italic',
              fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 36,
            }}>
              Zero to Mastery · Full Course · {TOTAL_LESSONS} Lessons · {MODULES.length} Modules
            </div>

            {/* Divider */}
            <div style={{
              width: 48, height: 1, margin: '0 auto 28px',
              background: `linear-gradient(90deg, transparent, ${grade.color}60, transparent)`,
            }} />

            {/* Certifies that */}
            <div style={{
              fontFamily: T.mono, fontSize: 9, color: 'rgba(255,255,255,0.3)',
              letterSpacing: '0.2em', marginBottom: 10,
            }}>
              THIS CERTIFIES THAT
            </div>

            {/* Name */}
            <div style={{
              fontFamily: T.display, fontStyle: 'italic',
              fontSize: 'clamp(28px,6vw,50px)',
              letterSpacing: '-0.02em', marginBottom: 20,
              lineHeight: 1.1,
              animation: 'floatName 5s ease-in-out infinite',
              background: `linear-gradient(135deg, #fff 0%, ${grade.color} 100%)`,
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              {user.name}
            </div>

            <p style={{
              fontFamily: T.font, fontSize: 'clamp(12px,1.8vw,14px)',
              color: 'rgba(255,255,255,0.45)', lineHeight: 1.7,
              marginBottom: 36, maxWidth: 480, margin: '0 auto 36px',
            }}>
              has successfully completed all {TOTAL_LESSONS} lessons across {MODULES.length} modules,
              demonstrating mastery of prompt engineering principles, techniques, and real-world applications.
            </p>

            {/* Module scores */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 6, marginBottom: 36,
            }}>
              {moduleScores.map((ms, i) => {
                const mg = ms.pct !== null ? getGrade(ms.pct) : null;
                return (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${ms.color}25`,
                    borderRadius: 10, padding: '10px 4px', textAlign: 'center',
                  }}>
                    <div style={{ fontFamily: T.mono, fontSize: 8, color: ms.color, letterSpacing: '0.08em', marginBottom: 4 }}>
                      {ms.tag}
                    </div>
                    <div style={{ fontFamily: T.font, fontWeight: 800, fontSize: 16, color: mg ? mg.color : 'rgba(255,255,255,0.2)', lineHeight: 1 }}>
                      {ms.pct !== null ? `${ms.pct}%` : '—'}
                    </div>
                    <div style={{ fontFamily: T.mono, fontSize: 8, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>
                      {mg ? mg.letter : 'N/A'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Divider */}
            <div style={{
              borderTop: '1px solid rgba(255,255,255,0.06)',
              paddingTop: 20, marginBottom: 0,
              display: 'flex', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: 8, alignItems: 'flex-end',
            }}>
              {cert && (
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontFamily: T.mono, fontSize: 8, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.15em', marginBottom: 3 }}>CERTIFICATE ID</div>
                  <div style={{ fontFamily: T.mono, fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>{cert.certId}</div>
                </div>
              )}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: T.mono, fontSize: 8, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.15em', marginBottom: 3 }}>ISSUED</div>
                <div style={{ fontFamily: T.mono, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{issuedDate.toUpperCase()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Action buttons ── */}
        <div className="no-print" style={{
          display: 'flex', gap: 10, marginTop: 20,
          flexWrap: 'wrap', justifyContent: 'center',
        }}>
          {/* LinkedIn — most prominent */}
          <LinkedInBtn cert={cert} user={user} pct={pct} verifyUrl={verifyUrl} />

          {/* Print */}
          <button onClick={() => window.print()} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: T.bg, border: `1px solid ${T.border2}`,
            color: T.muted, cursor: 'pointer', padding: '11px 20px', borderRadius: 8,
            fontSize: 13, fontFamily: T.font, fontWeight: 600, transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = T.text; e.currentTarget.style.borderColor = T.border; }}
            onMouseLeave={e => { e.currentTarget.style.color = T.muted; e.currentTarget.style.borderColor = T.border2; }}
          >
            🖨 Save as PDF
          </button>

          {/* Copy link */}
          {cert && (
            <button onClick={copyVerifyLink} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: copied ? 'rgba(5,150,105,0.08)' : T.bg,
              border: `1px solid ${copied ? 'rgba(5,150,105,0.35)' : T.border2}`,
              color: copied ? T.success : T.muted,
              cursor: 'pointer', padding: '11px 20px', borderRadius: 8,
              fontSize: 13, fontFamily: T.font, fontWeight: 600, transition: 'all 0.2s',
            }}>
              {copied ? '✓ Copied!' : '🔗 Copy Verify Link'}
            </button>
          )}

          {/* Verify online */}
          {cert && (
            <a href={verifyUrl} target="_blank" rel="noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: T.bg, border: `1px solid ${T.border2}`,
              color: T.muted, cursor: 'pointer', padding: '11px 20px', borderRadius: 8,
              fontSize: 13, fontFamily: T.font, fontWeight: 600, textDecoration: 'none',
              transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.color = T.text; e.currentTarget.style.borderColor = T.border; }}
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
            Certificate ID <strong style={{ color: T.muted }}>{cert.certId}</strong> — verifiable at{' '}
            <a href={verifyUrl} target="_blank" rel="noreferrer" style={{ color: T.dim }}>
              {typeof window !== 'undefined' ? window.location.origin : ''}{verifyUrl}
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
