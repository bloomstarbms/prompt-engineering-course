'use client';
import { useState, useEffect } from 'react';
import { getCertificateById } from '@/lib/db';
import { getGrade, MOD_COLORS, T } from '@/lib/theme';
import { TOTAL_LESSONS } from '@/data/courseData';
import Link from 'next/link';

export default function VerifyClient({ certId }) {
  const [cert, setCert]   = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function fetchCert() {
      try {
        /* 1. Try Supabase first (works for everyone, any device) */
        let found = await getCertificateById(certId);

        /* 2. Fall back to URL-embedded data for older certificates
              issued before the Supabase migration */
        if (!found && typeof window !== 'undefined') {
          try {
            const params = new URLSearchParams(window.location.search);
            const raw = params.get('d');
            if (raw) {
              const decoded = JSON.parse(atob(raw));
              if (decoded.certId === certId) found = decoded;
            }
          } catch { /* malformed URL data */ }
        }

        setCert(found);
      } catch (e) {
        console.error('[VerifyClient]', e);
        setCert(null);
      }
      setReady(true);
    }
    fetchCert();
  }, [certId]);

  if (!ready) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: T.mono, fontSize: 12, color: T.dim }}>Verifying…</div>
      </div>
    );
  }

  const issuedDate = cert
    ? new Date(cert.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <div style={{
      minHeight: '100vh', background: T.bg1,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: 'clamp(24px,5vw,48px) clamp(16px,5vw,24px)',
      fontFamily: T.font,
    }}>
      <div style={{ width: '100%', maxWidth: 560 }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(129,140,248,0.10)', border: '1px solid rgba(129,140,248,0.25)',
            borderRadius: 100, padding: '5px 14px', marginBottom: 16,
          }}>
            <span style={{ fontFamily: T.mono, fontSize: 11, color: T.accent, letterSpacing: '0.1em' }}>
              CERTIFICATE VERIFICATION
            </span>
          </div>
          <div style={{ fontFamily: T.font, fontWeight: 800, fontSize: 22, color: T.text, letterSpacing: '-0.03em' }}>
            PromptMastery
          </div>
        </div>

        {cert ? (
          /* ── VALID ── */
          <div style={{
            background: T.bg, border: `1.5px solid rgba(5,150,105,0.35)`,
            borderRadius: 16, overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(5,150,105,0.10)',
          }}>
            {/* Green header */}
            <div style={{
              background: 'rgba(5,150,105,0.08)', borderBottom: '1px solid rgba(5,150,105,0.2)',
              padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(5,150,105,0.15)', border: '1.5px solid rgba(5,150,105,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
              }}>✓</div>
              <div>
                <div style={{ fontFamily: T.font, fontWeight: 700, fontSize: 15, color: '#059669' }}>
                  Certificate Verified
                </div>
                <div style={{ fontFamily: T.mono, fontSize: 10, color: T.dim, marginTop: 1 }}>
                  This certificate is authentic
                </div>
              </div>
            </div>

            {/* Cert details */}
            <div style={{ padding: '28px 24px' }}>
              {/* Name */}
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ fontFamily: T.mono, fontSize: 10, color: T.dim, letterSpacing: '0.12em', marginBottom: 8 }}>
                  AWARDED TO
                </div>
                <div style={{
                  fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: 'italic',
                  fontSize: 'clamp(28px,5vw,38px)', color: T.text, letterSpacing: '-0.01em',
                }}>
                  {cert.name}
                </div>
              </div>

              {/* Course */}
              <div style={{
                background: T.bg1, borderRadius: 10, padding: '14px 18px',
                marginBottom: 20, textAlign: 'center',
              }}>
                <div style={{ fontFamily: T.font, fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 3 }}>
                  Prompt Engineering: Zero to Mastery
                </div>
                <div style={{ fontFamily: T.font, fontSize: 13, color: T.muted }}>
                  Full course completion · All {TOTAL_LESSONS} lessons
                </div>
              </div>

              {/* Grade + score */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
                {[
                  { label: 'FINAL GRADE', value: cert.grade, color: getGrade(cert.pct).color },
                  { label: 'SCORE', value: `${cert.pct}%`, color: T.text },
                  { label: 'ISSUED', value: cert ? new Date(cert.issuedAt).getFullYear().toString() : null, color: T.text },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{
                    background: T.bg1, borderRadius: 8, padding: '12px 8px', textAlign: 'center',
                    border: `1px solid ${T.border}`,
                  }}>
                    <div style={{ fontFamily: T.mono, fontSize: 9, color: T.dim, letterSpacing: '0.08em', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontFamily: T.font, fontWeight: 800, fontSize: 18, color }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Module breakdown */}
              {cert.moduleScores && (
                <div>
                  <div style={{ fontFamily: T.mono, fontSize: 10, color: T.dim, letterSpacing: '0.1em', marginBottom: 10 }}>
                    MODULE SCORES
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(64px,1fr))', gap: 6 }}>
                    {cert.moduleScores.map((ms, i) => {
                      const mg = ms.pct !== null ? getGrade(ms.pct) : null;
                      return (
                        <div key={i} style={{
                          background: T.bg1, border: `1px solid ${T.border}`,
                          borderRadius: 8, padding: '8px 4px', textAlign: 'center',
                        }}>
                          <div style={{ fontFamily: T.mono, fontSize: 8, color: ms.color || MOD_COLORS[i] || T.accent, marginBottom: 3 }}>
                            {ms.tag}
                          </div>
                          <div style={{ fontFamily: T.font, fontWeight: 700, fontSize: 14, color: mg ? mg.color : T.faint }}>
                            {ms.pct !== null ? `${ms.pct}%` : '—'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Cert ID */}
              <div style={{
                marginTop: 20, paddingTop: 16, borderTop: `1px solid ${T.border}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8,
              }}>
                <div>
                  <div style={{ fontFamily: T.mono, fontSize: 9, color: T.faint, letterSpacing: '0.1em', marginBottom: 3 }}>
                    CERTIFICATE ID
                  </div>
                  <div style={{ fontFamily: T.mono, fontSize: 12, color: T.muted, fontWeight: 700 }}>
                    {cert.certId}
                  </div>
                </div>
                <div style={{ fontFamily: T.mono, fontSize: 10, color: T.dim }}>
                  {issuedDate?.toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ── INVALID ── */
          <div style={{
            background: T.bg, border: `1.5px solid rgba(220,38,38,0.3)`,
            borderRadius: 16, overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(220,38,38,0.08)',
          }}>
            <div style={{
              background: 'rgba(220,38,38,0.06)', borderBottom: '1px solid rgba(220,38,38,0.2)',
              padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(220,38,38,0.1)', border: '1.5px solid rgba(220,38,38,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
              }}>✗</div>
              <div>
                <div style={{ fontFamily: T.font, fontWeight: 700, fontSize: 15, color: '#DC2626' }}>
                  Certificate Not Found
                </div>
                <div style={{ fontFamily: T.mono, fontSize: 10, color: T.dim, marginTop: 1 }}>
                  This ID does not match any issued certificate
                </div>
              </div>
            </div>
            <div style={{ padding: '28px 24px', textAlign: 'center' }}>
              <div style={{ fontFamily: T.mono, fontSize: 12, color: T.muted, marginBottom: 6, wordBreak: 'break-all' }}>
                ID checked: <strong>{certId}</strong>
              </div>
              <p style={{ fontFamily: T.font, fontSize: 13, color: T.muted, lineHeight: 1.6 }}>
                If you believe this is an error, ensure the certificate ID is copied exactly as shown on the certificate.
              </p>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link href="/" style={{
            fontFamily: T.font, fontSize: 13, color: T.accent,
            textDecoration: 'none', fontWeight: 600,
          }}>
            ← Back to PromptMastery
          </Link>
        </div>
      </div>
    </div>
  );
}
