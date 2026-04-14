'use client';
import { T, getGrade } from '@/lib/theme';
import { MODULES, TOTAL_LESSONS } from '@/data/courseData';
import { Ring } from '@/components/ui';

export default function Sidebar({
  user, activeM, activeL, progress, quizScores,
  onNavigate, onCert, onLogout, isMobile, isOpen,
}) {
  const { completed } = progress;
  const completedCount = Object.keys(completed).length;
  const prog = Math.round(completedCount / TOTAL_LESSONS * 100);

  const totalCorrect  = Object.values(quizScores).reduce((a, v) => a + v.score, 0);
  const totalPossible = Object.values(quizScores).reduce((a, v) => a + v.total, 0);
  const overallPct    = totalPossible > 0 ? Math.round(totalCorrect / totalPossible * 100) : 0;
  const overallGrade  = getGrade(overallPct);
  const mod           = MODULES[activeM];
  const allDone       = completedCount === TOTAL_LESSONS;

  return (
    <aside style={{
      width: 272, minWidth: 272, background: T.bg, borderRight: `1px solid ${T.border}`,
      display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 12px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        {/* User info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%', background: `${mod.color}15`,
            border: `1.5px solid ${mod.color}30`, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontFamily: T.font, fontWeight: 700, fontSize: 14,
            color: mod.color, flexShrink: 0,
          }}>
            {user.name.charAt(0).toUpperCase()}
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
          <Ring pct={prog} color={mod.color} size={36} stroke={3} />
        </div>

        {/* Progress bar */}
        <div style={{ background: T.bg2, borderRadius: 100, height: 3 }}>
          <div style={{
            background: `linear-gradient(90deg, ${mod.color}, ${T.success})`,
            height: 3, borderRadius: 100, width: `${prog}%`, transition: 'width 0.5s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
          <span style={{ fontFamily: T.mono, fontSize: 9, color: T.dim }}>
            {completedCount}/{TOTAL_LESSONS} LESSONS
          </span>
          {totalPossible > 0 && (
            <span style={{ fontFamily: T.mono, fontSize: 9, color: overallGrade.color }}>
              AVG {overallPct}% · {overallGrade.letter}
            </span>
          )}
        </div>
      </div>

      {/* Module / lesson list */}
      <nav style={{ flex: 1, overflowY: 'auto', paddingTop: 6 }}>
        {MODULES.map((m, mi) => {
          const isActive = activeM === mi;
          let mC = 0, mT = 0;
          m.lessons.forEach((_, li) => {
            const s = quizScores[`${mi}-${li}`];
            if (s) { mC += s.score; mT += s.total; }
          });
          const mPct = mT > 0 ? Math.round(mC / mT * 100) : null;
          const allLessonsDone = m.lessons.every((_, li) => completed[`${mi}-${li}`]);

          return (
            <ModuleSection
              key={mi} m={m} mi={mi} isActive={isActive}
              activeL={activeL} completed={completed} quizScores={quizScores}
              mPct={mPct} allLessonsDone={allLessonsDone}
              onNavigate={onNavigate}
            />
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '10px 14px', borderTop: `1px solid ${T.border}`, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {allDone && (
          <button onClick={onCert} style={{
            width: '100%', background: T.accent, border: 'none', color: '#fff',
            borderRadius: 8, padding: 10, cursor: 'pointer',
            fontFamily: T.font, fontWeight: 700, fontSize: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            boxShadow: '0 4px 12px rgba(99,102,241,0.35)', transition: 'all 0.15s',
          }}>
            🎓 Claim Certificate
          </button>
        )}
        <button onClick={onLogout} style={{
          width: '100%', background: 'none', border: `1px solid ${T.border}`,
          color: T.dim, borderRadius: 7, padding: '7px', cursor: 'pointer',
          fontFamily: T.font, fontSize: 11, transition: 'all 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.color = T.error; e.currentTarget.style.borderColor = 'rgba(220,38,38,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = T.dim; e.currentTarget.style.borderColor = T.border; }}
        >
          Log Out
        </button>
      </div>
    </aside>
  );
}

function ModuleSection({ m, mi, isActive, activeL, completed, quizScores, mPct, allLessonsDone, onNavigate }) {
  return (
    <div>
      <button
        onClick={() => onNavigate(mi, 0)}
        style={{
          width: '100%', background: isActive ? `${m.color}07` : 'transparent',
          border: 'none', borderLeft: `2.5px solid ${isActive ? m.color : 'transparent'}`,
          padding: '10px 14px', cursor: 'pointer', display: 'flex',
          alignItems: 'center', gap: 10, textAlign: 'left', transition: 'all 0.15s',
        }}
        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(0,0,0,0.025)'; }}
        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
      >
        <div style={{
          width: 28, height: 28, borderRadius: 7, background: `${m.color}12`,
          border: `1px solid ${m.color}25`, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 12, color: m.color, flexShrink: 0,
        }}>{m.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--mono, monospace)', fontSize: 9, color: m.color, letterSpacing: '0.1em', marginBottom: 2 }}>
            {m.tag}
          </div>
          <div style={{
            fontFamily: 'var(--font, sans-serif)', fontWeight: 600, fontSize: 12,
            color: isActive ? T.text : T.muted,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{m.title}</div>
        </div>
        {mPct !== null && (
          <span style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, color: getGrade(mPct).color, flexShrink: 0 }}>
            {mPct}%
          </span>
        )}
        {allLessonsDone && mPct === null && (
          <span style={{ fontSize: 12, color: T.success, flexShrink: 0 }}>✓</span>
        )}
      </button>

      {/* Always show lessons for active module */}
      {isActive && (
        <div style={{ background: T.bg1 }}>
          {m.lessons.map((l, li) => {
            const lk  = `${mi}-${li}`;
            const isDone = completed[lk];
            const qs  = quizScores[lk];
            const isAct = activeL === li;
            return (
              <button key={li}
                onClick={() => onNavigate(mi, li)}
                style={{
                  width: '100%', background: isAct ? `${m.color}07` : 'transparent',
                  border: 'none', borderLeft: `2.5px solid ${isAct ? m.color : 'transparent'}`,
                  padding: '8px 14px 8px 46px', cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.1s', display: 'flex', alignItems: 'center', gap: 8,
                }}
                onMouseEnter={e => { if (!isAct) e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; }}
                onMouseLeave={e => { if (!isAct) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{
                  width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                  border: `1.5px solid ${isDone ? m.color : T.faint}`,
                  background: isDone ? `${m.color}18` : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 8, color: m.color,
                }}>
                  {isDone ? '✓' : ''}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: 'var(--font, sans-serif)', fontSize: 12,
                    color: isAct ? T.text : T.muted, lineHeight: 1.35,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{l.title}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 1 }}>
                    <span style={{ fontFamily: 'var(--mono, monospace)', fontSize: 9, color: T.faint }}>{l.dur}</span>
                    {qs && (
                      <span style={{
                        fontFamily: 'var(--mono, monospace)', fontSize: 9,
                        color: getGrade(Math.round(qs.score / qs.total * 100)).color,
                      }}>
                        {qs.score}/{qs.total}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
