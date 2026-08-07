'use client';
import { T } from '@/lib/theme';

/**
 * Shared locked-state UI, used for two different situations:
 *
 *   variant="signup"  — a signed-out reader on a public lesson. The reading is
 *                       free; the interactive layer (quiz, progress, certificate)
 *                       needs an account. Reads as an invitation.
 *
 *   variant="locked"  — a signed-in learner who has reached a lesson they have
 *                       not unlocked yet. Rendered at the lesson's own URL
 *                       rather than redirecting, so the URL stays honest and
 *                       the reason is explained rather than implied.
 *
 * One component so the two cases cannot drift apart visually, with copy and
 * actions supplied per use.
 */
export default function LockedPanel({
  variant = 'signup',
  icon,
  title,
  body,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  compact = false,
  color,
}) {
  const accent = color || (variant === 'locked' ? T.warning : T.accent);
  const tint   = variant === 'locked' ? 'rgba(251,191,36,0.07)' : 'rgba(129,140,248,0.07)';
  const edge   = variant === 'locked' ? 'rgba(251,191,36,0.28)' : T.accentBorder;

  return (
    <div style={{
      background: tint,
      border: `1.5px solid ${edge}`,
      borderRadius: 14,
      padding: compact ? '18px 20px' : 'clamp(24px,4vw,34px)',
      textAlign: compact ? 'left' : 'center',
      display: 'flex',
      flexDirection: compact ? 'row' : 'column',
      alignItems: compact ? 'center' : 'stretch',
      gap: compact ? 16 : 0,
    }}>
      <div style={{
        width: compact ? 40 : 52, height: compact ? 40 : 52,
        borderRadius: compact ? 11 : '50%',
        margin: compact ? 0 : '0 auto 16px',
        flexShrink: 0,
        background: variant === 'locked' ? 'rgba(251,191,36,0.10)' : T.accentLight,
        border: `1.5px solid ${edge}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: compact ? 17 : 22,
      }}>{icon || '🔒'}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: T.display, fontWeight: 700,
          fontSize: compact ? 14 : 'clamp(16px,2.4vw,19px)',
          color: T.text, marginBottom: compact ? 3 : 8,
          letterSpacing: '-0.02em',
        }}>{title}</div>

        <p style={{
          fontFamily: T.font, fontSize: compact ? 12.5 : 14,
          color: T.muted, lineHeight: 1.65,
          margin: compact ? 0 : '0 auto 20px',
          maxWidth: compact ? undefined : 460,
        }}>{body}</p>
      </div>

      {(primaryLabel || secondaryLabel) && (
        <div style={{
          display: 'flex', gap: 10, flexShrink: 0,
          justifyContent: compact ? 'flex-end' : 'center',
          flexWrap: 'wrap',
          marginTop: compact ? 0 : 4,
        }}>
          {primaryLabel && (
            <button onClick={onPrimary} style={{
              background: accent, border: 'none', color: '#fff',
              padding: compact ? '9px 16px' : '12px 26px',
              borderRadius: 9, cursor: 'pointer',
              fontFamily: T.font, fontWeight: 700,
              fontSize: compact ? 12.5 : 14, whiteSpace: 'nowrap',
              boxShadow: variant === 'locked' ? 'none' : '0 4px 14px rgba(99,102,241,0.30)',
            }}>{primaryLabel}</button>
          )}
          {secondaryLabel && (
            <button onClick={onSecondary} style={{
              background: 'none', border: `1px solid ${T.border2}`, color: T.muted,
              padding: compact ? '9px 14px' : '12px 20px',
              borderRadius: 9, cursor: 'pointer',
              fontFamily: T.font, fontWeight: 600,
              fontSize: compact ? 12.5 : 14, whiteSpace: 'nowrap',
            }}>{secondaryLabel}</button>
          )}
        </div>
      )}
    </div>
  );
}
