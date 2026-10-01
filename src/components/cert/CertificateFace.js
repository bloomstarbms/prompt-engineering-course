'use client';
import { T, MOD_COLORS } from '@/lib/theme';
import { MODULES, TOTAL_LESSONS } from '@/data/courseData';
import { SITE_URL } from '@/lib/seo';

/**
 * The certificate face: the card itself, and nothing about issuing it.
 *
 * Lifted out of CertificatePage.js (which keeps issuance, the name gate, the
 * print sheet and the action buttons) so the SAME component can render the
 * sample on the landing page. A lookalike would have been a second copy of
 * this design, and the two would drift; this is the one copy.
 *
 * Props are the values the face reads, and only those:
 *   name        text on the certificate. The page passes the live profile
 *               name, as it always has.
 *   certId      shown in the footer when present
 *   pct, grade  the badges; both omitted when either is missing (the sample
 *               has no score)
 *   issuedDate  preformatted string, or null ("—")
 *   verifyUrl   path; shown through displayUrl()
 *   sample      adds a SAMPLE mark across the corner
 *   animate     the reveal animation (on by default)
 *
 * The <style> here holds only what the face needs anywhere it renders: its
 * three keyframes and .cert-body-em. Playfair Display is self-hosted via
 * next/font (app/layout.js) and reached as var(--playfair). The print sheet
 * stays in CertificatePage.js: it sets @page and html/body for printing, and
 * the landing page must not inherit that.
 */

const ACCENT  = '#818cf8';
const ACCENT2 = '#a5b4fc';

/* ── Site origin ──────────────────────────────────────────── */
function getSiteOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}
/**
 * The verify line printed ON the certificate. Built from SITE_URL, not from
 * window.location: this face is server-rendered on the landing page (the
 * sample), and window does not exist there. Using the origin gave the server
 * "/verify/…" and the client "www.prompten.xyz/verify/…" — a hydration
 * mismatch on the home page. SITE_URL is the same string on both sides, and
 * in production it is the host the origin would have been anyway.
 * getSiteOrigin() stays for click-time uses (copy link, LinkedIn).
 */
