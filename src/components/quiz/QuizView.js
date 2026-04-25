'use client';
import { useState } from 'react';
import { T, getGrade } from '@/lib/theme';
import { QUIZZES, PASS_THRESHOLD } from '@/data/courseData';
import { AccentBtn } from '@/components/ui';

/* ─── Letter badge A / B / C / D ───────────────────────────────────────────── */
function LetterBadge({ letter, selected, correct, incorrect, color }) {
  let bg = 'transparent';
  let border = T.faint;
  let textColor = T.dim;

  if (selected && !correct && !incorrect) { bg = `${color}20`; border = color; textColor = color; }
  if (correct)  { bg = 'rgba(52,211,153,0.18)'; border = '#34d399'; textColor = '#34d399'; }
  if (incorrect) { bg = 'rgba(248,113,113,0.18)'; border = '#f87171'; textColor = '#f87171'; }

  return (
    <span style={{
      width: 30, height: 30, borderRadius: 8, flexShrink: 0,
      border: `1.5px solid ${border}`, background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontFamily: T.mono, fontWeight: 700, color: textColor,
      transition: 'all 0.15s',
    }}>
      {letter}
    </span>
  );
}

/* ─── Single option button ──────────────────────────────────────────────────── */
function OptionBtn({ label, text, selected, disabled, onClick, color }) {
  const [hover, setHover] = useState(false);
  const active = selected || hover;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: '100%', textAlign: 'left', cursor: disabled ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', gap: 14,
        background: selected ? `${color}0e` : hover ? `${color}06` : T.bg1,
        border: `1.5px solid ${selected ? color : hover ? `${color}50` : T.border}`,
        borderRadius: 12, padding: '14px 18px',
        fontFamily: T.font, fontSize: 14, color: selected ? T.text : T.muted,
        transition: 'all 0.15s',
        boxShadow: selected ? `0 0 0 3px ${color}10` : 'none',
      }}
    >
      <LetterBadge letter={label} selected={selected} color={color} />
      <span style={{ lineHeight: 1.5, flex: 1 }}>{text}</span>
      {selected && (
        <span style={{
          width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
          background: color, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 700,
        }}>✓</span>
      )}
    </button>
  );
}

/* ─── Reviewed option (results screen) ─────────────────────────────────────── */
function ReviewOption({ label, text, isCorrect, isSelected }) {
  const isRight = isCorrect;
  const isWrong = isSelected && !isCorrect;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 14px', borderRadius: 10,
      background: isRight ? 'rgba(52,211,153,0.06)' : isWrong ? 'rgba(248,113,113,0.06)' : 'transparent',
      border: `1px solid ${isRight ? 'rgba(52,211,153,0.22)' : isWrong ? 'rgba(248,113,113,0.22)' : T.border}`,
      opacity: (!isRight && !isWrong) ? 0.45 : 1,
    }}>
      <LetterBadge
        letter={label}
        correct={isRight}
        incorrect={isWrong}
        color={T.accent}
      />
      <span style={{
        fontFamily: T.font, fontSize: 13, color: isRight ? '#34d399' : isWrong ? '#f87171' : T.muted,
        flex: 1, lineHeight: 1.5,
      }}>{text}</span>
      {isRight && <span style={{ fontSize: 13 }}>✓</span>}
      {isWrong && <span style={{ fontSize: 13 }}>✗</span>}
    </div>
  );
}

