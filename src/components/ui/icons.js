/**
 * Line icons for feature labels, in the same idiom as the module icons in
 * Landing.js (24-unit grid, 1.6 stroke, round caps, module accent colour).
 * They replaced emoji (🎨 📝 📊 🎓 on the landing features strip, 📚 📖 ✅ ⚡
 * on lesson 1's welcome chips), which rendered in each platform's own
 * colour-emoji font and sat oddly against the hand-drawn diagrams and mono
 * captions. Purely decorative wherever they appear: the text beside them
 * carries the meaning, so each is aria-hidden.
 */
const base = (size) => ({
  viewBox: '0 0 24 24', width: size, height: size, fill: 'none',
  strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round',
  'aria-hidden': true, focusable: 'false',
  style: { display: 'block', flexShrink: 0 },
});

/* Landing features strip */
export function IconDiagram({ color, size = 18 }) {
  return (
    <svg {...base(size)} stroke={color}>
      <rect x="3" y="4" width="18" height="16" rx="2"/>
      <circle cx="8" cy="12" r="2"/>
      <path d="M10 12h5"/><path d="M13 9.5l2.5 2.5-2.5 2.5"/>
    </svg>
  );
}
export function IconChecklist({ color, size = 18 }) {
  return (
    <svg {...base(size)} stroke={color}>
      <path d="M4 6.5l1.5 1.5L8 5.5"/><line x1="11" y1="6.5" x2="20" y2="6.5"/>
      <path d="M4 12.5l1.5 1.5L8 11.5"/><line x1="11" y1="12.5" x2="20" y2="12.5"/>
      <path d="M4 18.5l1.5 1.5L8 17.5"/><line x1="11" y1="18.5" x2="20" y2="18.5"/>
    </svg>
  );
}
export function IconProgress({ color, size = 18 }) {
  return (
    <svg {...base(size)} stroke={color}>
      <circle cx="12" cy="12" r="8" opacity="0.3"/>
      <path d="M12 4a8 8 0 0 1 8 8 8 8 0 0 1-2.3 5.7"/>
      <circle cx="12" cy="12" r="1.6" fill={color} stroke="none"/>
    </svg>
  );
}
export function IconCertificate({ color, size = 18 }) {
  return (
    <svg {...base(size)} stroke={color}>
      <path d="M13 17H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6"/>
      <line x1="7" y1="9" x2="17" y2="9"/><line x1="7" y1="12.5" x2="12" y2="12.5"/>
      <circle cx="17.5" cy="16" r="3"/>
      <path d="M16 18.6V22l1.5-1 1.5 1v-3.4"/>
    </svg>
  );
}

/* Lesson 1 welcome chips */
export function IconModules({ color, size = 18 }) {
  return (
    <svg {...base(size)} stroke={color}>
      <path d="M12 3l9 4.5-9 4.5-9-4.5z"/>
      <path d="M3 12l9 4.5 9-4.5"/><path d="M3 16.5L12 21l9-4.5"/>
    </svg>
  );
}
export function IconBook({ color, size = 18 }) {
  return (
    <svg {...base(size)} stroke={color}>
      <path d="M3 5h6a3 3 0 0 1 3 3v12a3 3 0 0 0-3-3H3z"/>
      <path d="M21 5h-6a3 3 0 0 0-3 3v12a3 3 0 0 1 3-3h6z"/>
    </svg>
  );
}
export function IconCheckCircle({ color, size = 18 }) {
  return (
    <svg {...base(size)} stroke={color}>
      <circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/>
    </svg>
  );
}
export function IconSprout({ color, size = 18 }) {
  return (
    <svg {...base(size)} stroke={color}>
      <path d="M12 21v-8"/>
      <path d="M12 13c0-4 3-7 7-7 0 4-3 7-7 7z"/>
      <path d="M12 13c0-3-2.5-5.5-5.5-5.5C6.5 10.5 9 13 12 13z"/>
    </svg>
  );
}
