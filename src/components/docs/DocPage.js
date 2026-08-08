import Link from 'next/link';
import { T } from '@/lib/theme';
import { LessonBody } from '@/components/ui';

/**
 * Shared shell for the static document pages: /privacy, /terms, /about.
 *
 * Server component — no 'use client'. These pages are static text with no
 * interactivity, so there is nothing to hydrate beyond the links, and the
 * content lands in the HTML source without any of the splash-gate machinery
 * the lesson routes needed. A crawler and a reader with JavaScript disabled
 * both get the whole document.
 *
 * Deliberately does NOT render inside CourseApp. These have to be reachable
 * and readable by someone who is signed out, mid-signup, or has just had their
 * account deleted — none of which should depend on the auth-aware shell.
 */
export default function DocPage({ title, updated, markdown, links = [] }) {
  return (
    <div style={{ minHeight: '100dvh', background: T.bg, display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          borderBottom: `1px solid ${T.border}`,
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Link
          href="/"
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            textDecoration: 'none', color: T.text,
            fontFamily: T.display, fontWeight: 700, fontSize: 15,
          }}
        >
          <span
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28, borderRadius: 8,
              background: T.accent, color: '#0b0b0f',
              fontSize: 12, fontWeight: 700,
            }}
          >
            PE
          </span>
          PromptMastery
        </Link>
      </header>

      <main style={{ flex: 1, width: '100%', maxWidth: 780, margin: '0 auto', padding: '40px 24px 64px' }}>
        <h1
          style={{
            fontFamily: T.display, fontWeight: 700, color: T.text,
            fontSize: 'clamp(26px,4vw,36px)', letterSpacing: '-0.03em',
            margin: '0 0 8px', lineHeight: 1.15,
          }}
        >
          {title}
        </h1>
        {updated && (
          <p style={{ fontFamily: T.mono, fontSize: 12, color: T.dim, margin: '0 0 28px', letterSpacing: '0.04em' }}>
            Last updated: {updated}
          </p>
        )}

        <LessonBody text={markdown} color={T.accent} />

        <div style={{ marginTop: 40, paddingTop: 20, borderTop: `1px solid ${T.border}`, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          {links.map(({ href, label }) => (
            <Link key={href} href={href} style={{ color: T.accent, fontFamily: T.font, fontSize: 14, textDecoration: 'none' }}>
              {label} →
            </Link>
          ))}
          <Link href="/" style={{ color: T.muted, fontFamily: T.font, fontSize: 14, textDecoration: 'none' }}>
            Back to the course
          </Link>
        </div>
      </main>
    </div>
  );
}