function displayUrl(path) {
  return SITE_URL.replace(/^https?:\/\//, '') + path;
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
        <textPath href={`#seal-bot-${size}`} startOffset="50%" textAnchor="middle">{`PROMPT ENGINEERING · ${new Date().getFullYear()}`}</textPath>
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

export { getSiteOrigin, displayUrl };

export default function CertificateFace({ name, certId, pct, grade, issuedDate, verifyUrl, sample = false, animate = true }) {
  return (
    <>
      {/* dangerouslySetInnerHTML, not a text child: React escapes text children
          (the apostrophes and ampersand in the @import URL become &#x27; and
          &amp; in the server HTML) and then reports a hydration mismatch against
          the unescaped client text. Same CSS either way; this way it hydrates. */}
      <style dangerouslySetInnerHTML={{ __html: `
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
        /* The course name inside the disclaimer sentence. Screen appearance is
           unchanged from when this was an inline style — white at 55% on the
           dark card — but it now lives in the stylesheet where the print block
           can override it. See the comment at the markup. */
        .cert-body-em {
          color: rgba(255,255,255,0.55);
          font-style: italic;
        }
      ` }} />
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
      animation: animate ? 'certReveal 0.85s cubic-bezier(0.22,1,0.36,1) both' : undefined,
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
            fontFamily: 'var(--playfair), Georgia, serif',
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
          fontFamily: 'var(--playfair), Georgia, serif',
          fontWeight: 900, fontSize: 'clamp(28px,4.5vw,40px)',
          letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 8,
          background: `linear-gradient(135deg, #ffffff 0%, ${ACCENT2} 55%, #c4b5fd 100%)`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          Prompt Engineering
        </div>

        <div className="cert-course-sub" style={{
          fontFamily: T.font, fontStyle: 'italic',
          fontSize: 13, color: 'rgba(255,255,255,0.32)', marginBottom: 18,
          letterSpacing: '0.02em',
        }}>
          {TOTAL_LESSONS} Lessons &nbsp;·&nbsp; {MODULES.length} Modules &nbsp;·&nbsp; Full Programme
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
            fontFamily: 'var(--playfair), Georgia, serif',
            fontStyle: 'italic', fontWeight: 700,
            fontSize: 'clamp(34px,6vw,58px)',
            letterSpacing: '-0.01em', lineHeight: 1.1,
            background: `linear-gradient(120deg, #ffffff 0%, ${ACCENT2} 40%, #e0e7ff 70%, ${ACCENT} 100%)`,
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            animation: 'shimmerName 8s ease-in-out infinite',
          }}>
            {name}
          </div>
        </div>

        {/* ── Grade + Score badges ── */}
        {grade && pct != null && <GradeRow grade={grade} pct={pct}/>}

        {/* ── Body description ── */}
        <p className="cert-body-text" style={{
          fontFamily: T.font,
          fontSize: 'clamp(12px,1.7vw,13.5px)',
          color: 'rgba(255,255,255,0.38)',
          lineHeight: 1.85, margin: '0 auto 22px',
          maxWidth: 560,
        }}>
          has completed the{' '}
          {/* Must match the course title above it, the LinkedIn credential
              name and the /verify page. It is the same certificate naming
              itself twice; the two saying different things is the one
              inconsistency a reader is guaranteed to notice.

              CLASSED, NOT INLINE-STYLED, and that is the fix for a real
              bug rather than a preference. This element used to carry
              `style={{ color: 'rgba(255,255,255,0.55)' }}` and no class.
              The print sheet turns the card white and overrides the parent
              paragraph via .cert-body-text — but `color` does not cascade
              into a child that sets its own, and no print selector could
              reach an unclassed element. Result: white text at 55% opacity
              on white paper. The course name was in the PDF's text layer
              and never painted, so the certificate read "has completed the
              ⟨blank⟩ programme" and looked like an unfilled template.

              Every other styled element in this card carries a cert-* class
              precisely so the print block can reach it. This one opted out.
              Do not put a colour in an inline style here. */}
          <em className="cert-body-em">Prompt Engineering</em>{' '}
          programme, covering the design, evaluation and deployment of prompts
          across current AI language models. Prompten is an independent
          educational provider and is not affiliated with, endorsed by, or
          accredited by any AI model provider.
        </p>

        {/* ── Full-width divider ── */}
        <div className="cert-divider" style={{
          height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 18,
        }}/>

        {/* Vendor approval badges removed: four logos under "CURRICULUM ALIGNED
            WITH" read as endorsement by companies that endorse nothing here.
            The landing page lists the actual source documents instead. */}

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
              fontFamily: 'var(--playfair), Georgia, serif',
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
          {certId && (
            <div style={{ textAlign: 'left' }}>
              <div className="cert-footer-label" style={{ fontFamily: T.mono, fontSize: 7.5, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.16em', marginBottom: 3 }}>
                CREDENTIAL ID
              </div>
              <div className="cert-footer-value" style={{ fontFamily: T.mono, fontSize: 10.5, color: 'rgba(255,255,255,0.45)', fontWeight: 700 }}>
                {certId}
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
        {sample && (
          /* A ribbon across the top-right corner. Visible text, not aria-hidden:
             a screen reader should hear that this is a sample too. */
          <div className="cert-sample-mark" style={{
            position: 'absolute', top: 26, right: -44, transform: 'rotate(45deg)',
            background: 'rgba(129,140,248,0.18)', border: '1px solid rgba(129,140,248,0.45)',
            color: '#c7d2fe', fontFamily: T.mono, fontSize: 10, letterSpacing: '0.3em',
            padding: '5px 56px', pointerEvents: 'none',
          }}>SAMPLE</div>
        )}
        </div>{/* /cert-card */}
    </>
  );
}
