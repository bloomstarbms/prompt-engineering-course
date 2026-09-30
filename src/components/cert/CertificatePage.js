'use client';
import { useState, useEffect, useRef } from 'react';
import { T, MOD_COLORS, getGrade } from '@/lib/theme';
import { MODULES } from '@/data/courseData';
import { getUserCert } from '@/lib/db';
import CertificateFace, { getSiteOrigin, displayUrl } from '@/components/cert/CertificateFace';

/* ── LinkedIn button ──────────────────────────────────────── */
function LinkedInBtn({ cert, verifyUrl }) {
  if (!cert) return null;
  const issued = new Date(cert.issuedAt);
  const origin = getSiteOrigin();
  const params = new URLSearchParams({
    startTask:        'CERTIFICATION_NAME',
    // The course name, and nothing else. This string lands on someone's
    // LinkedIn profile as a credential, so it has to read as the name of a
    // thing they completed rather than as a marketing headline. It must also
    // match the certificate face and the /verify page exactly — a recruiter
    // comparing the three is the entire point of the verification link.
    name:             'Prompt Engineering',
    // The issuer, which is now the site name too — the codebase previously ran
    // two names in parallel, Prompten here and on the legal documents,
    // PromptMastery in the metadata and headers. Consolidated onto Prompten:
    // it matches the domain, and it is the name in the published privacy
    // policy, terms and about page, so consolidating in this direction never
    // edits a document users have already agreed to.
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

/* ══════════════════════════════════════════════════════════ */
/*  MAIN PAGE                                                 */
/* ══════════════════════════════════════════════════════════ */
export default function CertificatePage({ user, userId, quizScores, onBack, updateProfile, issueCertificate }) {
  const [cert,       setCert]       = useState(null);
  const [certLoading, setCertLoading] = useState(true); // true until cert fetch completes
  const [certError,  setCertError]  = useState('');    // set when issuance fails
  const [retryTick,  setRetryTick]  = useState(0);     // bumped by the retry button
  const [copied,     setCopied]     = useState(false);

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

  /* ── PDF FILENAME ────────────────────────────────────────────────────
     Chrome, Edge and Safari name a "Save as PDF" file after document.title.
     Without this the certificate saves as
     "Prompt Engineering — Master the Art of Prompting AI.pdf" — the landing
     page's marketing headline, on a file someone will attach to a job
     application. Swap the title for the duration of the print dialog and put
     it back afterwards.

     Restoring in afterprint is not optional: the dialog can be cancelled, and
     a title left rewritten would leak into the tab, the history entry and any
     bookmark made afterwards. The cleanup also runs on unmount, so navigating
     away mid-dialog cannot strand it either.

     Characters illegal in Windows filenames are stripped rather than replaced,
     because a name is user-supplied text and Chrome will silently mangle or
     truncate around them. The em dash is deliberate and safe. */
  useEffect(() => {
    if (!cert) return;
    const original = document.title;
    const safeName = String(cert.name || '').replace(/[\\/:*?"<>|]/g, '').trim();
    const printTitle = safeName
      ? `Prompten Certificate — ${safeName}`
      : 'Prompten Certificate';

    const before = () => { document.title = printTitle; };
    const after  = () => { document.title = original; };

    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
      document.title = original;   // unmount mid-dialog must not strand it
    };
  }, [cert]);

  useEffect(() => {
    if (!userId || !nameConfirmed) return;
    setCertLoading(true);
    setCertError('');
    async function fetchOrIssueCert() {
      try {
        const existing = await getUserCert(userId);
        if (existing) {
          setCert(existing);
        } else {
          // No arguments: the server derives the user from the bearer token
          // and computes name, scores and grade itself. Nothing the client
          // could send would be trusted, so nothing is sent.
          const newCert = await issueCertificate();
          setCert(newCert);
        }
      } catch (e) {
        // Surface the failure. Previously this only logged, which left the page
        // rendering a certificate that looked complete but had no credential
        // ID, no issue date, and a Save button stuck reading "Loading…".
        console.error('[CertificatePage] cert error', e);
        setCertError(e?.message || 'Your certificate could not be issued.');
      } finally {
        setCertLoading(false);
      }
    }
    fetchOrIssueCert();
  }, [userId, nameConfirmed, retryTick]); // eslint-disable-line react-hooks/exhaustive-deps

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

        @keyframes pmBlink {
          0%, 80%, 100% { opacity: 0.45; }
          40%            { opacity: 1; }
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
            /* Chrome / Edge / Safari — zoom scales both dimensions cleanly */
            zoom: 0.73 !important;
            page-break-inside: avoid !important;
            animation: none !important;
          }
          /* Firefox fallback: zoom is unsupported — use transform instead.
             We wrap in cert-print-scale so the negative margin collapses
             the dead space that transform leaves in the layout flow.      */
          @supports not (zoom: 1) {
            .cert-print-scale {
              display: block !important;
              overflow: hidden !important;
              /* Approx rendered height = card-height × 0.73.
                 We set a generous page-height limit so the card fits on one page. */
              height: 570px !important;
              width: 100% !important;
            }
            .cert-card {
              zoom: unset !important;
              transform: scale(0.73) !important;
              transform-origin: top left !important;
              /* Shift left to re-centre after origin offset */
              margin-left: calc(50% - 940px * 0.73 / 2) !important;
            }
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
          /* The course name in the disclaimer. Two rules deliberately:
             the class is the fix, matching how every other element here is
             handled; the descendant selector is a net for any <em> added to
             this paragraph later by someone who forgets the class. Neither
             alone is enough — the class can be omitted, and a bare descendant
             rule would leave the element outside the convention that made
             every other element printable. */
          .cert-body-em        { color: #4338ca !important; }
          .cert-body-text em   { color: #4338ca !important; }
          .cert-divider        { background: #e5e7eb !important; }
          .cert-ornament-line  { stroke: #a5b4fc !important; }

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

        {/* Loading overlay while cert is being issued/fetched */}
        {certLoading && (
          <div style={{
            textAlign: 'center', padding: '20px 0 8px',
            fontFamily: T.mono, fontSize: 11, color: T.dim,
            letterSpacing: '0.1em', animation: 'pmBlink 1.5s ease-in-out infinite',
          }}>
            Generating your certificate…
          </div>
        )}

        {/* ── Issuance failed: shown INSTEAD of the certificate ──
            Rendering the card here would show a plausible-looking certificate
            with a dash for the date and no credential ID, which is worse than
            showing nothing: it implies a certificate exists when none does. */}
        {certError && !cert && (
          <div style={{
            background: T.bg1, border: '1.5px solid rgba(248,113,113,0.35)',
            borderRadius: 14, padding: 'clamp(24px,4vw,32px)',
            textAlign: 'center', maxWidth: 520, margin: '8px auto 0',
          }}>
            <div style={{
              width: 46, height: 46, borderRadius: '50%', margin: '0 auto 14px',
              background: 'rgba(248,113,113,0.10)', border: '1.5px solid rgba(248,113,113,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, color: T.error, fontWeight: 700,
            }}>!</div>
            <div style={{ fontFamily: T.display, fontWeight: 700, fontSize: 18, color: T.text, marginBottom: 8 }}>
              We couldn&apos;t issue your certificate
            </div>
            <p style={{ fontFamily: T.font, fontSize: 13.5, color: T.muted, lineHeight: 1.7, margin: '0 0 20px' }}>
              Your course progress is saved — nothing has been lost. This is
              usually a temporary connection problem, so trying again normally
              works. If it keeps happening, get in touch and quote your account email.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => setRetryTick(t => t + 1)} disabled={certLoading} style={{
                background: T.accent, border: 'none', color: '#fff',
                padding: '11px 24px', borderRadius: 9, cursor: certLoading ? 'default' : 'pointer',
                fontFamily: T.font, fontWeight: 700, fontSize: 14, opacity: certLoading ? 0.6 : 1,
              }}>{certLoading ? 'Trying…' : 'Try again'}</button>
              <button onClick={onBack} style={{
                background: 'none', border: `1px solid ${T.border2}`, color: T.muted,
                padding: '11px 20px', borderRadius: 9, cursor: 'pointer',
                fontFamily: T.font, fontWeight: 600, fontSize: 14,
              }}>Back to course</button>
            </div>
            <div style={{ fontFamily: T.mono, fontSize: 10, color: T.faint, marginTop: 16, wordBreak: 'break-word' }}>
              {certError}
            </div>
          </div>
        )}

        {/* ══════════════════ CERTIFICATE CARD ══════════════════ */}
        {/* cert-print-scale is a no-op on screen; Firefox print uses it to
            collapse the extra layout space left by transform: scale().     */}
        {!(certError && !cert) && (
        <div className="cert-print-scale">
        <CertificateFace
          name={user.name}
          certId={cert?.certId}
          pct={pct}
          grade={grade}
          issuedDate={issuedDate}
          verifyUrl={verifyUrl}
        />
        </div>
        )}{/* /cert-print-scale */}

        {/* ══════════ ACTION BUTTONS ══════════ */}
        <div className="no-print" style={{
          display: 'flex', gap: 10, marginTop: 24,
          flexWrap: 'wrap', justifyContent: 'center',
        }}>
          <LinkedInBtn cert={cert} verifyUrl={verifyUrl}/>

          {/* Save as PDF — only enabled once the cert is fully loaded so the
              credential ID and issue date appear on the printed copy.       */}
          <button
            onClick={() => cert && window.print()}
            disabled={!cert}
            title={cert ? 'Save as PDF — works best in Chrome'
                        : certError ? 'Unavailable — no certificate was issued'
                        : 'Loading certificate…'}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: T.bg1, border: `1px solid ${T.border2}`,
              color: cert ? T.muted : T.faint,
              cursor: cert ? 'pointer' : 'not-allowed',
              padding: '11px 20px', borderRadius: 8,
              fontSize: 13, fontFamily: T.font, fontWeight: 600, transition: 'all 0.15s',
              opacity: cert ? 1 : 0.55,
            }}
            onMouseEnter={e => { if (cert) { e.currentTarget.style.color = T.text; e.currentTarget.style.borderColor = T.accent; } }}
            onMouseLeave={e => { if (cert) { e.currentTarget.style.color = T.muted; e.currentTarget.style.borderColor = T.border2; } }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
            </svg>
            {cert ? 'Save as PDF' : certError ? 'Unavailable' : 'Loading…'}
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
