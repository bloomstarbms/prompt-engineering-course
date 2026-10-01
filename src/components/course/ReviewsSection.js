'use client';
import { T } from '@/lib/theme';

/**
 * "What graduates say" on the landing page.
 *
 *   0 reviews   → renders nothing (the caller passes [] on any failure too)
 *   1–3         → a static grid, one column at phone width
 *   4 or more   → a single horizontally scrolling row. Native overflow
 *                 scrolling with scroll-snap: no carousel library, no
 *                 auto-advance, no JavaScript. A keyboard user tabs to the
 *                 row (tabIndex=0, labelled) and uses the arrow keys; a
 *                 pointer user drags or uses the scrollbar.
 *
 * Every string shown comes from the database as approved: body and the
 * display_name chosen at submission. Nothing here is editorial.
 */

function Card({ r, width }) {
  return (
    <figure style={{
      margin: 0, width, flexShrink: 0, scrollSnapAlign: 'start',
      background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 14,
      padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14,
      boxSizing: 'border-box',
    }}>
      <blockquote style={{
        margin: 0, fontFamily: T.font, fontSize: 14, color: T.text, lineHeight: 1.7,
        whiteSpace: 'pre-wrap', flex: 1,
      }}>
        {r.body}
      </blockquote>
      <figcaption style={{ fontFamily: T.mono, fontSize: 11, color: T.muted, letterSpacing: '0.04em' }}>
        — {r.displayName}
      </figcaption>
    </figure>
  );
}

export default function ReviewsSection({ reviews }) {
  if (!Array.isArray(reviews) || reviews.length === 0) return null;
  const scrolls = reviews.length >= 4;

  return (
    <section aria-labelledby="reviews-heading" style={{
      background: T.bg, borderTop: `1px solid ${T.border}`,
      padding: 'clamp(40px,6vw,64px) 0',
    }}>
      <div style={{ padding: '0 clamp(20px,6vw,80px)', maxWidth: 1000, margin: '0 auto', boxSizing: 'border-box' }}>
        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.accent, letterSpacing: '0.12em', marginBottom: 10 }}>
          FROM GRADUATES
        </div>
        <h2 id="reviews-heading" style={{
          fontFamily: T.display, fontWeight: 700,
          fontSize: 'clamp(17px,2.5vw,22px)', color: T.text,
          letterSpacing: '-0.025em', margin: '0 0 6px',
        }}>
          What graduates say
        </h2>
        <p style={{ fontFamily: T.font, fontSize: 13, color: T.dim, lineHeight: 1.6, margin: '0 0 22px', maxWidth: 620 }}>
          Written by people who finished the course, shown as they wrote it.
        </p>
      </div>

      {scrolls ? (
        <div
          className="reviews-row"
          tabIndex={0}
          aria-label={`${reviews.length} reviews, scroll sideways`}
          style={{
            display: 'flex', gap: 16, overflowX: 'auto', scrollSnapType: 'x mandatory',
            // The row bleeds to the viewport edge so cards can scroll under it,
            // but the first card lines up with the heading above, which sits in
            // the centred 1000px column: the same left as that column's text.
            padding: '4px clamp(20px,6vw,80px) 14px',
            paddingLeft: 'max(clamp(20px,6vw,80px), calc(50% - 500px + clamp(20px,6vw,80px)))',
            scrollPaddingLeft: 'max(clamp(20px,6vw,80px), calc(50% - 500px + clamp(20px,6vw,80px)))',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {reviews.map(r => <Card key={r.id} r={r} width="min(340px, 82vw)"/>)}
        </div>
      ) : (
        <div style={{
          padding: '0 clamp(20px,6vw,80px)', maxWidth: 1000, margin: '0 auto', boxSizing: 'border-box',
          display: 'grid', gap: 16,
          gridTemplateColumns: `repeat(auto-fit, minmax(min(280px, 100%), 1fr))`,
        }}>
          {reviews.map(r => <Card key={r.id} r={r} width="auto"/>)}
        </div>
      )}
    </section>
  );
}
