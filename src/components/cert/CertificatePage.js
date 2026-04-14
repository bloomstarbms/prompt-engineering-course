'use client';
import { useState, useEffect } from 'react';
import { T, MOD_COLORS, getGrade } from '@/lib/theme';
import { MODULES, TOTAL_LESSONS } from '@/data/courseData';
import { issueCertificate, getUserCert } from '@/lib/auth';
import { AccentBtn } from '@/components/ui';

export default function CertificatePage({ user, quizScores, onBack }) {
  const [cert, setCert] = useState(null);
  const [copied, setCopied] = useState(false);

  const totalCorrect  = Object.values(quizScores).reduce((a, v) => a + v.score, 0);
  const totalPossible = Object.values(quizScores).reduce((a, v) => a + v.total, 0);
  const pct   = totalPossible > 0 ? Math.round(totalCorrect / totalPossible * 100) : 0;
  const grade = getGrade(pct);

  // Build module scores
  const moduleScores = MODULES.map((m, mi) => {
    let c = 0, t = 0;
    m.lessons.forEach((_, li) => {
      const s = quizScores[`${mi}-${li}`];
      if (s) { c += s.score; t += s.total; }
    });
    return { tag: m.tag, title: m.title, pct: t > 0 ? Math.round(c / t * 100) : null };
  });

  useEffect(() => {
    // Issue or retrieve cert
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
  }, [user.email]);

  function copyVerifyLink() {
    if (!cert) return;
    const url = `${window.location.origin}/verify/${cert.certId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  const verifyUrl = cert ? `/verify/${cert.certId}` : '';
  const issuedDate = cert
    ? new Date(cert.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div style={{ minHeight: '100vh', background: T.bg1, padding: 'clamp(24px,5vw,48px) clamp(16px,5vw,24px)' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>

        {/* Back */}
        <button onClick={onBack} className="no-print" style={{
          display: 'flex', alignItems: 'center', gap: 8, background: 'none',
          border: 'none', color: T.muted, cursor: 'pointer',
          fontFamily: T.font, fontSize: 13, padding: 0, marginBottom: 28,
        }}>← Back to Course</button>

        {/* Certificate Card */}
        <div className="cert-card" style={{
          background: T.bg, border: `1px solid ${T.border}`,
          borderRadius: 20, padding: 'clamp(36px,6vw,56px)',
          boxShadow: T.shadowXl,
          animation: 'certReveal 0.7s cubic-bezier(0.34,1.56,0.64,1) both',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Rainbow top bar */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 4,
            background: `linear-gradient(90deg, ${grade.color}, ${MOD_COLORS[1]}, ${MOD_COLORS[2]}, ${MOD_COLORS[3]})`,
          }} />

          {/* Corner ornaments */}
          {[
            { top: 18, left: 18, borderTop: true, borderLeft: true },
            { top: 18, right: 18, borderTop: true, borderRight: true },
            { bottom: 18, left: 18, borderBottom: true, borderLeft: true },
            { bottom: 18, right: 18, borderBottom: true, borderRight: true },
          ].map((c, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: c.top, bottom: c.bottom, left: c.left, right: c.right,
              width: 28, height: 28,
              borderTop:    c.borderTop    ? `1.5px solid ${grade.color}45` : undefined,
              borderBottom: c.borderBottom ? `1.5px solid ${grade.color}45` : undefined,
              borderLeft:   c.borderLeft   ? `1.5px solid ${grade.color}45` : undefined,
              borderRight:  c.borderRight  ? `1.5px solid ${grade.color}45` : undefined,
            }} />
          ))}

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: T.mono, fontSize: 10, color: T.dim, letterSpacing: '0.2em', marginBottom: 8 }}>
              CERTIFICATE OF COMPLETION
            </div>
            <div style={{ fontFamily: T.font, fontWeight: 800, fontSize: 'clamp(22px,4vw,30px)', color: T.text, letterSpacing: '-0.03em', marginBottom: 4 }}>
              Prompt Engineering
            </div>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 16, color: T.dim, marginBottom: 36 }}>
              Zero to Mastery · Full Course
            </div>

            <div style={{ fontFamily: T.mono, fontSize: 10, color: T.dim, letterSpacing: '0.15em', marginBottom: 12 }}>
              THIS CERTIFIES THAT
            </div>
            <div style={{
              fontFamily: T.serif, fontStyle: 'italic',
              fontSize: 'clamp(28px,5vw,46px)', color: grade.color,
              letterSpacing: '-0.01em', marginBottom: 14,
              animation: 'float 4s ease-in-out infinite',
            }}>
              {user.name}
            </div>
            <p style={{
              fontFamily: T.font, fontSize: 14, color: T.muted,
              lineHeight: 1.65, marginBottom: 36,
              maxWidth: 460, margin: '0 auto 36px',
            }}>
              has successfully completed all {TOTAL_LESSONS} lessons across {MODULES.length} modules,
              demonstrating proficiency in prompt engineering principles and techniques.
            </p>

            {/* Grade badge */}
            <div style={{
              display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
              background: `${grade.color}08`, border: `1.5px solid ${grade.color}28`,
              borderRadius: 16, padding: 'clamp(18px,3vw,24px) clamp(36px,5vw,52px)',
              marginBottom: 32,
            }}>
              <div style={{
                fontFamily: T.font, fontWeight: 800, fontSize: 64,
                color: grade.color, letterSpacing: '-0.04em', lineHeight: 1,
                animation: 'countPop 0.5s 0.3s cubic-bezier(0.34,1.56,0.64,1) both', opacity: 0,
              }}>
                {grade.letter}
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: grade.color, letterSpacing: '0.1em', marginTop: 6 }}>
                {grade.label}
              </div>
              <div style={{ fontFamily: T.font, fontWeight: 700, fontSize: 26, color: T.text, marginTop: 8 }}>{pct}%</div>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: T.dim }}>
                {totalCorrect} / {totalPossible} correct
              </div>
            </div>

            {/* Module breakdown */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(72px, 1fr))',
              gap: 8, marginBottom: 32,
            }}>
              {moduleScores.map((ms, i) => {
                const mg = ms.pct !== null ? getGrade(ms.pct) : null;
                return (
                  <div key={i} style={{
                    background: T.bg1, border: `1px solid ${T.border}`,
                    borderRadius: 10, padding: '10px 6px', textAlign: 'center',
                  }}>
                    <div style={{ fontFamily: T.mono, fontSize: 9, color: MOD_COLORS[i], letterSpacing: '0.08em', marginBottom: 4 }}>
                      {ms.tag}
                    </div>
                    <div style={{ fontFamily: T.font, fontWeight: 700, fontSize: 17, color: mg ? mg.color : T.faint }}>
                      {ms.pct !== null ? `${ms.pct}%` : '—'}
                    </div>
                    <div style={{ fontFamily: T.mono, fontSize: 9, color: T.dim }}>
                      {mg ? mg.letter : 'N/A'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cert ID + date */}
            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 20, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              {cert && (
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontFamily: T.mono, fontSize: 9, color: T.faint, letterSpacing: '0.1em', marginBottom: 3 }}>CERTIFICATE ID</div>
                  <div style={{ fontFamily: T.mono, fontSize: 12, color: T.muted, fontWeight: 700 }}>{cert.certId}</div>
                </div>
              )}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: T.mono, fontSize: 9, color: T.faint, letterSpacing: '0.1em', marginBottom: 3 }}>ISSUED</div>
                <div style={{ fontFamily: T.mono, fontSize: 12, color: T.muted }}>{issuedDate.toUpperCase()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="no-print" style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
          <AccentBtn onClick={() => window.print()} style={{ padding: '11px 22px' }}>
            🖨 Print Certificate
          </AccentBtn>
          {cert && (
            <button onClick={copyVerifyLink} style={{
              background: copied ? 'rgba(5,150,105,0.08)' : T.bg,
              border: `1px solid ${copied ? 'rgba(5,150,105,0.3)' : T.border2}`,
              color: copied ? T.success : T.muted, cursor: 'pointer',
              padding: '11px 22px', borderRadius: 8, fontSize: 13,
              fontFamily: T.font, fontWeight: 600, transition: 'all 0.2s',
            }}>
              {copied ? '✓ Link Copied!' : '🔗 Copy Verification Link'}
            </button>
          )}
          {cert && (
            <a href={verifyUrl} target="_blank" rel="noreferrer" style={{
              background: T.bg, border: `1px solid ${T.border2}`,
              color: T.muted, cursor: 'pointer', padding: '11px 22px', borderRadius: 8,
              fontSize: 13, fontFamily: T.font, fontWeight: 600,
              textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              ↗ Verify Online
            </a>
          )}
        </div>

        {cert && (
          <p className="no-print" style={{
            marginTop: 14, textAlign: 'center',
            fontFamily: T.font, fontSize: 12, color: T.faint, lineHeight: 1.6,
          }}>
            Share your certificate ID <strong style={{ color: T.muted }}>{cert.certId}</strong> or the verification link — anyone can confirm it&apos;s real.
          </p>
        )}
      </div>
    </div>
  );
}
