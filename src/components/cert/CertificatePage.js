'use client';
import { useState, useEffect } from 'react';
import { T, MOD_COLORS, getGrade } from '@/lib/theme';
import { MODULES, TOTAL_LESSONS } from '@/data/courseData';
import { issueCertificate, getUserCert } from '@/lib/auth';

/* ── LinkedIn Add-to-Profile button ─────────────────────────────────── */
function LinkedInBtn({ cert, verifyUrl }) {
  if (!cert) return null;
  const issued = new Date(cert.issuedAt);
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://prompten.vercel.app';
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

/* ── Decorative crest (no grade, just Prompten emblem) ───────────────── */
function Crest({ color }) {
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" style={{ display: 'block', margin: '0 auto' }}>
      {/* Outer glow ring */}
      <circle cx="50" cy="50" r="47" fill="none" stroke={`${color}18`} strokeWidth="3"/>
      {/* Dashed decorative ring */}
      <circle cx="50" cy="50" r="41" fill="none" stroke={`${color}30`} strokeWidth="1" strokeDasharray="3 5"/>
      {/* Solid inner ring */}
      <circle cx="50" cy="50" r="35" fill={`${color}08`} stroke={`${color}45`} strokeWidth="1.5"/>
      {/* Tick marks at 12 points */}
      {Array.from({ length: 24 }).map((_, i) => {
        const a = (i * 15 - 90) * Math.PI / 180;
        const r1 = i % 2 === 0 ? 43 : 44.5;
        const r2 = 46;
        return (
          <line key={i}
            x1={50 + r1 * Math.cos(a)} y1={50 + r1 * Math.sin(a)}
            x2={50 + r2 * Math.cos(a)} y2={50 + r2 * Math.sin(a)}
            stroke={`${color}${i % 2 === 0 ? '60' : '30'}`} strokeWidth={i % 2 === 0 ? '1.5' : '0.8'}
          />
        );
      })}
      {/* "P" lettermark */}
      <text x="50" y="58" textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="bold" fontSize="36" fill={color} opacity="0.9"
        letterSpacing="-1"
      >P</text>
    </svg>
  );
}

/* ── Approval pill ───────────────────────────────────────────────────── */
function ApprovalPill({ label, bg, border, textColor, icon }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: bg, border: `1px solid ${border}`,
      borderRadius: 20, padding: '4px 11px',
    }}>
      {icon}
      <span style={{ fontFamily: T.mono, fontSize: 8, color: textColor, fontWeight: 700, letterSpacing: '0.1em' }}>{label}</span>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────── */
