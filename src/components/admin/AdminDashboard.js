'use client';
import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { T } from '@/lib/theme';
import { useAuthCtx } from '@/providers/AuthProvider';
import { fetchStatsAsAdmin } from '@/lib/adminApi';
import ReviewsPanel from '@/components/admin/ReviewsPanel';

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
  const [stats, setStats]     = useState(null);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionMsg, setSessionMsg] = useState('');

  /* ── Admin is a signed-in account listed in ADMIN_USER_IDS ───────────
     The shared admin password is gone (the owner verified this path on
     production before it was removed). The server decides from the bearer
     token (lib/adminAuth.js); this component only reports what it was told:
     401 → sign in, 403 → that account is not an admin. */
  const { user, userId, ready, callAuthed } = useAuthCtx();

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      setStats(await callAuthed(fetchStatsAsAdmin));
      setSessionMsg('');
    } catch (e) {
      setStats(null);
      setSessionMsg(e?.notAdmin
        ? `Signed in as ${user?.email || 'this account'}, which is not an admin.`
        : `Signed in, but the admin check failed: ${e?.message || 'unknown error'}`);
    } finally { setLoading(false); }
  }, [callAuthed, user]);

  useEffect(() => { if (ready && userId) load(); }, [ready, userId, load]);

  if (!stats) {
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
          boxShadow: '0 8px 40px rgba(0,0,0,0.2)', textAlign: 'center',
        }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🔒</div>
          <h1 style={{ fontFamily: T.display, fontWeight: 800, fontSize: 22, color: T.text,
            margin: 0, letterSpacing: '-0.03em' }}>Admin Dashboard</h1>
          {!ready && (
            <p style={{ fontFamily: T.mono, fontSize: 11, color: T.dim, margin: '12px 0 0' }}>checking session…</p>
          )}
          {ready && !userId && (
            <>
              <p style={{ fontFamily: T.font, fontSize: 13, color: T.muted, margin: '8px 0 0' }}>
                Sign in with the admin account to continue.
              </p>
              <p style={{ fontFamily: T.font, fontSize: 14, margin: '16px 0 0' }}>
                {/* Same return-to key the lesson sign-in links use, so signing in
                    from here comes back here rather than to /course. CourseApp
                    honours it only for lesson paths and exactly '/admin'. */}
                <Link
                  href="/auth"
                  onClick={() => { try { sessionStorage.setItem('pe_return_to', '/admin'); } catch { /* private mode — falls back to /course */ } }}
                  style={{ color: T.accent, fontWeight: 700 }}
                >Sign in →</Link>
              </p>
            </>
          )}
          {ready && userId && loading && (
            <p style={{ fontFamily: T.mono, fontSize: 11, color: T.dim, margin: '12px 0 0' }}>loading…</p>
          )}
          {sessionMsg && (
            <p role="status" style={{ fontFamily: T.font, fontSize: 12.5, color: T.warning, margin: '12px 0 0', lineHeight: 1.5 }}>{sessionMsg}</p>
          )}
          {ready && userId && !loading && (
            <button onClick={load} style={{
              marginTop: 16, background: 'none', border: `1px solid ${T.border}`,
              color: T.muted, cursor: 'pointer', padding: '7px 14px', borderRadius: 8,
              fontFamily: T.font, fontSize: 12,
            }}>Try again</button>
          )}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontFamily: T.mono, fontSize: 10, color: T.dim }}>
          {`admin · ${user?.email || userId}`}
        </span>
        <button
          onClick={load}
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
          <UserTable title="Recent Registrations" rows={stats.recentEnrollments}  color="#818cf8" />
          {/* NOT "Course Completions". These are certificates, which have a real
              issued_at. progress has no completion timestamp — updated_at is
              rewritten on every save — so a "recently completed" list would be
              ordered by last activity while claiming to be ordered by finishing.
              The COURSE COMPLETED card above counts a different, larger group:
              everyone who has finished the syllabus, whether or not they ever
              claimed a certificate. */}
          <UserTable title="Certificates Issued"  rows={stats.recentCertificates} color="#34d399" />
        </div>

        {/* ── DIAGNOSTICS ──────────────────────────────────────────────────
            Here because of how the last two failures were found: both were
            invisible on this screen and were discovered by hand-written SQL
            months late. A number that only exists in someone's ad-hoc query is
            a number nobody is watching. */}
        {stats.diagnostics && (
          <div style={{
            marginTop: 28, padding: '14px 18px',
            background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12,
            fontFamily: T.mono, fontSize: 11, color: T.dim,
            display: 'flex', flexWrap: 'wrap', gap: 18,
          }}>
            <span>auth.users {enrolled}</span>
            <span>profiles {stats.diagnostics.profiles}</span>
            <span>progress {stats.diagnostics.progressRows}</span>
            <span>certificates {stats.diagnostics.certificates}</span>
            <span>lessons required {stats.diagnostics.requiredLessons}</span>
            {/* A non-zero gap means accounts exist with no profile row. That was
                true of 54 accounts for months and cost a migration to repair. */}
            {stats.diagnostics.profileGap !== 0 && (
              <span style={{ color: '#f87171', fontWeight: 700 }}>
                ⚠ {stats.diagnostics.profileGap} account(s) missing a profile row
              </span>
            )}
          </div>
        )}

        <ReviewsPanel callAuthed={callAuthed}/>

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
