'use client';
import { T } from '@/lib/theme';

/* ── Progress Ring ─────────────────────────────────────────────────────── */
export function Ring({ pct, color, size = 40, stroke = 3 }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.bg3} strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
}

/* ── Modal Overlay ─────────────────────────────────────────────────────── */
export function Modal({ children, onClose }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, padding: 20, backdropFilter: 'blur(4px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div style={{
        background: T.bg, borderRadius: 16, padding: 'clamp(24px,4vw,32px)',
        width: '100%', maxWidth: 420, boxShadow: T.shadowXl,
        animation: 'fadeUp 0.3s ease both',
      }}>
        {children}
      </div>
    </div>
  );
}

/* ── Accent Button ─────────────────────────────────────────────────────── */
export function AccentBtn({ children, onClick, disabled, fullWidth, size = 'md', style: extra = {} }) {
  const pad = size === 'sm' ? '8px 16px' : '12px 24px';
  const fs  = size === 'sm' ? 12 : 14;
  return (
    <button
      onClick={onClick} disabled={disabled}
      style={{
        background: disabled ? T.bg3 : T.accent, border: 'none',
        color: disabled ? T.dim : '#fff',
        padding: pad, borderRadius: 8, cursor: disabled ? 'default' : 'pointer',
        fontFamily: T.font, fontWeight: 700, fontSize: fs,
        letterSpacing: '-0.01em', transition: 'all 0.15s',
        width: fullWidth ? '100%' : undefined,
        boxShadow: disabled ? 'none' : '0 4px 12px rgba(232,80,10,0.3)',
        ...extra,
      }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(232,80,10,0.4)'; } }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = disabled ? 'none' : '0 4px 12px rgba(232,80,10,0.3)'; }}
    >
      {children}
    </button>
  );
}

/* ── Ghost Button ──────────────────────────────────────────────────────── */
export function GhostBtn({ children, onClick, disabled, style: extra = {} }) {
  return (
    <button
      onClick={onClick} disabled={disabled}
      style={{
        background: T.bg2, border: `1px solid ${T.border}`,
        color: disabled ? T.faint : T.muted,
        padding: '10px 18px', borderRadius: 8,
        cursor: disabled ? 'default' : 'pointer',
        fontFamily: T.font, fontWeight: 600, fontSize: 13,
        transition: 'all 0.15s', ...extra,
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = T.bg3; }}
      onMouseLeave={e => { e.currentTarget.style.background = T.bg2; }}
    >
      {children}
    </button>
  );
}

/* ── Module Pill ───────────────────────────────────────────────────────── */
export function ModPill({ icon, title, color }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      background: `${color}0e`, border: `1px solid ${color}28`,
      borderRadius: 100, padding: '4px 12px',
    }}>
      <span style={{ fontSize: 11, color }}>{icon}</span>
      <span style={{ fontFamily: T.mono, fontSize: 10, color, letterSpacing: '0.06em' }}>{title}</span>
    </div>
  );
}

/* ── Lesson Body Renderer ──────────────────────────────────────────────── */
export function LessonBody({ text, color }) {
  const lines = text.split('\n');
  const els = [];
  let i = 0;

  while (i < lines.length) {
    const ln = lines[i];

    // Code block
    if (ln.startsWith('```')) {
      const code = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) { code.push(lines[i]); i++; }
      els.push(
        <pre key={i} style={{
          background: T.bg1, border: `1px solid ${T.border}`,
          borderLeft: `3px solid ${color}`, borderRadius: 8,
          padding: '14px 16px', margin: '16px 0', overflowX: 'auto',
          fontSize: 12.5, lineHeight: 1.8, color: '#444', fontFamily: T.mono,
        }}>
          <code>{code.join('\n')}</code>
        </pre>
      );

    // Bold heading line
    } else if (ln.startsWith('**') && ln.endsWith('**') && ln.length > 4 && !ln.slice(2, -2).includes('**')) {
      els.push(
        <h4 key={i} style={{
          color, fontFamily: T.mono, fontSize: 11, fontWeight: 700,
          marginTop: 24, marginBottom: 8, letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          {ln.replace(/\*\*/g, '')}
        </h4>
      );

    // Table
    } else if (ln.startsWith('| ')) {
      const tl = [ln]; i++;
      while (i < lines.length && lines[i].startsWith('|')) { tl.push(lines[i]); i++; }
      const rows = tl.filter(l => !l.match(/^\|[-| ]+\|$/));
      els.push(
        <div key={i} style={{ overflowX: 'auto', margin: '14px 0', borderRadius: 8, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <tbody>
              {rows.map((r, ri) => {
                const cells = r.split('|').filter(c => c.trim());
                return (
                  <tr key={ri} style={{ borderBottom: `1px solid ${T.border}`, background: ri === 0 ? T.bg1 : T.bg }}>
                    {cells.map((c, ci) => ri === 0
                      ? <th key={ci} style={{ padding: '10px 14px', textAlign: 'left', color, fontFamily: T.mono, fontSize: 11, letterSpacing: '0.05em' }}>{c.trim()}</th>
                      : <td key={ci} style={{ padding: '10px 14px', color: T.muted, fontSize: 13, fontFamily: T.font }}>{c.trim()}</td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
      continue;

    // Unordered list
    } else if (ln.startsWith('- ') || ln.startsWith('* ')) {
      const items = [ln.slice(2)]; i++;
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) { items.push(lines[i].slice(2)); i++; }
      els.push(
        <ul key={i} style={{ margin: '8px 0 14px', paddingLeft: 20 }}>
          {items.map((it, li) => (
            <li key={li} style={{ color: T.muted, marginBottom: 6, lineHeight: 1.75, fontSize: 14, fontFamily: T.font }}>
              {inlineMarkup(it, color)}
            </li>
          ))}
        </ul>
      );
      continue;

    // Ordered list
    } else if (/^\d+\. /.test(ln)) {
      const items = [ln]; i++;
      while (i < lines.length && /^\d+\. /.test(lines[i])) { items.push(lines[i]); i++; }
      els.push(
        <ol key={i} style={{ margin: '8px 0 14px', paddingLeft: 20 }}>
          {items.map((it, li) => (
            <li key={li} style={{ color: T.muted, marginBottom: 6, lineHeight: 1.75, fontSize: 14, fontFamily: T.font }}>
              {inlineMarkup(it.replace(/^\d+\. /, ''), color)}
            </li>
          ))}
        </ol>
      );
      continue;

    // Empty line
    } else if (ln === '') {
      els.push(<div key={i} style={{ height: 8 }} />);

    // Paragraph
    } else {
      els.push(
        <p key={i} style={{ color: T.muted, lineHeight: 1.8, fontSize: 14, fontFamily: T.font, margin: '3px 0' }}>
          {inlineMarkup(ln, color)}
        </p>
      );
    }
    i++;
  }
  return <>{els}</>;
}

function inlineMarkup(text, color) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/).map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return <strong key={i} style={{ color: T.text, fontWeight: 600 }}>{p.slice(2, -2)}</strong>;
    }
    if (p.startsWith('`') && p.endsWith('`')) {
      return (
        <code key={i} style={{
          background: `${color}12`, color, padding: '2px 6px',
          borderRadius: 4, fontSize: 12.5, fontFamily: T.mono, border: `1px solid ${color}25`,
        }}>
          {p.slice(1, -1)}
        </code>
      );
    }
    return p;
  });
}
