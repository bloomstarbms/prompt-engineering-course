'use client';
import { T, MOD_COLORS } from '@/lib/theme';
import { MODULES, TOTAL_LESSONS } from '@/data/courseData';
import { AccentBtn } from '@/components/ui';

export default function Landing({ onStart, onLogin }) {
  return (
    <div style={{ minHeight: '100vh', background: T.bg, overflowX: 'hidden' }}>

      {/* ── Top nav ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(9,9,11,0.85)', backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${T.border}`,
        padding: '0 clamp(16px,5vw,48px)', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7, background: T.accentLight,
            border: `1px solid ${T.accentBorder}`, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontFamily: T.mono, fontSize: 13, color: T.accent, fontWeight: 700,
          }}>PE</div>
          <span style={{ fontFamily: T.font, fontWeight: 700, fontSize: 14, color: T.text }}>
            PromptMastery
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onLogin} style={{
            background: 'none', border: `1px solid ${T.border}`, color: T.muted,
            padding: '7px 16px', borderRadius: 7, cursor: 'pointer',
            fontFamily: T.font, fontWeight: 600, fontSize: 13, transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.border2; e.currentTarget.style.color = T.text; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}
          >
            Log In
          </button>
          <AccentBtn onClick={onStart} size="sm">Get Started</AccentBtn>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.18) 0%, transparent 70%), linear-gradient(180deg, #101014 0%, #09090b 100%)',
        borderBottom: `1px solid ${T.border}`,
        padding: 'clamp(64px,10vw,120px) clamp(20px,6vw,80px)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* AI / Neural-network decorative background */}
        <svg
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            opacity: 0.09, pointerEvents: 'none', userSelect: 'none',
          }}
          viewBox="0 0 900 520" preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Connection lines */}
          <g stroke="#818cf8" strokeWidth="0.8" opacity="0.7">
            {/* Layer 0 → Layer 1 */}
            <line x1="80" y1="120" x2="260" y2="80"/><line x1="80" y1="120" x2="260" y2="180"/>
            <line x1="80" y1="120" x2="260" y2="280"/><line x1="80" y1="120" x2="260" y2="380"/>
            <line x1="80" y1="260" x2="260" y2="80"/><line x1="80" y1="260" x2="260" y2="180"/>
            <line x1="80" y1="260" x2="260" y2="280"/><line x1="80" y1="260" x2="260" y2="380"/>
            <line x1="80" y1="400" x2="260" y2="80"/><line x1="80" y1="400" x2="260" y2="180"/>
            <line x1="80" y1="400" x2="260" y2="280"/><line x1="80" y1="400" x2="260" y2="380"/>
            {/* Layer 1 → Layer 2 */}
            <line x1="260" y1="80"  x2="450" y2="60"/><line x1="260" y1="80"  x2="450" y2="160"/>
            <line x1="260" y1="80"  x2="450" y2="260"/><line x1="260" y1="80"  x2="450" y2="360"/>
            <line x1="260" y1="80"  x2="450" y2="460"/>
            <line x1="260" y1="180" x2="450" y2="60"/><line x1="260" y1="180" x2="450" y2="160"/>
            <line x1="260" y1="180" x2="450" y2="260"/><line x1="260" y1="180" x2="450" y2="360"/>
            <line x1="260" y1="180" x2="450" y2="460"/>
            <line x1="260" y1="280" x2="450" y2="60"/><line x1="260" y1="280" x2="450" y2="160"/>
            <line x1="260" y1="280" x2="450" y2="260"/><line x1="260" y1="280" x2="450" y2="360"/>
            <line x1="260" y1="380" x2="450" y2="160"/><line x1="260" y1="380" x2="450" y2="260"/>
            <line x1="260" y1="380" x2="450" y2="360"/><line x1="260" y1="380" x2="450" y2="460"/>
            {/* Layer 2 → Layer 3 */}
            <line x1="450" y1="60"  x2="640" y2="120"/><line x1="450" y1="60"  x2="640" y2="260"/>
            <line x1="450" y1="60"  x2="640" y2="400"/>
            <line x1="450" y1="160" x2="640" y2="120"/><line x1="450" y1="160" x2="640" y2="260"/>
            <line x1="450" y1="160" x2="640" y2="400"/>
            <line x1="450" y1="260" x2="640" y2="120"/><line x1="450" y1="260" x2="640" y2="260"/>
            <line x1="450" y1="260" x2="640" y2="400"/>
            <line x1="450" y1="360" x2="640" y2="120"/><line x1="450" y1="360" x2="640" y2="260"/>
            <line x1="450" y1="360" x2="640" y2="400"/>
            <line x1="450" y1="460" x2="640" y2="260"/><line x1="450" y1="460" x2="640" y2="400"/>
            {/* Layer 3 → Layer 4 */}
            <line x1="640" y1="120" x2="820" y2="200"/><line x1="640" y1="120" x2="820" y2="320"/>
            <line x1="640" y1="260" x2="820" y2="200"/><line x1="640" y1="260" x2="820" y2="320"/>
            <line x1="640" y1="400" x2="820" y2="200"/><line x1="640" y1="400" x2="820" y2="320"/>
          </g>
          {/* Highlighted active-path lines */}
          <g stroke="#c084fc" strokeWidth="1.4" opacity="0.5">
            <line x1="80" y1="260" x2="260" y2="180"/>
            <line x1="260" y1="180" x2="450" y2="260"/>
            <line x1="450" y1="260" x2="640" y2="260"/>
            <line x1="640" y1="260" x2="820" y2="320"/>
          </g>
          {/* Nodes — Layer 0 (input) */}
          <g fill="#6366f1">
            <circle cx="80" cy="120" r="7"/><circle cx="80" cy="260" r="7"/><circle cx="80" cy="400" r="7"/>
          </g>
          {/* Nodes — Layer 1 */}
          <g fill="#818cf8">
            <circle cx="260" cy="80"  r="6"/><circle cx="260" cy="180" r="6"/>
            <circle cx="260" cy="280" r="6"/><circle cx="260" cy="380" r="6"/>
          </g>
          {/* Nodes — Layer 2 */}
          <g fill="#818cf8">
            <circle cx="450" cy="60"  r="6"/><circle cx="450" cy="160" r="6"/>
            <circle cx="450" cy="260" r="6"/><circle cx="450" cy="360" r="6"/>
            <circle cx="450" cy="460" r="6"/>
          </g>
          {/* Nodes — Layer 3 */}
          <g fill="#818cf8">
            <circle cx="640" cy="120" r="6"/><circle cx="640" cy="260" r="6"/><circle cx="640" cy="400" r="6"/>
          </g>
          {/* Nodes — Layer 4 (output) */}
          <g fill="#a78bfa">
            <circle cx="820" cy="200" r="8"/><circle cx="820" cy="320" r="8"/>
          </g>
          {/* Highlighted active nodes */}
          <circle cx="80"  cy="260" r="8"  fill="none" stroke="#c084fc" strokeWidth="2"/>
          <circle cx="260" cy="180" r="7"  fill="none" stroke="#c084fc" strokeWidth="2"/>
          <circle cx="450" cy="260" r="7"  fill="none" stroke="#c084fc" strokeWidth="2"/>
          <circle cx="640" cy="260" r="7"  fill="none" stroke="#c084fc" strokeWidth="2"/>
          <circle cx="820" cy="320" r="9"  fill="none" stroke="#c084fc" strokeWidth="2.5"/>
          {/* Small floating particles */}
          <circle cx="160" cy="340" r="2" fill="#6366f1" opacity="0.5"/>
          <circle cx="355" cy="130" r="1.5" fill="#818cf8" opacity="0.4"/>
          <circle cx="550" cy="430" r="2" fill="#a78bfa" opacity="0.45"/>
          <circle cx="730" cy="80"  r="1.5" fill="#818cf8" opacity="0.35"/>
        </svg>
        <div style={{ maxWidth: 960, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: T.accentLight, border: `1px solid ${T.accentBorder}`,
            borderRadius: 100, padding: '6px 14px', marginBottom: 28,
            animation: 'fadeUp 0.5s ease both',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.accent, display: 'block', animation: 'pulse 2s infinite' }} />
            <span style={{ fontFamily: T.mono, fontSize: 11, color: T.accent, letterSpacing: '0.1em' }}>
              FREE · SELF-PACED · CERTIFICATE INCLUDED
            </span>
          </div>

          <h1 style={{
            fontFamily: T.display, fontWeight: 700,
            fontSize: 'clamp(40px,7.5vw,84px)', lineHeight: 0.95,
            letterSpacing: '-0.04em', color: T.text,
            marginBottom: 10, animation: 'fadeUp 0.5s 0.08s ease both', opacity: 0,
          }}>
            Master the Art of
          </h1>
          <h1 style={{
            fontFamily: T.serif, fontStyle: 'italic', fontWeight: 400,
            fontSize: 'clamp(40px,7.5vw,84px)', lineHeight: 0.95,
            letterSpacing: '-0.02em', marginBottom: 28,
            background: 'linear-gradient(120deg, #818cf8 0%, #c084fc 40%, #818cf8 100%)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            animation: 'fadeUp 0.5s 0.14s ease both, shimmer 5s linear infinite',
            opacity: 0,
          }}>
            Prompting
          </h1>

          <p style={{
            fontFamily: T.font, fontSize: 'clamp(15px,2vw,18px)',
            color: T.muted, lineHeight: 1.7, maxWidth: 520,
            marginBottom: 40, animation: 'fadeUp 0.5s 0.22s ease both', opacity: 0,
          }}>
            A technically rigorous, career-grade curriculum for developers,
            builders, and AI practitioners. Free. No credit card needed.
          </p>

          {/* Stats */}
          <div style={{
            display: 'flex', gap: 'clamp(24px,5vw,52px)', flexWrap: 'wrap',
            marginBottom: 44, animation: 'fadeUp 0.5s 0.3s ease both', opacity: 0,
          }}>
            {[['7', 'Modules'], ['22', 'Lessons'], ['69+', 'Quiz Questions'], ['1', 'Certificate']].map(([n, l]) => (
              <div key={l}>
                <div style={{ fontFamily: T.font, fontWeight: 800, fontSize: 'clamp(24px,4vw,34px)', color: T.text, letterSpacing: '-0.03em', lineHeight: 1 }}>{n}</div>
                <div style={{ fontFamily: T.mono, fontSize: 11, color: T.dim, letterSpacing: '0.06em', marginTop: 4 }}>{l.toUpperCase()}</div>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', animation: 'fadeUp 0.5s 0.38s ease both', opacity: 0 }}>
            <AccentBtn onClick={onStart} style={{ fontSize: 15, padding: '14px 32px' }}>
              Start Learning →
            </AccentBtn>
            <button onClick={onLogin} style={{
              background: 'transparent', border: `1px solid ${T.border2}`,
              color: T.muted, padding: '14px 24px', borderRadius: 10, cursor: 'pointer',
              fontFamily: T.font, fontWeight: 600, fontSize: 15, transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.color = T.text; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = T.muted; e.currentTarget.style.borderColor = T.border2; }}
            >
              Log In
            </button>
          </div>
        </div>
      </section>

      {/* ── Module cards ── */}
      <section style={{ padding: 'clamp(48px,7vw,80px) clamp(20px,6vw,80px)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
            <h2 style={{ fontFamily: T.display, fontWeight: 700, fontSize: 'clamp(22px,3vw,28px)', letterSpacing: '-0.03em', color: T.text }}>
              Course Curriculum
            </h2>
            <span style={{ fontFamily: T.mono, fontSize: 11, color: T.dim, letterSpacing: '0.06em' }}>
              {TOTAL_LESSONS} LESSONS
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 268px), 1fr))', gap: 14 }}>
            {MODULES.map(m => (
              <div key={m.id} onClick={onStart} style={{
                background: T.bg, border: `1px solid ${T.border}`,
                borderRadius: 14, padding: '20px 22px', cursor: 'pointer',
                transition: 'all 0.2s', boxShadow: T.shadowSm,
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = T.shadowLg; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = T.shadowSm; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 9,
                    background: `${m.color}12`, border: `1px solid ${m.color}28`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, color: m.color, flexShrink: 0,
                  }}>{m.icon}</div>
                  <span style={{ fontFamily: T.mono, fontSize: 10, color: m.color, letterSpacing: '0.1em', fontWeight: 700 }}>
                    MODULE {m.tag}
                  </span>
                </div>
                <div style={{ fontFamily: T.font, fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 6, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                  {m.title}
                </div>
                <div style={{ fontFamily: T.font, fontSize: 12.5, color: T.muted, lineHeight: 1.55, marginBottom: 14 }}>
                  {m.summary}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: T.mono, fontSize: 10, color: T.dim }}>{m.lessons.length} lessons</span>
                  <span style={{ fontSize: 12, color: m.color }}>→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features strip ── */}
      <section style={{ background: T.bg1, padding: 'clamp(40px,6vw,64px) clamp(20px,6vw,80px)', borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 28 }}>
          {[
            { icon: '📹', title: 'Video + Notes', desc: 'Each lesson has an embedded video and full written notes.' },
            { icon: '📝', title: 'Lesson Quizzes', desc: 'Test your understanding after every lesson with graded quizzes.' },
            { icon: '📊', title: 'Progress Tracking', desc: 'Your progress is saved automatically. Resume any time.' },
            { icon: '🎓', title: 'Verified Certificate', desc: 'Complete the course and earn a certificate with a unique ID.' },
          ].map(f => (
            <div key={f.title}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontFamily: T.font, fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontFamily: T.font, fontSize: 13, color: T.muted, lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <section style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 120%, rgba(99,102,241,0.15) 0%, transparent 70%), linear-gradient(180deg, #09090b 0%, #101014 100%)', padding: 'clamp(48px,7vw,72px) clamp(20px,6vw,80px)', textAlign: 'center', borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 'clamp(22px,3.5vw,32px)', color: T.text, marginBottom: 14, lineHeight: 1.3 }}>
            Ready to level up your prompting?
          </div>
          <p style={{ fontFamily: T.font, fontSize: 14, color: T.muted, marginBottom: 28, lineHeight: 1.6 }}>
            Free course. Create an account in 30 seconds. Start immediately.
          </p>
          <AccentBtn onClick={onStart} style={{ fontSize: 15, padding: '14px 36px' }}>
            Begin the Course →
          </AccentBtn>
        </div>
      </section>

      {/* ── Bottom footer ── */}
      <footer style={{
        background: T.bg, borderTop: `1px solid ${T.border}`,
        padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontFamily: T.mono, fontSize: 11, color: T.faint, letterSpacing: '0.04em' }}>
          Powered by{' '}
          <a
            href="https://x.com/bloomstar042"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: T.dim, textDecoration: 'none',
              borderBottom: '1px solid transparent',
              transition: 'color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = T.accent; e.currentTarget.style.borderBottomColor = T.accentBorder; }}
            onMouseLeave={e => { e.currentTarget.style.color = T.dim; e.currentTarget.style.borderBottomColor = 'transparent'; }}
          >
            BMS
          </a>
        </span>
      </footer>
    </div>
  );
}
