import { ImageResponse } from 'next/og';
import { TOTAL_LESSONS, MODULES } from '@/data/courseData';

/**
 * The social card, generated at build time.
 *
 * next/og ships inside Next 14, so this adds no dependency. Generating rather
 * than committing a PNG means the card cannot drift from the design tokens —
 * the colours below are the same ones the site renders from — and it can
 * become per-lesson later by adding the same file under a route segment.
 *
 * Satori (which backs ImageResponse) supports a subset of CSS: any element
 * with more than one child needs an explicit `display: flex`. It fails loudly
 * at build rather than silently mis-rendering, but the rule is easy to trip.
 *
 * Deliberately says "PromptMastery" only. The default page title still reads
 * "Prompt Engineering — Zero to Mastery", which collides with an established
 * brand (zerotomastery.io); that is flagged for a decision, so this new asset
 * stays out of it rather than spreading the second name further.
 */
export const alt = 'PromptMastery — a free, career-grade prompt engineering course';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const BG = '#09090b';
const TEXT = '#fafafa';
const MUTED = '#a1a1aa';
const DIM = '#52525b';
const ACCENT = '#818cf8';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: BG,
          padding: '72px 80px',
          borderTop: `10px solid ${ACCENT}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: 14,
              background: ACCENT,
              color: '#0b0b0f',
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            PE
          </div>
          <div style={{ marginLeft: 20, fontSize: 30, color: TEXT, fontWeight: 700 }}>
            PromptMastery
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 72, color: TEXT, fontWeight: 700, lineHeight: 1.1 }}>
            Master the art of prompting.
          </div>
          <div style={{ marginTop: 22, fontSize: 30, color: MUTED, lineHeight: 1.35 }}>
            A technically rigorous, career-grade curriculum.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', fontSize: 26, color: DIM }}>
          {/* Single string children on purpose: `{x} LABEL` is two child nodes
              to Satori, which then demands display:flex on the wrapper. */}
          <div style={{ color: ACCENT, fontWeight: 700 }}>{`${MODULES.length} MODULES`}</div>
          <div style={{ margin: '0 16px' }}>·</div>
          <div style={{ color: ACCENT, fontWeight: 700 }}>{`${TOTAL_LESSONS} LESSONS`}</div>
          <div style={{ margin: '0 16px' }}>·</div>
          <div style={{ color: ACCENT, fontWeight: 700 }}>FREE FOREVER</div>
        </div>
      </div>
    ),
    size,
  );
}
