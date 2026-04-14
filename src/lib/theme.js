// ─── Design tokens — single source of truth ───────────────────────────────

export const MOD_COLORS = [
  '#E8500A', // M01 — orange-red
  '#0A7CFF', // M02 — vivid blue
  '#7C3AED', // M03 — violet
  '#059669', // M04 — emerald
  '#DC2626', // M05 — red
  '#D97706', // M06 — amber
  '#0891B2', // M07 — cyan
];

export const T = {
  // Backgrounds
  bg:      '#ffffff',
  bg1:     '#f9f8f6',
  bg2:     '#f2f1ee',
  bg3:     '#eae9e6',

  // Text
  text:      '#0f0f10',
  muted:     '#5c5c6e',
  dim:       '#a0a0b0',
  faint:     '#c8c7c4',

  // Borders
  border:    'rgba(0,0,0,0.08)',
  border2:   'rgba(0,0,0,0.14)',

  // Accent
  accent:       '#E8500A',
  accentLight:  'rgba(232,80,10,0.09)',
  accentBorder: 'rgba(232,80,10,0.25)',

  // Status
  success: '#059669',
  error:   '#DC2626',
  warning: '#D97706',
  info:    '#0A7CFF',

  // Typography
  font:  "'Syne', system-ui, sans-serif",
  serif: "'Instrument Serif', Georgia, serif",
  mono:  "'JetBrains Mono', 'Fira Code', monospace",

  // Shadows
  shadowSm: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  shadow:   '0 4px 12px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.04)',
  shadowLg: '0 12px 40px rgba(0,0,0,0.10), 0 4px 12px rgba(0,0,0,0.06)',
  shadowXl: '0 24px 60px rgba(0,0,0,0.13), 0 8px 20px rgba(0,0,0,0.07)',
};

export function getGrade(pct) {
  if (pct >= 90) return { letter: 'A+', label: 'Exceptional',  color: '#059669' };
  if (pct >= 80) return { letter: 'A',  label: 'Excellent',    color: '#0A7CFF' };
  if (pct >= 70) return { letter: 'B',  label: 'Proficient',   color: '#7C3AED' };
  if (pct >= 60) return { letter: 'C',  label: 'Competent',    color: '#D97706' };
  if (pct >= 50) return { letter: 'D',  label: 'Developing',   color: '#E8500A' };
  return           { letter: 'F',  label: 'Needs Review', color: '#DC2626' };
}
