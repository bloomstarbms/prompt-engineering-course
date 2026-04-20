// ─── Design tokens — single source of truth ───────────────────────────────
// Dark premium palette — Linear / Vercel inspired

export const MOD_COLORS = [
  '#818cf8', // M01 — indigo (accent)
  '#60a5fa', // M02 — blue
  '#c084fc', // M03 — purple
  '#34d399', // M04 — emerald
  '#f87171', // M05 — red
  '#fbbf24', // M06 — amber
  '#22d3ee', // M07 — cyan
  '#f472b6', // M08 — pink (Advanced Frontiers)
];

export const T = {
  // Backgrounds — deep dark
  bg:      '#09090b',
  bg1:     '#101014',
  bg2:     '#18181c',
  bg3:     '#1f1f24',
  surface: '#141418',

  // Text — crisp on dark
  text:      '#fafafa',
  muted:     '#a1a1aa',
  dim:       '#52525b',
  faint:     '#3f3f46',

  // Borders
  border:    'rgba(255,255,255,0.07)',
  border2:   'rgba(255,255,255,0.13)',

  // Accent — indigo / violet
  accent:       '#818cf8',
  accentDeep:   '#6366f1',
  accentLight:  'rgba(129,140,248,0.10)',
  accentBorder: 'rgba(129,140,248,0.30)',

  // Status (bright for dark backgrounds)
  success: '#34d399',
  error:   '#f87171',
  warning: '#fbbf24',
  info:    '#60a5fa',

  // Typography — Inter + Space Grotesk + Instrument Serif + JetBrains Mono
  font:    "'Inter', system-ui, -apple-system, sans-serif",
  display: "'Space Grotesk', 'Inter', system-ui, sans-serif",
  serif:   "'Instrument Serif', Georgia, serif",   // italic/certificate accents
  mono:    "'JetBrains Mono', 'Fira Code', monospace",

  // Shadows — deep dark glow
  shadowSm: '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
  shadow:   '0 4px 16px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.3)',
  shadowLg: '0 12px 40px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.4)',
  shadowXl: '0 24px 64px rgba(0,0,0,0.7), 0 8px 24px rgba(0,0,0,0.5)',

  // Accent glow
  glow:   '0 0 24px rgba(129,140,248,0.15), 0 0 8px rgba(129,140,248,0.08)',
  glowLg: '0 0 48px rgba(129,140,248,0.20), 0 0 16px rgba(129,140,248,0.10)',
};

export function getGrade(pct) {
  if (pct >= 90) return { letter: 'A+', label: 'Exceptional',  color: '#34d399' };
  if (pct >= 80) return { letter: 'A',  label: 'Excellent',    color: '#60a5fa' };
  if (pct >= 70) return { letter: 'B',  label: 'Proficient',   color: '#c084fc' };
  if (pct >= 60) return { letter: 'C',  label: 'Competent',    color: '#fbbf24' };
  if (pct >= 50) return { letter: 'D',  label: 'Developing',   color: '#818cf8' };
  return           { letter: 'F',  label: 'Needs Review', color: '#f87171' };
}