/* ─── Main component ────────────────────────────────────────────────────────── */
export default function QuizView({ mod, lKey, prevScore, onDone, onBack }) {
  const quiz = QUIZZES[lKey];
  const [answers,   setAnswers]   = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [current,   setCurrent]   = useState(0);
  const [expanded,  setExpanded]  = useState(null); // which review card is open

  if (!quiz) { onBack(); return null; }

  const q           = quiz.questions[current];
  const isFirst     = current === 0;
  const isLast      = current === quiz.questions.length - 1;
  const allAnswered = quiz.questions.every((_, i) => answers[i] !== undefined);
  const answeredCnt = Object.keys(answers).length;

  const correctCount = quiz.questions.filter((qq, i) => answers[i] === qq.a).length;
  const pct          = Math.round(correctCount / quiz.questions.length * 100);
  const passed       = pct >= PASS_THRESHOLD;
  const grade        = submitted ? getGrade(pct) : null;

  const prevPct = prevScore
    ? Math.round(prevScore.score / prevScore.total * 100)
    : null;

  function submit() { setSubmitted(true); setExpanded(null); }
  function handleContinue() { onDone({ score: correctCount, total: quiz.questions.length, passed }); }
  function handleRetry() { setSubmitted(false); setAnswers({}); setCurrent(0); setExpanded(null); }

  /* ── Dot-progress strip ── */
  const dots = quiz.questions.map((_, i) => {
    let bg = T.bg3;
    if (submitted) bg = answers[i] === quiz.questions[i].a ? '#34d399' : '#f87171';
    else if (i === current) bg = mod.color;
    else if (answers[i] !== undefined) bg = `${mod.color}60`;
    return { i, bg };
  });

  return (
    <>
      <style>{`
        @keyframes fadeUp   { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
        @keyframes scalePop { from { opacity:0; transform:scale(0.7) }       to { opacity:1; transform:scale(1) }    }
        @keyframes gradeIn  { from { opacity:0; transform:scale(0.5) rotate(-12deg) } to { opacity:1; transform:scale(1) rotate(0deg) } }
        @keyframes slideIn  { from { opacity:0; transform:translateX(-10px) } to { opacity:1; transform:translateX(0) } }
        .qv-option:hover:not(:disabled) { transform: translateX(2px); }
      `}</style>

      <div style={{
        minHeight: '100vh', background: T.bg,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: 'clamp(20px,5vw,44px) clamp(16px,5vw,24px)',
      }}>
        <div style={{ width: '100%', maxWidth: 600 }}>

          {/* ── Back link ── */}
          <button onClick={onBack} style={{
            display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
            color: T.muted, cursor: 'pointer', fontFamily: T.font, fontSize: 13,
            padding: '6px 0', marginBottom: 24, transition: 'color 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = T.text}
            onMouseLeave={e => e.currentTarget.style.color = T.muted}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
              <path d="M9 2L4.5 7L9 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Lesson
          </button>

          {/* ── Quiz header card ── */}
          <div style={{
            background: T.bg1, border: `1px solid ${T.border}`,
            borderRadius: 16, padding: '18px 22px', marginBottom: 20,
            animation: 'fadeUp 0.25s ease both',
          }}>
            {/* Module + title row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: `${mod.color}15`, border: `1.5px solid ${mod.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, flexShrink: 0,
              }}>{mod.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: T.mono, fontSize: 9, color: mod.color, letterSpacing: '0.12em', marginBottom: 1 }}>
                  MODULE {mod.tag} · QUIZ
                </div>
                <div style={{ fontFamily: T.display, fontWeight: 700, fontSize: 15, color: T.text, lineHeight: 1.2 }}>
                  {mod.title}
                </div>
              </div>
              {/* Stats pills */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {!submitted && prevPct !== null && (
                  <div style={{
                    padding: '4px 10px', borderRadius: 20,
                    background: `${getGrade(prevPct).color}15`,
                    border: `1px solid ${getGrade(prevPct).color}35`,
                    fontFamily: T.mono, fontSize: 10, color: getGrade(prevPct).color,
                  }}>
                    Best: {prevPct}%
                  </div>
                )}
                {!submitted && (
                  <div style={{
                    padding: '4px 10px', borderRadius: 20,
                    background: T.bg3, border: `1px solid ${T.border}`,
                    fontFamily: T.mono, fontSize: 10, color: T.dim,
                  }}>
                    Pass ≥{PASS_THRESHOLD}%
                  </div>
                )}
                {submitted && (
                  <div style={{
                    padding: '4px 10px', borderRadius: 20,
                    background: passed ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
                    border: `1px solid ${passed ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`,
                    fontFamily: T.mono, fontSize: 10, color: passed ? '#34d399' : '#f87171',
                  }}>
                    {pct}% · {passed ? 'PASSED' : 'FAILED'}
                  </div>
                )}
              </div>
            </div>

            {/* Progress dots */}
            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              {dots.map(({ i, bg }) => (
                <button key={i}
                  onClick={() => !submitted && setCurrent(i)}
                  title={`Question ${i + 1}`}
                  style={{
                    flex: 1, height: submitted ? 6 : (i === current ? 6 : 4),
                    borderRadius: 3, border: 'none', background: bg,
                    cursor: submitted ? 'default' : 'pointer',
                    transition: 'all 0.2s',
                  }}
                />
              ))}
            </div>

            {/* Answered counter (pre-submit) */}
            {!submitted && (
              <div style={{
                marginTop: 10, fontFamily: T.mono, fontSize: 10, color: T.dim,
                display: 'flex', justifyContent: 'space-between',
              }}>
                <span>{answeredCnt} of {quiz.questions.length} answered</span>
                {answeredCnt > 0 && answeredCnt < quiz.questions.length && (
                  <span style={{ color: mod.color }}>
                    {quiz.questions.length - answeredCnt} remaining
                  </span>
                )}
                {allAnswered && (
                  <span style={{ color: T.success }}>✓ All answered — ready to submit</span>
                )}
              </div>
            )}
          </div>

          {/* ══════════════ QUESTION VIEW ══════════════ */}
          {!submitted && (
            <div key={current} style={{ animation: 'slideIn 0.2s ease both' }}>

              {/* Question card */}
              <div style={{
                background: T.bg1, border: `1px solid ${T.border}`,
                borderRadius: 16, padding: 'clamp(22px,4vw,30px)',
                marginBottom: 12,
              }}>
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                }}>
                  {/* Question number badge */}
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                    background: `${mod.color}18`, border: `1.5px solid ${mod.color}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: T.mono, fontWeight: 700, fontSize: 13, color: mod.color,
                    marginTop: 1,
                  }}>
                    {String(current + 1).padStart(2, '0')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: T.mono, fontSize: 9, color: T.dim,
                      letterSpacing: '0.1em', marginBottom: 8,
                    }}>
                      QUESTION {current + 1} OF {quiz.questions.length}
                    </div>
                    <div style={{
                      fontFamily: T.font, fontWeight: 600,
                      fontSize: 'clamp(15px,2.5vw,17px)', color: T.text, lineHeight: 1.6,
                    }}>
                      {q.q}
                    </div>
                  </div>
                </div>
              </div>

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
                {q.opts.map((opt, oi) => (
                  <OptionBtn
                    key={oi}
                    label={String.fromCharCode(65 + oi)}
                    text={opt}
                    selected={answers[current] === oi}
                    color={mod.color}
                    onClick={() => setAnswers(p => ({ ...p, [current]: oi }))}
                  />
                ))}
              </div>

              {/* Navigation */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setCurrent(c => Math.max(0, c - 1))}
                  disabled={isFirst}
                  style={{
                    flex: 1, padding: '12px 0', borderRadius: 10,
                    background: T.bg1, border: `1px solid ${T.border}`,
                    color: isFirst ? T.dim : T.muted, cursor: isFirst ? 'not-allowed' : 'pointer',
                    fontFamily: T.font, fontWeight: 600, fontSize: 14,
                    transition: 'all 0.15s', opacity: isFirst ? 0.4 : 1,
                  }}
                  onMouseEnter={e => { if (!isFirst) e.currentTarget.style.color = T.text; }}
                  onMouseLeave={e => { if (!isFirst) e.currentTarget.style.color = T.muted; }}
                >
                  ← Prev
                </button>

                {isLast ? (
                  <button
                    onClick={submit}
                    disabled={!allAnswered}
                    style={{
                      flex: 2, padding: '12px 0', borderRadius: 10,
                      background: allAnswered
                        ? `linear-gradient(135deg, ${T.accentDeep} 0%, ${T.accent} 100%)`
                        : T.bg2,
                      border: `1.5px solid ${allAnswered ? T.accent : T.border}`,
                      color: allAnswered ? '#fff' : T.dim,
                      cursor: allAnswered ? 'pointer' : 'not-allowed',
                      fontFamily: T.font, fontWeight: 700, fontSize: 14,
                      transition: 'all 0.2s', opacity: allAnswered ? 1 : 0.5,
                      boxShadow: allAnswered ? T.glow : 'none',
                    }}
                  >
                    Submit Quiz →
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrent(c => c + 1)}
                    disabled={answers[current] === undefined}
                    style={{
                      flex: 2, padding: '12px 0', borderRadius: 10,
                      background: answers[current] !== undefined
                        ? `linear-gradient(135deg, ${T.accentDeep} 0%, ${T.accent} 100%)`
                        : T.bg2,
                      border: `1.5px solid ${answers[current] !== undefined ? T.accent : T.border}`,
                      color: answers[current] !== undefined ? '#fff' : T.dim,
                      cursor: answers[current] !== undefined ? 'pointer' : 'not-allowed',
                      fontFamily: T.font, fontWeight: 700, fontSize: 14,
                      transition: 'all 0.2s', opacity: answers[current] !== undefined ? 1 : 0.5,
                    }}
                  >
                    Next →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ══════════════ RESULTS VIEW ══════════════ */}
          {submitted && (
            <div style={{ animation: 'fadeUp 0.35s ease both' }}>

              {/* Grade reveal hero */}
              <div style={{
                borderRadius: 20, marginBottom: 16, overflow: 'hidden',
                border: `2px solid ${passed ? 'rgba(52,211,153,0.35)' : 'rgba(248,113,113,0.35)'}`,
                background: passed
                  ? 'linear-gradient(135deg, rgba(52,211,153,0.10) 0%, rgba(52,211,153,0.04) 100%)'
                  : 'linear-gradient(135deg, rgba(248,113,113,0.10) 0%, rgba(248,113,113,0.04) 100%)',
              }}>
                {/* Top strip */}
                <div style={{
                  padding: '20px 24px',
                  display: 'flex', alignItems: 'center', gap: 18,
                }}>
                  {/* Grade letter */}
                  <div style={{
                    width: 72, height: 72, borderRadius: 18, flexShrink: 0,
                    background: `${grade.color}18`,
                    border: `2px solid ${grade.color}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: T.display, fontWeight: 800, fontSize: 36,
                    color: grade.color, letterSpacing: '-0.04em',
                    animation: 'gradeIn 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s both',
                  }}>
                    {grade.letter}
                  </div>

                  {/* Score + label */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: T.display, fontWeight: 800,
                      fontSize: 28, color: passed ? '#34d399' : '#f87171',
                      letterSpacing: '-0.03em', lineHeight: 1,
                      animation: 'scalePop 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.15s both',
                    }}>
                      {passed ? 'PASSED' : 'FAILED'}
                    </div>
                    <div style={{
                      fontFamily: T.font, fontSize: 13, color: T.muted, marginTop: 4,
                    }}>
                      {grade.label} · {correctCount} of {quiz.questions.length} correct
                    </div>
                    {!passed && (
                      <div style={{
                        fontFamily: T.mono, fontSize: 11, color: T.dim, marginTop: 3,
                      }}>
                        Need {PASS_THRESHOLD}% to pass · you scored {pct}%
                      </div>
                    )}
                  </div>

                  {/* Percentage circle */}
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{
                      fontFamily: T.mono, fontWeight: 700, fontSize: 26,
                      color: grade.color, lineHeight: 1,
                      animation: 'scalePop 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.2s both',
                    }}>
                      {pct}%
                    </div>
                    <div style={{ fontFamily: T.mono, fontSize: 9, color: T.dim, marginTop: 2 }}>
                      SCORE
                    </div>
                  </div>
                </div>

                {/* Score bar */}
                <div style={{
                  height: 5, background: passed ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
                }}>
                  <div style={{
                    height: '100%', width: `${pct}%`, borderRadius: 3,
                    background: passed
                      ? 'linear-gradient(90deg, #059669, #34d399)'
                      : 'linear-gradient(90deg, #dc2626, #f87171)',
                    transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                  }} />
                </div>
              </div>

              {/* Answer review section */}
              <div style={{
                background: T.bg1, border: `1px solid ${T.border}`,
                borderRadius: 16, overflow: 'hidden', marginBottom: 14,
              }}>
                <div style={{
                  padding: '14px 20px', borderBottom: `1px solid ${T.border}`,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{ fontFamily: T.mono, fontSize: 10, color: T.dim, letterSpacing: '0.1em' }}>
                    ANSWER REVIEW
                  </span>
                  <div style={{ flex: 1 }} />
                  <span style={{ fontFamily: T.mono, fontSize: 10, color: T.success }}>{correctCount} correct</span>
                  <span style={{ fontFamily: T.mono, fontSize: 10, color: T.dim }}>·</span>
                  <span style={{ fontFamily: T.mono, fontSize: 10, color: T.error }}>{quiz.questions.length - correctCount} wrong</span>
                </div>

                <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {quiz.questions.map((qq, i) => {
                    const userAns = answers[i];
                    const correct = userAns === qq.a;
                    const isOpen  = expanded === i;

                    return (
                      <div key={i} style={{
                        borderRadius: 12, overflow: 'hidden',
                        border: `1px solid ${correct ? 'rgba(52,211,153,0.18)' : 'rgba(248,113,113,0.18)'}`,
                        background: correct ? 'rgba(52,211,153,0.04)' : 'rgba(248,113,113,0.04)',
                        animation: `fadeUp 0.25s ease ${i * 0.04}s both`,
                      }}>
                        {/* Question row (always visible, clickable to expand) */}
                        <button
                          onClick={() => setExpanded(isOpen ? null : i)}
                          style={{
                            width: '100%', textAlign: 'left', background: 'none', border: 'none',
                            cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 12,
                            padding: '12px 14px',
                          }}
                        >
                          {/* Status icon */}
                          <div style={{
                            width: 24, height: 24, borderRadius: 7, flexShrink: 0, marginTop: 1,
                            background: correct ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
                            border: `1px solid ${correct ? 'rgba(52,211,153,0.4)' : 'rgba(248,113,113,0.4)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, color: correct ? '#34d399' : '#f87171',
                          }}>
                            {correct ? '✓' : '✗'}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontFamily: T.font, fontSize: 13, color: T.text, lineHeight: 1.5,
                              fontWeight: 500,
                            }}>{qq.q}</div>
                            {!correct && (
                              <div style={{
                                marginTop: 4, fontFamily: T.font, fontSize: 12,
                                color: T.success,
                              }}>
                                Correct: {qq.opts[qq.a]}
                              </div>
                            )}
                          </div>
                          {/* Expand chevron */}
                          <span style={{
                            fontFamily: T.mono, fontSize: 10, color: T.dim, flexShrink: 0,
                            marginTop: 4, transition: 'transform 0.2s',
                            display: 'inline-block', transform: isOpen ? 'rotate(180deg)' : 'none',
                          }}>▾</span>
                        </button>

                        {/* Expanded: show all options */}
                        {isOpen && (
                          <div style={{
                            padding: '0 14px 14px',
                            display: 'flex', flexDirection: 'column', gap: 6,
                            borderTop: `1px solid ${T.border}`,
                            paddingTop: 12,
                            animation: 'fadeUp 0.18s ease both',
                          }}>
                            {qq.opts.map((opt, oi) => (
                              <ReviewOption
                                key={oi}
                                label={String.fromCharCode(65 + oi)}
                                text={opt}
                                isCorrect={oi === qq.a}
                                isSelected={oi === userAns}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action buttons */}
              {passed ? (
                <button
                  onClick={handleContinue}
                  style={{
                    width: '100%', padding: '15px 0', borderRadius: 12,
                    background: `linear-gradient(135deg, ${T.accentDeep} 0%, ${T.accent} 100%)`,
                    border: `1.5px solid ${T.accent}`,
                    color: '#fff', cursor: 'pointer', fontFamily: T.font,
                    fontWeight: 700, fontSize: 15, transition: 'all 0.2s',
                    boxShadow: T.glow,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = T.glowLg; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = T.glow; e.currentTarget.style.transform = 'none'; }}
                >
                  Continue Learning →
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button
                    onClick={handleRetry}
                    style={{
                      width: '100%', padding: '15px 0', borderRadius: 12,
                      background: 'rgba(248,113,113,0.08)',
                      border: '1.5px solid rgba(248,113,113,0.35)',
                      color: '#f87171', cursor: 'pointer',
                      fontFamily: T.font, fontWeight: 700, fontSize: 15,
                      transition: 'all 0.18s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.14)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.55)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.35)'; }}
                  >
                    ↺ Retry Quiz
                  </button>
                  <button
                    onClick={onBack}
                    style={{
                      width: '100%', padding: '12px 0', borderRadius: 12,
                      background: 'none', border: `1px solid ${T.border}`,
                      color: T.muted, cursor: 'pointer',
                      fontFamily: T.font, fontWeight: 600, fontSize: 14,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = T.text; e.currentTarget.style.borderColor = T.border2; }}
                    onMouseLeave={e => { e.currentTarget.style.color = T.muted; e.currentTarget.style.borderColor = T.border; }}
                  >
                    ← Back to Lesson
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}
