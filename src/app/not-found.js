import Link from 'next/link';

export const metadata = { title: 'Page Not Found' };

/* Branded 404 — server component, no client JS needed */
export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', background: '#09090b',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px', textAlign: 'center',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: 'rgba(129,140,248,0.10)', border: '1px solid rgba(129,140,248,0.30)',
        borderRadius: 100, padding: '5px 14px', marginBottom: 28,
      }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
          color: '#818cf8', letterSpacing: '0.1em',
        }}>ERROR 404</span>
      </div>

      <h1 style={{
        fontFamily: "'Space Grotesk', 'Inter', sans-serif", fontWeight: 700,
        fontSize: 'clamp(28px, 6vw, 44px)', color: '#fafafa',
        letterSpacing: '-0.04em', lineHeight: 1.1, margin: '0 0 12px',
      }}>
        This page doesn&apos;t exist
      </h1>

      <p style={{
        fontSize: 15, color: '#a1a1aa', lineHeight: 1.7,
        maxWidth: 420, margin: '0 0 32px',
      }}>
        The page you&apos;re looking for was moved, renamed, or never existed.
        Your course progress is safe — head back and pick up where you left off.
      </p>

      <Link href="/" style={{
        display: 'inline-block', background: '#818cf8', color: '#fff',
        padding: '13px 28px', borderRadius: 10, textDecoration: 'none',
        fontWeight: 700, fontSize: 14,
        boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
      }}>
        ← Back to Prompten
      </Link>
    </div>
  );
}
