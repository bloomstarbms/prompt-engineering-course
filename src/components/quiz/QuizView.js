'use client';
import { useState } from 'react';
import { T, getGrade } from '@/lib/theme';
import { QUIZZES, PASS_THRESHOLD } from '@/data/courseData';
import { AccentBtn, GhostBtn } from '@/components/ui';

export default function QuizView({ mod, lKey, prevScore, onDone, onBack }) {
  const quiz = QUIZZES[lKey];
  const [answers, setAnswers]     = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [current, setCurrent]     = useState(0);

  if (!quiz) { onBack(); return null; }

  const q            = quiz.questions[current];
  const isLast       = current === quiz.questions.length - 1;
  const allAnswered  = quiz.questions.every((_, i) => answers[i] !== undefined);
  const correctCount = quiz.questions.filter((q, i) => answers[i] === q.a).length;
  const pct          = Math.round(correctCount / quiz.questions.length * 100);
  const passed       = pct >= PASS_THRESHOLD;
  const grade        = submitted ? getGrade(pct) : null;

  function submit() {
    setSubmitted(true);
    // Do NOT call onDone yet — wait for user to click Continue or Retry
  }

  function handleContinue() {
    onDone({ score: correctCount, total: quiz.questions.length, passed });
  }

  function handleRetry() {
    setSubmitted(false);
    setAnswers({});
    setCurrent(0);
  }

  return (
    <div style={{
      minHeight: '100vh', background: T.bg,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: 'clamp(24px,5vw,48px) clamp(16px,5vw,24px)',
    }}>
      <div style={{ width: '100%', maxWidth: 580 }}>

        {/* Back */}
        <button onClick={onBack} style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
          color: T.muted, cursor: 'pointer', fontFamily: T.font, fontSize: 13, padding: 0, marginBottom: 28,
        }}>← Back to Lesson</button>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7, background: `${mod.color}12`,
              border: `1px solid ${mod.color}28`, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 13, color: mod.color,
            }}>{mod.icon}</div>
            <span style={{ fontFamily: T.mono, fontSize: 10, color: mod.color, letterSpacing: '0.1em' }}>
              MODULE {mod.tag} · QUIZ
            </span>
            {prevScore && !submitted && (
              <span style={{
                marginLeft: 'auto', fontFamily: T.mono, fontSize: 10,
                color: getGrade(Math.round(prevScore.score / prevScore.total * 100)).color,
              }}>
                Previous: {prevScore.score}/{prevScore.total}
              </span>
            )}
            {!submitted && (
              <span style={{
                marginLeft: prevScore ? 8 : 'auto',
                fontFamily: T.mono, fontSize: 9, color: T.dim, letterSpacing: '0.06em',
              }}>
                PASS ≥ {PASS_THRESHOLD}%
              </span>
            )}
          </div>

          {/* Progress track */}
          <div style={{ display: 'flex', gap: 4 }}>
            {quiz.questions.map((_, i) => (
              <button key={i} onClick={() => !submitted && setCurrent(i)} style={{
                flex: 1, height: 4, borderRadius: 2, border: 'none',
                cursor: submitted ? 'default' : 'pointer',
                background: submitted
                  ? (answers[i] === quiz.questions[i].a ? T.success : T.error)
                  : (i === current ? mod.color : answers[i] !== undefined ? `${mod.color}55` : T.bg3),
                transition: 'all 0.2s',
              }} />
            ))}
          </div>
        </div>

        {!submitted ? (
          <div style={{ animation: 'fadeUp 0.3s ease both' }}>
            {/* Question card */}
            <div style={{
              background: T.bg1, border: `1px solid ${T.border}`,
              borderRadius: 14, padding: 'clamp(20px,4vw,28px)', marginBottom: 14,
            }}>
              <div style={{ fontFamily: T.mono, fontSize: 10, color: T.dim, letterSpacing: '0.1em', marginBottom: 12 }}>
                QUESTION {current + 1} OF {quiz.questions.length}
              </div>
              <div style={{
                fontFamily: T.font, fontWeight: 600,
                fontSize: 'clamp(14px,2.5vw,16px)', color: T.text, lineHeight: 1.55,
              }}>
                {q.q}
              </div>
            </div>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {q.opts.map((opt, oi) => {
                const sel = answers[current] === oi;
                return (
                  <button key={oi} onClick={() => setAnswers(p => ({ ...p, [current]: oi }))}
                    style={{
                      background: sel ? `${mod.color}0d` : T.bg,
                      border: `1.5px solid ${sel ? mod.color : T.border}`,
                      borderRadius: 10, padding: '13px 16px', textAlign: 'left',
                      cursor: 'pointer', color: sel ? T.text : T.muted,
                      fontFamily: T.font, fontSize: 14, transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}
                    onMouseEnter={e => { if (!sel) { e.currentTarget.style.borderColor = `${mod.color}60`; e.currentTarget.style.background = `${mod.color}05`; } }}
                    onMouseLeave={e => { if (!sel) { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.bg; } }}
                  >
                    <span style={{
                      width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                      border: `1.5px solid ${sel ? mod.color : T.faint}`,
                      background: sel ? `${mod.color}18` : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontFamily: T.mono, color: sel ? mod.color : T.dim,
                    }}>
                      {sel ? '●' : String.fromCharCode(65 + oi)}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* Nav */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <GhostBtn onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}>
                ← Prev
              </GhostBtn>
              {isLast
                ? <AccentBtn onClick={submit} disabled={!allAnswered}>Submit Quiz →</AccentBtn>
                : <AccentBtn onClick={() => setCurrent(c => c + 1)} disabled={answers[current] === undefined}>Next →</AccentBtn>
              }
            </div>
          </div>
        ) : (
          /* Results */
          <div style={{ animation: 'fadeUp 0.4s ease both' }}>

            {/* ── PASSED / FAILED Banner ── */}
            <div style={{
              borderRadius: 14, padding: '20px 24px', marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 16,
              background: passed
                ? 'linear-gradient(135deg, rgba(5,150,105,0.12) 0%, rgba(5,150,105,0.06) 100%)'
                : 'linear-gradient(135deg, rgba(220,38,38,0.12) 0%, rgba(220,38,38,0.06) 100%)',
              border: `2px solid ${passed ? 'rgba(5,150,105,0.4)' : 'rgba(220,38,38,0.4)'}`,
              animation: 'fadeUp 0.35s ease both',
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                background: passed ? 'rgba(5,150,105,0.15)' : 'rgba(220,38,38,0.15)',
                border: `2px solid ${passed ? 'rgba(5,150,105,0.5)' : 'rgba(220,38,38,0.5)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24,
              }}>
                {passed ? '✓' : '✗'}
              </div>
              <div>
                <div style={{
                  fontFamily: T.font, fontWeight: 800, fontSize: 22,
                  color: passed ? T.success : T.error,
                  letterSpacing: '-0.02em', lineHeight: 1,
                }}>
                  {passed ? 'PASSED' : 'FAILED'}
                </div>
                <div style={{
                  fontFamily: T.mono, fontSize: 11, color: T.dim, marginTop: 4, letterSpacing: '0.04em',
                }}>
                  {pct}% · {correctCount}/{quiz.questions.length} correct · need {PASS_THRESHOLD}% to pass
                </div>
              </div>
              <div style={{
                marginLeft: 'auto',
                fontFamily: T.font, fontWeight: 800, fontSize: 52,
                color: grade.color, lineHeight: 1, letterSpacing: '-0.04em',
                animation: 'countPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
              }}>
                {grade.letter}
              </div>
            </div>

            {/* Answer review */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
              {quiz.questions.map((q, i) => {
                const correct = answers[i] === q.a;
                return (
                  <div key={i} style={{
                    background: correct ? 'rgba(5,150,105,0.04)' : 'rgba(220,38,38,0.04)',
                    border: `1px solid ${correct ? 'rgba(5,150,105,0.2)' : 'rgba(220,38,38,0.2)'}`,
                    borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 12,
                  }}>
                    <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{correct ? '✅' : '❌'}</span>
                    <div>
                      <div style={{ fontFamily: T.font, fontSize: 13, color: T.text, lineHeight: 1.5 }}>{q.q}</div>
                      {!correct && (
                        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.success, marginTop: 4 }}>
                          ✓ {q.opts[q.a]}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action buttons */}
            {passed ? (
              <AccentBtn onClick={handleContinue} fullWidth style={{ padding: 14, fontSize: 15 }}>
                Continue Learning →
              </AccentBtn>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button onClick={handleRetry} style={{
                  width: '100%', background: 'rgba(220,38,38,0.08)',
                  border: '1.5px solid rgba(220,38,38,0.35)',
                  color: T.error, borderRadius: 10, padding: 14, cursor: 'pointer',
                  fontFamily: T.font, fontWeight: 700, fontSize: 15,
                  transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.14)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.08)'; }}
                >
                  ↺ Retry Quiz
                </button>
                <button onClick={onBack} style={{
                  width: '100%', background: 'none',
                  border: `1px solid ${T.border}`,
                  color: T.muted, borderRadius: 10, padding: 11, cursor: 'pointer',
                  fontFamily: T.font, fontWeight: 600, fontSize: 13,
                  transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.color = T.text; }}
                  onMouseLeave={e => { e.currentTarget.style.color = T.muted; }}
                >
                  ← Back to Lesson
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
