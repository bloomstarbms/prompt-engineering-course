'use client';
import { useState } from 'react';
import { T, getGrade } from '@/lib/theme';
import { QUIZZES } from '@/data/courseData';
import { AccentBtn, GhostBtn } from '@/components/ui';

export default function QuizView({ mod, lKey, prevScore, onDone, onBack }) {
  const quiz = QUIZZES[lKey];
  const [answers, setAnswers]   = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [current, setCurrent]   = useState(0);

  if (!quiz) { onBack(); return null; }

  const q = quiz.questions[current];
  const isLast = current === quiz.questions.length - 1;
  const allAnswered = quiz.questions.every((_, i) => answers[i] !== undefined);
  const correctCount = quiz.questions.filter((q, i) => answers[i] === q.a).length;
  const pct   = Math.round(correctCount / quiz.questions.length * 100);
  const grade = submitted ? getGrade(pct) : null;

  function submit() {
    setSubmitted(true);
    onDone({ score: correctCount, total: quiz.questions.length });
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
            <div style={{
              background: T.bg1, border: `1.5px solid ${grade.color}30`,
              borderRadius: 16, padding: 'clamp(24px,4vw,32px)',
              textAlign: 'center', marginBottom: 16,
            }}>
              <div style={{
                fontFamily: T.font, fontWeight: 800, fontSize: 72,
                color: grade.color, lineHeight: 1, letterSpacing: '-0.04em',
                animation: 'countPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
              }}>
                {grade.letter}
              </div>
              <div style={{ fontFamily: T.font, fontWeight: 700, fontSize: 28, color: T.text, margin: '8px 0 4px' }}>
                {pct}%
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 12, color: T.dim }}>
                {correctCount} / {quiz.questions.length} correct · {grade.label}
              </div>
            </div>

            {/* Answer review */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
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

            <AccentBtn onClick={onBack} fullWidth style={{ padding: 14, fontSize: 15 }}>
              Continue Learning →
            </AccentBtn>
          </div>
        )}
      </div>
    </div>
  );
}
