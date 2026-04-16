'use client';
import { useState, useCallback } from 'react';
import { T } from '@/lib/theme';

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div style={{
      background: T.bg, border: `1px solid ${T.border}`,
      borderRadius: 16, padding: '24px 28px',
      display: 'flex', flexDirection: 'column', gap: 8,
      boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
      borderTop: `3px solid ${color}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={{ fontFamily: T.mono, fontSize: 10, color: T.dim, letterSpacing: '0.12em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontFamily: T.display, fontWeight: 800, fontSize: 48, color, lineHeight: 1, letterSpacing: '-0.04em' }}>
        {value}
      </div>
      {sub && <div style={{ fontFamily: T.font, fontSize: 13, color: T.muted }}>{sub}</div>}
    </div>
  );
}

function UserTable({ title, rows, color }) {
  if (!rows || rows.length === 0) return null;
  return (
    <div style={{
      background: T.bg, border: `1px solid ${T.border}`,
      borderRadius: 16, overflow: 'hidden',
      boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    }}>
      <div style={{
        padding: '14px 20px', borderBottom: `1px solid ${T.border}`,
        background: `${color}06`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
        <span style={{ fontFamily: T.font, fontWeight: 700, fontSize: 13, color: T.text }}>{title}</span>
        <span style={{ fontFamily: T.mono, fontSize: 10, color: T.faint, marginLeft: 'auto' }}>
          {rows.length} shown
        </span>
      </div>
      <div>
        {rows.map((r, i) => (
          <div key={i} style={{
            padding: '11px 20px', display: 'flex', alignItems: 'center', gap: 12,
            borderBottom: i < rows.length - 1 ? `1px solid ${T.border}` : 'none',
          }}>
            {/* Avatar initials */}
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: `${color}18`, border: `1px solid ${color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: T.font, fontWeight: 700, fontSize: 12, color,
            }}>
              {r.name ? r.name.trim().split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase() : '?'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: T.font, fontWeight: 600, fontSize: 13, color: T.text,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {r.name || '—'}
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 10, color: T.dim,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {r.email}
              </div>
            </div>
            <div style={{ fontFamily: T.mono, fontSize: 10, color: T.faint, flexShrink: 0, textAlign: 'right' }}>
              {new Date(r.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [password, setPassword] = useState('');
  const [stats, setStats]       = useState(null);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [authed, setAuthed]     = useState(false);
  const [token, setToken]       = useState('');

  const fetchStats = useCallback(async (tkn) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tkn }),
      });
      if (res.status === 401) { setError('Wrong password.'); setLoading(false); return; }
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStats(data);
      setAuthed(true);
      setToken(tkn);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, []);

  if (!authed) {
    return (
      <div style={{
        minHeight: '100vh', background: T.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}>
        <div style={{
          width: '100%', maxWidth: 380,
          background: T.bg1, border: `1px solid ${T.border}`,
          borderRadius: 20, padding: '40px 32px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🔒</div>
            <h1 style={{ fontFamily: T.display, fontWeight: 800, fontSize: 22, color: T.text,
              margin: 0, letterSpacing: '-0.03em' }}>Admin Dashboard</h1>
            <p style={{ fontFamily: T.font, fontSize: 13, color: T.muted, marginTop: 6, marginBottom: 0 }}>
              Enter your admin password to continue
            </p>
          </div>
          <input
            type="password"
            placeholder="Admin password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchStats(password)}
            autoFocus
            style={{
              width: '100%', background: T.bg2, border: `1px solid ${T.border}`,
              color: T.text, borderRadius: 8, padding: '10px 14px',
              fontFamily: T.font, fontSize: 14, outline: 'none', boxSizing: 'border-box',
              marginBottom: 12, transition: 'border-color 0.15s',
            }}
          />
          {error && (
            <div style={{ fontFamily: T.font, fontSize: 12, color: '#f87171', marginBottom: 12, textAlign: 'center' }}>
              {error}
            </div>
          )}
          <button
            onClick={() => fetchStats(password)}
            disabled={loading}
            style={{
              width: '100%', background: '#6366f1', border: 'none', color: '#fff',
              borderRadius: 8, padding: '11px', cursor: loading ? 'wait' : 'pointer',
              fontFamily: T.font, fontWeight: 700, fontSize: 14,
              opacity: loading ? 0.7 : 1, transition: 'all 0.15s',
            }}
          >
            {loading ? 'Loading…' : 'View Dashboard →'}
          </button>
        </div>
      </div>
    );
  }

  const enrolled    = stats.totalEnrollments;
  const completed   = stats.totalCompletions;
  const rate        = stats.completionRate;
  const inProgress  = Math.max(0, enrolled - completed);

  return (
    <div style={{ minHeight: '100vh', background: T.bg }}>

      {/* Header */}
      <div style={{
        borderBottom: `1px solid ${T.border}`, padding: '0 clamp(20px,5vw,40px)',
        height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: T.bg, position: 'sticky', top: 0, zIndex: 10,
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
          }}>📊</div>
          <span style={{ fontFamily: T.font, fontWeight: 700, fontSize: 15, color: T.text }}>
            Course Analytics
          </span>
        </div>
        <button
          onClick={() => fetchStats(token)}
          style={{
            background: 'none', border: `1px solid ${T.border}`,
            color: T.muted, cursor: 'pointer', padding: '6px 12px',
            borderRadius: 6, fontFamily: T.font, fontSize: 12, transition: 'all 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
          onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
        >
          ↻ Refresh
        </button>
      </div>

      <div style={{ padding: 'clamp(24px,4vw,40px) clamp(20px,5vw,40px)', maxWidth: 1100, margin: '0 auto' }}>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 36 }}>
          <StatCard label="TOTAL ENROLLED"    value={enrolled}  icon="👥" color="#818cf8"
            sub={`${enrolled === 1 ? 'student' : 'students'} registered`} />
          <StatCard label="COURSE COMPLETED"  value={completed} icon="🎓" color="#34d399"
            sub={`${completed === 1 ? 'certificate' : 'certificates'} issued`} />
          <StatCard label="IN PROGRESS"       value={inProgress} icon="⚡" color="#fbbf24"
            sub="started but not finished" />
          <StatCard label="COMPLETION RATE"   value={`${rate}%`} icon="📈" color="#c084fc"
            sub={rate >= 50 ? 'Great engagement!' : 'Keep students motivated'} />
        </div>

        {/* Progress bar */}
        <div style={{
          background: T.bg, border: `1px solid ${T.border}`,
          borderRadius: 16, padding: '20px 24px', marginBottom: 36,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontFamily: T.font, fontWeight: 600, fontSize: 13, color: T.text }}>Completion funnel</span>
            <span style={{ fontFamily: T.mono, fontSize: 11, color: T.dim }}>{enrolled} enrolled → {completed} completed</span>
          </div>
          <div style={{ background: T.bg2, borderRadius: 100, height: 8, position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: `${enrolled > 0 ? 100 : 0}%`,
              background: 'rgba(99,102,241,0.25)', borderRadius: 100,
            }} />
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: `${rate}%`,
              background: 'linear-gradient(90deg, #818cf8, #34d399)',
              borderRadius: 100, transition: 'width 1s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontFamily: T.mono, fontSize: 10, color: '#818cf8' }}>{enrolled} enrolled</span>
            <span style={{ fontFamily: T.mono, fontSize: 10, color: '#34d399' }}>{completed} completed ({rate}%)</span>
          </div>
        </div>

        {/* User tables */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          <UserTable title="Recent Enrollments"  rows={stats.recentEnrollments}  color="#818cf8" />
          <UserTable title="Course Completions"  rows={stats.recentCompletions}  color="#34d399" />
        </div>

        {!stats.totalEnrollments && (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            fontFamily: T.font, fontSize: 14, color: T.faint, lineHeight: 1.7,
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            No data yet.<br />
            Once students register, enrollments will appear here.
          </div>
        )}
      </div>
    </div>
  );
}
