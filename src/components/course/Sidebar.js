'use client';
import { useState, useEffect } from 'react';
import { T, getGrade } from '@/lib/theme';
import { MODULES, TOTAL_LESSONS } from '@/data/courseData';
import { isLessonUnlocked } from '@/lib/lessonUnlock';
import { Ring } from '@/components/ui';

/* ── Avatar ── */
const AVATAR_GRADIENTS = [
  ['#818cf8','#6366f1'],['#60a5fa','#3b82f6'],['#c084fc','#a855f7'],
  ['#34d399','#10b981'],['#f87171','#ef4444'],['#fbbf24','#f59e0b'],
  ['#22d3ee','#06b6d4'],['#fb923c','#f97316'],
];
function gradientForName(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return AVATAR_GRADIENTS[Math.abs(h) % AVATAR_GRADIENTS.length];
}
function initials(name = '') {
  const p = name.trim().split(/\s+/);
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

function SidebarAvatar({ name, avatarUrl, size = 34, fontSize = 12, ringColor }) {
  const [imgOk, setImgOk] = useState(true);
  useEffect(() => setImgOk(true), [avatarUrl]);
  const colors = gradientForName(name);
  if (avatarUrl && imgOk) {
    return (
      <img src={avatarUrl} alt={name} onError={() => setImgOk(false)}
        style={{
          width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0,
          border: `1.5px solid ${ringColor || colors[0]}30`,
        }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: T.display, fontWeight: 800, fontSize, color: '#fff',
      border: `1.5px solid ${colors[0]}40`,
    }}>
      {initials(name)}
    </div>
  );
}

export default function Sidebar({
  user, activeM, activeL, progress, quizScores,
  canSeeCert, onNavigate, onCert, onProfile, onLogout, isMobile, completed,
}) {
  const completedCount = Object.keys(completed).length;
  const prog           = Math.round(completedCount / TOTAL_LESSONS * 100);

  const totalCorrect  = Object.values(quizScores).reduce((a, v) => a + v.score, 0);
  const totalPossible = Object.values(quizScores).reduce((a, v) => a + v.total, 0);
  const overallPct    = totalPossible > 0 ? Math.round(totalCorrect / totalPossible * 100) : 0;
  const overallGrade  = getGrade(overallPct);
  const mod           = MODULES[activeM];

  return (
    <aside style={{
      width: 272, minWidth: 272, background: T.bg, borderRight: `1px solid ${T.border}`,
      display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden',
    }}>

      {/* ── Header / User Card ── */}
      <div style={{ padding: '14px 14px 10px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>

        {/* User row */}
        <button onClick={onProfile} style={{
          width: '100%', background: 'none', border: 'none', padding: '6px 8px',
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
          cursor: 'pointer', borderRadius: 9, transition: 'background 0.15s', textAlign: 'left',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = T.bg1; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
          title="View Profile"
        >
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <SidebarAvatar name={user.name} avatarUrl={user.avatarUrl || ''} size={36} fontSize={13} ringColor={mod.color} />
            {prog === 100 && (
              <div style={{
                position: 'absolute', bottom: -1, right: -1,
                width: 14, height: 14, borderRadius: '50%',
                background: T.success, border: `1.5px solid ${T.bg}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 8, color: '#fff', fontWeight: 700,
              }}>✓</div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: T.font, fontWeight: 700, fontSize: 13, color: T.text,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{user.name}</div>
            <div style={{
              fontFamily: T.mono, fontSize: 9, color: T.dim,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{user.email}</div>
          </div>
          <Ring pct={prog} color={mod.color} size={34} stroke={3} />
        </button>

        {/* Progress bar */}
        <div style={{ background: T.bg2, borderRadius: 100, height: 2.5, marginBottom: 6, overflow: 'hidden' }}>
          <div style={{
            background: `linear-gradient(90deg, ${mod.color}, ${T.success})`,
            height: '100%', borderRadius: 100, width: `${prog}%`,
            transition: 'width 0.5s ease',
          }} />
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: T.mono, fontSize: 9, color: T.dim }}>
            <span style={{ color: T.muted, fontWeight: 700 }}>{completedCount}</span>/{TOTAL_LESSONS} DONE
          </span>
          {totalPossible > 0 ? (
            <span style={{ fontFamily: T.mono, fontSize: 9, color: overallGrade.color, fontWeight: 700 }}>
              {overallPct}% · {overallGrade.letter}
            </span>
          ) : (
            <span style={{ fontFamily: T.mono, fontSize: 9, color: T.faint }}>NO QUIZZES YET</span>
          )}
        </div>
      </div>

      {/* ── Module / lesson list ── */}
      <nav style={{ flex: 1, overflowY: 'auto', paddingBottom: 4 }}>
        {MODULES.map((m, mi) => {
          const isActive  = activeM === mi;
          const modLocked = !isLessonUnlocked(mi, 0, completed, quizScores);
          const lessonsDone = m.lessons.filter((_, li) => completed[`${mi}-${li}`]).length;
          const modComplete = lessonsDone === m.lessons.length;

          let mC = 0, mT = 0;
          m.lessons.forEach((_, li) => {
            const s = quizScores[`${mi}-${li}`];
            if (s) { mC += s.score; mT += s.total; }
          });
          const mPct = mT > 0 ? Math.round(mC / mT * 100) : null;

          return (
            <ModuleSection
              key={mi} m={m} mi={mi} isActive={isActive}
              activeL={activeL} completed={completed} quizScores={quizScores}
              mPct={mPct} modComplete={modComplete} modLocked={modLocked}
              lessonsDone={lessonsDone} onNavigate={onNavigate}
            />
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div style={{
        padding: '10px 12px', borderTop: `1px solid ${T.border}`,
        flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        {canSeeCert && (
          <button onClick={onCert} style={{
            width: '100%',
            background: `linear-gradient(135deg, ${T.accentDeep}, ${T.accent})`,
            border: 'none', color: '#fff',
            borderRadius: 9, padding: '10px', cursor: 'pointer',
            fontFamily: T.font, fontWeight: 700, fontSize: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            boxShadow: '0 4px 14px rgba(99,102,241,0.35)', transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.45)'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(99,102,241,0.35)'; }}
          >
            🎓 {completedCount === TOTAL_LESSONS ? 'Claim Certificate' : 'My Certificate'}
          </button>
        )}
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={onProfile} style={{
            flex: 1, background: T.bg1, border: `1px solid ${T.border}`,
            color: T.muted, borderRadius: 8, padding: '8px 0', cursor: 'pointer',
            fontFamily: T.font, fontSize: 11, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = T.accent; e.currentTarget.style.borderColor = T.accentBorder; e.currentTarget.style.background = T.accentLight; }}
            onMouseLeave={e => { e.currentTarget.style.color = T.muted; e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.bg1; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            Profile
          </button>
          <button onClick={onLogout} style={{
            flex: 1, background: T.bg1, border: `1px solid ${T.border}`,
            color: T.muted, borderRadius: 8, padding: '8px 0', cursor: 'pointer',
            fontFamily: T.font, fontSize: 11, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = T.error; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)'; e.currentTarget.style.background = 'rgba(248,113,113,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = T.muted; e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.bg1; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}

/* ── Module Section ── */
function ModuleSection({ m, mi, isActive, activeL, completed, quizScores, mPct, modComplete, modLocked, lessonsDone, onNavigate }) {
  return (
    <div>
      {/* Module header row */}
      <button
        onClick={() => { if (!modLocked) onNavigate(mi, 0); }}
        style={{
          width: '100%', background: isActive ? `${m.color}08` : 'transparent',
          border: 'none', borderLeft: `2.5px solid ${isActive ? m.color : 'transparent'}`,
          padding: '10px 14px 10px 12px',
          cursor: modLocked ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', gap: 9, textAlign: 'left',
          transition: 'all 0.15s', opacity: modLocked ? 0.4 : 1,
        }}
        onMouseEnter={e => { if (!isActive && !modLocked) e.currentTarget.style.background = `${m.color}05`; }}
        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
      >
        {/* Icon */}
        <div style={{
          width: 26, height: 26, borderRadius: 7, flexShrink: 0,
          background: modLocked ? T.bg3 : `${m.color}12`,
          border: `1px solid ${modLocked ? T.faint : `${m.color}25`}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, color: modLocked ? T.dim : m.color,
        }}>
          {modLocked ? '🔒' : m.icon}
        </div>

        {/* Title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: T.mono, fontSize: 8.5, color: modLocked ? T.dim : m.color, letterSpacing: '0.1em', marginBottom: 1.5 }}>
            {m.tag}
          </div>
          <div style={{
            fontFamily: T.font, fontWeight: 600, fontSize: 11.5,
            color: isActive ? T.text : T.muted,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{m.title}</div>
        </div>

        {/* Status badge */}
        {modLocked ? (
          <span style={{ fontFamily: T.mono, fontSize: 8, color: T.faint, flexShrink: 0, letterSpacing: '0.06em' }}>LOCKED</span>
        ) : modComplete ? (
          <div style={{
            background: `${T.success}14`, border: `1px solid ${T.success}30`,
            borderRadius: 4, padding: '2px 6px',
            fontFamily: T.mono, fontSize: 8, color: T.success, flexShrink: 0,
          }}>✓</div>
        ) : mPct !== null ? (
          <span style={{ fontFamily: T.mono, fontSize: 9.5, color: getGrade(mPct).color, fontWeight: 700, flexShrink: 0 }}>
            {mPct}%
          </span>
        ) : lessonsDone > 0 ? (
          <span style={{ fontFamily: T.mono, fontSize: 8, color: T.dim, flexShrink: 0 }}>
            {lessonsDone}/{m.lessons.length}
          </span>
        ) : null}
      </button>

      {/* Lesson list — only shown for active module */}
      {isActive && (
        <div style={{ background: `${m.color}04`, borderLeft: `2.5px solid ${m.color}20` }}>
          {m.lessons.map((l, li) => {
            const lk     = `${mi}-${li}`;
            const isDone = !!completed[lk];
            const qs     = quizScores[lk];
            const isAct  = activeL === li;
            const locked = !isLessonUnlocked(mi, li, completed, quizScores);
            const qPct   = qs ? Math.round(qs.score / qs.total * 100) : null;
            const qGrade = qPct !== null ? getGrade(qPct) : null;

            return (
              <button key={li}
                onClick={() => { if (!locked) onNavigate(mi, li); }}
                style={{
                  width: '100%', background: isAct ? `${m.color}10` : 'transparent',
                  border: 'none', borderLeft: `2px solid ${isAct ? m.color : 'transparent'}`,
                  padding: '7px 14px 7px 40px',
                  cursor: locked ? 'not-allowed' : 'pointer',
                  textAlign: 'left', transition: 'background 0.1s',
                  display: 'flex', alignItems: 'center', gap: 9,
                  opacity: locked ? 0.38 : 1,
                }}
                onMouseEnter={e => { if (!isAct && !locked) e.currentTarget.style.background = `${m.color}07`; }}
                onMouseLeave={e => { if (!isAct) e.currentTarget.style.background = 'transparent'; }}
              >
                {/* Status indicator */}
                {locked ? (
                  <div style={{
                    width: 14, height: 14, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, color: T.faint,
                  }}>🔒</div>
                ) : (
                  <div style={{
                    width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                    border: `1.5px solid ${isDone ? m.color : T.faint}`,
                    background: isDone ? `${m.color}20` : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 7.5, color: m.color, fontWeight: 700,
                  }}>
                    {isDone ? '✓' : ''}
                  </div>
                )}

                {/* Lesson info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: T.font, fontSize: 12,
                    color: locked ? T.faint : isAct ? T.text : (isDone ? T.muted : T.muted),
                    fontWeight: isAct ? 600 : 400,
                    lineHeight: 1.35,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{l.title}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 1.5, alignItems: 'center' }}>
                    <span style={{ fontFamily: T.mono, fontSize: 8.5, color: T.faint }}>{l.dur}</span>
                    {qs && !locked && qGrade && (
                      <span style={{
                        fontFamily: T.mono, fontSize: 8.5,
                        color: qGrade.color, fontWeight: 700,
                      }}>
                        {qs.score}/{qs.total}
                      </span>
                    )}
                  </div>
                </div>

                {/* Lesson number on hover / active */}
                {isAct && (
                  <span style={{ fontFamily: T.mono, fontSize: 8.5, color: m.color, flexShrink: 0 }}>
                    {String(li + 1).padStart(2, '0')}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