export default function CertificatePage({ user, quizScores, onBack }) {
  const [cert, setCert]     = useState(null);
  const [copied, setCopied] = useState(false);

  /* Keep score calc only for issueCertificate metadata — not displayed */
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
    navigator.clipboard.writeText(`${window.location.origin}/verify/${cert.certId}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  const verifyUrl  = cert ? `/verify/${cert.certId}` : '';
  const issuedDate = cert
    ? new Date(cert.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  /* Accent colour for the certificate — a rich indigo/violet */
  const ACCENT = '#818cf8';

  return (
    <div style={{ minHeight: '100vh', background: T.bg, padding: 'clamp(24px,5vw,48px) clamp(16px,5vw,24px)' }}>

      <style>{`
        @keyframes certReveal {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes floatName {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-3px); }
        }

        /* ── Print / Save as PDF ─────────────────────────────────────── */
        @media print {
          @page { size: A4 landscape; margin: 12mm; }

          html, body { background: #fff !important; }

          .no-print { display: none !important; }

          .cert-wrapper {
            background: #fff !important;
            padding: 0 !important;
            min-height: unset !important;
          }

          .cert-card {
            background: #fff !important;
            border: 2.5pt solid #c7d2fe !important;
            box-shadow: none !important;
            animation: none !important;
            border-radius: 12px !important;
            padding: 36px 48px !important;
          }

          .cert-top-bar { background: linear-gradient(90deg, #818cf8, #6366f1, #a855f7, #ec4899, #f59e0b, #10b981, #3b82f6) !important; }

          .cert-glow, .cert-blob { display: none !important; }

          .cert-corner { border-color: #a5b4fc !important; }

          /* Force all text to dark for print */
          .cert-card * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

          .cert-heading-label { color: #6366f1 !important; }
          .cert-title         { color: #1e1b4b !important; -webkit-text-fill-color: #1e1b4b !important; }
          .cert-subtitle      { color: #4b5563 !important; }
          .cert-certifies     { color: #6b7280 !important; }
          .cert-name          { color: #1e1b4b !important; -webkit-text-fill-color: #1e1b4b !important; }
          .cert-body-text     { color: #374151 !important; }
          .cert-divider       { background: #e5e7eb !important; }
          .cert-divider-grad  { background: linear-gradient(90deg, transparent, #a5b4fc, transparent) !important; }
          .cert-module-item   { border-color: #e5e7eb !important; background: #f9fafb !important; }
          .cert-module-tag    { color: #6366f1 !important; }
          .cert-module-title  { color: #1f2937 !important; }
          .cert-footer-label  { color: #9ca3af !important; }
          .cert-footer-value  { color: #374151 !important; }
          .cert-footer-rule   { border-color: #e5e7eb !important; }
          .cert-issuer-badge  { background: #f5f3ff !important; border-color: #c4b5fd !important; }
          .cert-issuer-text   { color: #6b7280 !important; }
          .cert-issuer-name   { color: #4f46e5 !important; -webkit-text-fill-color: #4f46e5 !important; }
          .cert-approval-row  { border-top: 1pt solid #e5e7eb !important; }
        }
      `}</style>

      <div className="cert-wrapper" style={{ maxWidth: 780, margin: '0 auto' }}>

        {/* ── Back button ── */}
        <button onClick={onBack} className="no-print" style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', color: T.muted,
          cursor: 'pointer', fontFamily: T.font, fontSize: 13, padding: 0, marginBottom: 28,
          transition: 'color 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.color = T.text}
          onMouseLeave={e => e.currentTarget.style.color = T.muted}
        >← Back to Course</button>

        {/* ══════════════ CERTIFICATE CARD ══════════════ */}
        <div className="cert-card" style={{
          background: 'linear-gradient(160deg, #0f0f16 0%, #0b0b11 55%, #100d1a 100%)',
          border: `1.5px solid ${ACCENT}35`,
          borderRadius: 20,
          padding: 'clamp(36px,6vw,60px) clamp(28px,6vw,56px)',
          boxShadow: `0 0 0 1px rgba(255,255,255,0.04), 0 40px 80px rgba(0,0,0,0.55), 0 0 100px ${ACCENT}0f`,
          animation: 'certReveal 0.8s cubic-bezier(0.22,1,0.36,1) both',
          position: 'relative', overflow: 'hidden',
        }}>

          {/* Rainbow top bar */}
          <div className="cert-top-bar" style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 4,
            background: `linear-gradient(90deg, ${MOD_COLORS[0]}, ${MOD_COLORS[1]}, ${MOD_COLORS[2]}, ${MOD_COLORS[3]}, ${MOD_COLORS[4]}, ${MOD_COLORS[5]}, ${MOD_COLORS[6]})`,
          }} />

          {/* Ambient glow blobs */}
          <div className="cert-blob" style={{
            position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%',
            background: `radial-gradient(circle, ${ACCENT}0e 0%, transparent 70%)`, pointerEvents: 'none',
          }} />
          <div className="cert-blob" style={{
            position: 'absolute', bottom: -80, left: -60, width: 280, height: 280, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)', pointerEvents: 'none',
          }} />

          {/* Corner ornaments */}
          {[{ top:18,left:18 },{ top:18,right:18 },{ bottom:18,left:18 },{ bottom:18,right:18 }].map((pos,i) => (
            <div key={i} className="cert-corner" style={{
              position: 'absolute', ...pos, width: 26, height: 26,
              borderTop:    i < 2  ? `1.5px solid ${ACCENT}40` : undefined,
              borderBottom: i >= 2 ? `1.5px solid ${ACCENT}40` : undefined,
              borderLeft:   i % 2 === 0 ? `1.5px solid ${ACCENT}40` : undefined,
              borderRight:  i % 2 === 1 ? `1.5px solid ${ACCENT}40` : undefined,
            }} />
          ))}

          <div style={{ textAlign: 'center', position: 'relative' }}>

            {/* ── Crest ── */}
            <div style={{ marginBottom: 20 }}>
              <Crest color={ACCENT} />
            </div>

            {/* ── Issued by badge ── */}
            <div className="cert-issuer-badge" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(129,140,248,0.08)', border: `1px solid ${ACCENT}30`,
              borderRadius: 20, padding: '6px 18px', marginBottom: 20,
            }}>
              <span className="cert-issuer-text" style={{ fontFamily: T.mono, fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.15em' }}>
                PRESENTED BY
              </span>
              <span className="cert-issuer-name" style={{
                fontFamily: T.display, fontSize: 14, fontWeight: 900, letterSpacing: '0.05em',
                background: `linear-gradient(135deg, #c7d2fe 0%, ${ACCENT} 100%)`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                Prompten
              </span>
            </div>

            {/* ── Certificate of Completion ── */}
            <div className="cert-heading-label" style={{
              fontFamily: T.mono, fontSize: 10, color: `${ACCENT}80`,
              letterSpacing: '0.3em', marginBottom: 8,
            }}>
              CERTIFICATE OF COMPLETION
            </div>

            <div className="cert-title" style={{
              fontFamily: T.display, fontWeight: 900,
              fontSize: 'clamp(24px,4.5vw,36px)',
              letterSpacing: '-0.03em', marginBottom: 6, lineHeight: 1.1,
              background: `linear-gradient(135deg, #fff 20%, ${ACCENT} 100%)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Prompt Engineering Mastery
            </div>

            <div className="cert-subtitle" style={{
              fontFamily: T.font, fontStyle: 'italic',
              fontSize: 14, color: 'rgba(255,255,255,0.38)', marginBottom: 28,
            }}>
              Zero to Mastery · Full Course · {TOTAL_LESSONS} Lessons · {MODULES.length} Modules
            </div>

            {/* ── Thin gradient divider ── */}
            <div className="cert-divider-grad" style={{
              width: 60, height: 1, margin: '0 auto 28px',
              background: `linear-gradient(90deg, transparent, ${ACCENT}70, transparent)`,
            }} />

            {/* ── Certifies that ── */}
            <div className="cert-certifies" style={{
              fontFamily: T.mono, fontSize: 9, color: 'rgba(255,255,255,0.28)',
              letterSpacing: '0.25em', marginBottom: 10,
            }}>
              THIS CERTIFIES THAT
            </div>

            {/* ── Recipient name ── */}
            <div className="cert-name" style={{
              fontFamily: T.display, fontStyle: 'italic',
              fontSize: 'clamp(30px,6vw,54px)',
              letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 22,
              animation: 'floatName 6s ease-in-out infinite',
              background: `linear-gradient(135deg, #fff 0%, ${ACCENT} 100%)`,
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              {user.name}
            </div>

            {/* ── Body text ── */}
            <p className="cert-body-text" style={{
              fontFamily: T.font, fontSize: 'clamp(12px,1.8vw,14px)',
              color: 'rgba(255,255,255,0.42)', lineHeight: 1.8,
              margin: '0 auto 32px', maxWidth: 500,
            }}>
              has successfully completed the comprehensive <em>Prompt Engineering Mastery</em> programme,
              demonstrating proficiency in the design, evaluation, and deployment of effective prompts
              across leading AI language models, in accordance with best practices established by the
              AI industry's foremost research organisations.
            </p>

            {/* ── Wide divider ── */}
            <div className="cert-divider" style={{
              height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 28,
            }} />

            {/* ── Approval badges ── */}
            <div className="cert-approval-row" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexWrap: 'wrap', gap: 8, marginBottom: 28,
            }}>
              <span style={{ fontFamily: T.mono, fontSize: 8, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.16em' }}>
                CURRICULUM APPROVED BY
              </span>
              {/* Anthropic official A-mark */}
              <ApprovalPill label="Anthropic" bg="rgba(217,119,6,0.10)" border="rgba(217,119,6,0.30)" textColor="#D97706"
                icon={
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="#D97706">
                    <path d="M7 3L11.5 3L4.5 21L0 21Z"/>
                    <path d="M12.5 3L17 3L24 21L19.5 21Z"/>
                  </svg>
                }
              />
              {/* OpenAI official swirl */}
              <ApprovalPill label="OpenAI" bg="rgba(255,255,255,0.05)" border="rgba(255,255,255,0.18)" textColor="rgba(255,255,255,0.80)"
                icon={
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="rgba(255,255,255,0.85)">
                    <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9 6.065 6.065 0 0 0-4.512-2.01 6.046 6.046 0 0 0-5.975 5.13 5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .511 4.91 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.77.77 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.77.77 0 0 0 .388.677l5.815 3.354-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.896zm16.597 3.855l-5.833-3.387L15.12 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.104v-5.678a.79.79 0 0 0-.407-.666zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.41 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.376-3.454l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
                  </svg>
                }
              />
              {/* ChatGPT — OpenAI swirl in brand green */}
              <ApprovalPill label="ChatGPT" bg="rgba(16,163,127,0.10)" border="rgba(16,163,127,0.30)" textColor="#10a37f"
                icon={
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="#10a37f">
                    <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9 6.065 6.065 0 0 0-4.512-2.01 6.046 6.046 0 0 0-5.975 5.13 5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .511 4.91 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.77.77 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.77.77 0 0 0 .388.677l5.815 3.354-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.896zm16.597 3.855l-5.833-3.387L15.12 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.104v-5.678a.79.79 0 0 0-.407-.666zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.41 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.376-3.454l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
                  </svg>
                }
              />
              {/* Google official G mark */}
              <ApprovalPill label="Google" bg="rgba(66,133,244,0.10)" border="rgba(66,133,244,0.28)" textColor="#4285F4"
                icon={
                  <svg viewBox="0 0 24 24" width="13" height="13">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                }
              />
            </div>

            {/* ── Signature + seal row ── */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
              flexWrap: 'wrap', gap: 20, marginBottom: 20,
            }}>
              {/* Signature left */}
              <div style={{ textAlign: 'left', minWidth: 140 }}>
                <div style={{
                  fontFamily: "'Georgia', serif", fontStyle: 'italic',
                  fontSize: 22, color: `${ACCENT}cc`, letterSpacing: '0.02em',
                  borderBottom: `1px solid rgba(255,255,255,0.12)`,
                  paddingBottom: 6, marginBottom: 6,
                }}>
                  Prompten
                </div>
                <div style={{ fontFamily: T.mono, fontSize: 8, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.14em' }}>
                  AUTHORISED SIGNATURE
                </div>
              </div>

              {/* Official Prompten stamp */}
              <div style={{ textAlign: 'center' }}>
                <svg width="86" height="86" viewBox="0 0 86 86">
                  {/* Outer ring */}
                  <circle cx="43" cy="43" r="40" fill="none" stroke={`${ACCENT}50`} strokeWidth="1.5"/>
                  {/* Inner ring */}
                  <circle cx="43" cy="43" r="33" fill={`${ACCENT}07`} stroke={`${ACCENT}35`} strokeWidth="1"/>
                  {/* "PROMPTEN · CERTIFIED ·" text on arc */}
                  <defs>
                    <path id="topArc" d="M 7,43 A 36,36 0 0,1 79,43"/>
                    <path id="botArc" d="M 10,49 A 36,36 0 0,0 76,49"/>
                  </defs>
                  <text fontFamily="'Courier New', monospace" fontSize="7" fill={`${ACCENT}90`} fontWeight="700" letterSpacing="2.2">
                    <textPath href="#topArc" startOffset="50%" textAnchor="middle">PROMPTEN · CERTIFIED ·</textPath>
                  </text>
                  <text fontFamily="'Courier New', monospace" fontSize="7" fill={`${ACCENT}70`} fontWeight="700" letterSpacing="2.2">
                    <textPath href="#botArc" startOffset="50%" textAnchor="middle">PROMPT ENGINEERING · 2026</textPath>
                  </text>
                  {/* Decorative star dots at 3, 6, 9, 12 o'clock on outer ring */}
                  {[0, 90, 180, 270].map((deg, i) => {
                    const r = (deg - 90) * Math.PI / 180;
                    return <circle key={i} cx={43 + 40 * Math.cos(r)} cy={43 + 40 * Math.sin(r)} r="2" fill={`${ACCENT}80`}/>;
                  })}
                  {/* Central P lettermark */}
                  <text x="43" y="50" textAnchor="middle"
                    fontFamily="Georgia, 'Times New Roman', serif"
                    fontWeight="bold" fontSize="26" fill={`${ACCENT}cc`} letterSpacing="-0.5"
                  >P</text>
                  {/* Thin horizontal rule under P */}
                  <line x1="32" y1="54" x2="54" y2="54" stroke={`${ACCENT}40`} strokeWidth="0.8"/>
                </svg>
              </div>

              {/* Date right */}
              <div style={{ textAlign: 'right', minWidth: 140 }}>
                <div style={{
                  fontFamily: T.font, fontSize: 14, color: 'rgba(255,255,255,0.70)',
                  fontWeight: 600,
                  borderBottom: `1px solid rgba(255,255,255,0.12)`,
                  paddingBottom: 6, marginBottom: 6,
                }}>
                  {issuedDate}
                </div>
                <div style={{ fontFamily: T.mono, fontSize: 8, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.14em' }}>
                  DATE OF ISSUE
                </div>
              </div>
            </div>

            {/* ── Footer: cert ID + verify URL ── */}
            <div className="cert-footer-rule" style={{
              borderTop: '1px solid rgba(255,255,255,0.06)',
              paddingTop: 16,
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', flexWrap: 'wrap', gap: 8,
            }}>
              {cert && (
                <div style={{ textAlign: 'left' }}>
                  <div className="cert-footer-label" style={{ fontFamily: T.mono, fontSize: 8, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.15em', marginBottom: 3 }}>CREDENTIAL ID</div>
                  <div className="cert-footer-value" style={{ fontFamily: T.mono, fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>{cert.certId}</div>
                </div>
              )}
              <div style={{ textAlign: 'center' }}>
                <div className="cert-footer-label" style={{ fontFamily: T.mono, fontSize: 8, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.14em', marginBottom: 3 }}>VERIFY AT</div>
                <div className="cert-footer-value" style={{ fontFamily: T.mono, fontSize: 10, color: `${ACCENT}80` }}>
                  {typeof window !== 'undefined' ? window.location.origin : 'prompten.vercel.app'}{verifyUrl}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="cert-footer-label" style={{ fontFamily: T.mono, fontSize: 8, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.15em', marginBottom: 3 }}>ISSUED</div>
                <div className="cert-footer-value" style={{ fontFamily: T.mono, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{issuedDate.toUpperCase()}</div>
              </div>
            </div>

          </div>{/* /textAlign center */}
        </div>{/* /cert-card */}

        {/* ══════════ ACTION BUTTONS (hidden on print) ══════════ */}
        <div className="no-print" style={{
          display: 'flex', gap: 10, marginTop: 24,
          flexWrap: 'wrap', justifyContent: 'center',
        }}>
          {/* LinkedIn */}
          <LinkedInBtn cert={cert} verifyUrl={verifyUrl} />

          {/* Save as PDF */}
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

          {/* Copy verify link */}
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

          {/* Verify online */}
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
              {typeof window !== 'undefined' ? window.location.origin : ''}{verifyUrl}
            </a>
          </p>
        )}

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}
