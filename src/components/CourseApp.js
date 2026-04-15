'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { T, getGrade } from '@/lib/theme';
import { MODULES, QUIZZES, TOTAL_LESSONS, PASS_THRESHOLD } from '@/data/courseData';
import AuthPage        from '@/components/auth/AuthPage';
import Landing         from '@/components/course/Landing';
import Sidebar         from '@/components/course/Sidebar';
import QuizView        from '@/components/quiz/QuizView';
import CertificatePage from '@/components/cert/CertificatePage';
import ProfilePage     from '@/components/profile/ProfilePage';
import { LessonBody, ModPill, AccentBtn } from '@/components/ui';

/* ── Unlock logic — a lesson is open only after the previous is complete + passed ── */
function isLessonUnlocked(mi, li, completed, quizScores) {
  if (mi === 0 && li === 0) return true;
  let pmi = mi, pli = li - 1;
  if (pli < 0) {
    pmi = mi - 1;
    if (pmi < 0) return true;
    pli = MODULES[pmi].lessons.length - 1;
  }
  const pk = `${pmi}-${pli}`;
  if (!completed[pk]) return false;
  const qs = quizScores[pk];
  if (qs && Math.round(qs.score / qs.total * 100) < PASS_THRESHOLD) return false;
  return true;
}

export default function CourseApp() {
  const { user, progress, ready, login, register, logout, updateProgress, updateProfile, updatePassword } = useAuth();

  const [page,        setPage]        = useState('landing');
  const [activeM,     setActiveM]     = useState(0);
  const [activeL,     setActiveL]     = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile,    setIsMobile]    = useState(false);
  const contentRef = useRef(null);

  /* responsive */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => { if (!isMobile) setSidebarOpen(true); }, [isMobile]);

  /* restore last position on login */
  useEffect(() => {
    if (user && progress.lastLesson) {
      setActiveM(progress.lastLesson.m ?? 0);
      setActiveL(progress.lastLesson.l ?? 0);
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const mod    = MODULES[activeM];
  const lesson = mod.lessons[activeL];
  const lKey   = `${activeM}-${activeL}`;
  const quiz   = QUIZZES[lKey];

  const { completed, quizScores } = progress;
  const completedCount = Object.keys(completed).length;
  const allDone = completedCount === TOTAL_LESSONS;

  /* quiz score helpers */
  const quizScore  = quizScores[lKey];
  const quizPct    = quizScore ? Math.round(quizScore.score / quizScore.total * 100) : 0;
  const quizPassed = quizScore ? quizPct >= PASS_THRESHOLD : false;

  /* can the "Next →" button fire? */
  const canAdvance = !quiz || quizPassed;

  const navigate = useCallback((mi, li) => {
    setActiveM(mi);
    setActiveL(li);
    setPage('course');
    if (contentRef.current) contentRef.current.scrollTop = 0;
    if (isMobile) setSidebarOpen(false);
    updateProgress(prev => ({ ...prev, lastLesson: { m: mi, l: li } }));
  }, [isMobile, updateProgress]);

  function markComplete() {
    updateProgress(prev => ({
      ...prev,
      completed: { ...prev.completed, [lKey]: true },
    }));
  }

  function goNext() {
    /* auto-complete no-quiz lessons when user advances */
    if (!quiz && !completed[lKey]) {
      updateProgress(prev => ({
        ...prev,
        completed: { ...prev.completed, [lKey]: true },
      }));
    }
    if (contentRef.current) contentRef.current.scrollTop = 0;
    if (activeL < mod.lessons.length - 1) {
      navigate(activeM, activeL + 1);
    } else if (activeM < MODULES.length - 1) {
      navigate(activeM + 1, 0);
    }
  }

  function goPrev() {
    if (contentRef.current) contentRef.current.scrollTop = 0;
    if (activeL > 0) {
      navigate(activeM, activeL - 1);
    } else if (activeM > 0) {
      navigate(activeM - 1, MODULES[activeM - 1].lessons.length - 1);
    }
  }

  function onQuizDone(result) {
    /* Only mark lesson complete when quiz is PASSED; never un-complete a prior pass */
    updateProgress(prev => ({
      ...prev,
      quizScores: { ...prev.quizScores, [lKey]: result },
      completed:  (result.passed || prev.completed[lKey])
        ? { ...prev.completed, [lKey]: true }
        : prev.completed,
    }));
    setPage('course');
  }

  function handleAuth(mode, name, email, password) {
    return mode === 'register' ? register(name, email, password) : login(email, password);
  }

  /* loading */
  if (!ready) return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: T.mono, fontSize: 12, color: T.dim, letterSpacing: '0.1em' }}>LOADING…</div>
    </div>
  );

  /* routing */
  if (page === 'landing') return (
    <Landing
      onStart={() => setPage(user ? 'course' : 'auth')}
      onLogin={() => setPage(user ? 'course' : 'auth')}
    />
  );

  if (page === 'auth' || !user) return (
    <AuthPage onAuth={(mode, name, email, password) => {
      const result = handleAuth(mode, name, email, password);
      if (result.ok) setPage('course');
      return result;
    }} />
  );

  if (page === 'quiz') return (
    <QuizView
      mod={mod} lKey={lKey}
      prevScore={quizScores[lKey]}
      onDone={onQuizDone}
      onBack={() => setPage('course')}
    />
  );

  if (page === 'cert') return (
    <CertificatePage
      user={user}
      quizScores={quizScores}
      onBack={() => setPage('course')}
    />
  );

  if (page === 'profile') return (
    <ProfilePage
      user={user}
      progress={progress}
      updateProfile={updateProfile}
      updatePassword={updatePassword}
      onBack={() => setPage('course')}
      onLogout={() => { logout(); setPage('landing'); }}
    />
  );

  /* ── COURSE VIEW ────────────────────────────────────────────────────── */
  return (
    <div style={{ display: 'flex', height: '100dvh', background: T.bg, overflow: 'hidden', position: 'relative' }}>

      {/* mobile overlay */}
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
          zIndex: 40, backdropFilter: 'blur(2px)',
        }} />
      )}

      {/* sidebar */}
      <div style={{
        position: isMobile ? 'fixed' : 'relative',
        top: 0, left: 0, bottom: 0,
        zIndex: isMobile ? 50 : 'auto',
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-272px)',
        transition: 'transform 0.25s ease',
        height: '100%', flexShrink: 0,
        boxShadow: (isMobile && sidebarOpen) ? '4px 0 24px rgba(0,0,0,0.08)' : 'none',
      }}>
        <Sidebar
          user={user}
          activeM={activeM}
          activeL={activeL}
          progress={progress}
          quizScores={quizScores}
          onNavigate={(mi, li) => {
            if (isLessonUnlocked(mi, li, completed, quizScores)) navigate(mi, li);
          }}
          onCert={() => setPage('cert')}
          onProfile={() => setPage('profile')}
          onLogout={() => { logout(); setPage('landing'); }}
          isMobile={isMobile}
          completed={completed}
        />
      </div>

      {/* main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* top bar */}
        <header style={{
          height: 54, padding: '0 clamp(12px,3vw,20px)',
          borderBottom: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', gap: 10,
          background: T.bg, flexShrink: 0,
        }}>
          <button
            onClick={() => setSidebarOpen(s => !s)}
            style={{
              background: 'none', border: `1px solid ${T.border}`,
              color: T.muted, cursor: 'pointer', padding: '6px 9px',
              borderRadius: 6, fontSize: 14, lineHeight: 1, flexShrink: 0,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = T.border2}
            onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
          >☰</button>

          {/* breadcrumb */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={() => setPage('landing')}
              style={{
                background: 'none', border: 'none', fontFamily: T.mono,
                fontSize: 9, color: T.dim, cursor: 'pointer', padding: 0,
                letterSpacing: '0.08em', flexShrink: 0, transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = T.accent}
              onMouseLeave={e => e.currentTarget.style.color = T.dim}
            >HOME</button>
            <span style={{ color: T.faint, fontSize: 10 }}>›</span>
            <span style={{ fontFamily: T.mono, fontSize: 9, color: mod.color, letterSpacing: '0.08em', flexShrink: 0 }}>
              {mod.tag}
            </span>
            <span style={{ color: T.faint, fontSize: 10 }}>›</span>
            <span style={{
              fontFamily: T.font, fontWeight: 600, fontSize: 13, color: T.text,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{lesson.title}</span>
          </div>

          {/* right actions */}
          <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
            {allDone && !isMobile && (
              <button
                onClick={() => setPage('cert')}
                style={{
                  background: T.accentLight, border: `1px solid ${T.accentBorder}`,
                  color: T.accent, cursor: 'pointer', padding: '6px 12px',
                  borderRadius: 6, fontSize: 11, fontWeight: 700, fontFamily: T.font,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(129,140,248,0.18)'}
                onMouseLeave={e => e.currentTarget.style.background = T.accentLight}
              >🎓 Certificate</button>
            )}
            <button
              onClick={goPrev}
              disabled={activeM === 0 && activeL === 0}
              style={{
                background: T.bg2, border: 'none', color: T.muted,
                cursor: (activeM === 0 && activeL === 0) ? 'default' : 'pointer',
                padding: '7px 12px', borderRadius: 6, fontSize: 13,
                fontFamily: T.font, fontWeight: 700,
                opacity: (activeM === 0 && activeL === 0) ? 0.35 : 1,
                transition: 'all 0.15s',
              }}
            >‹</button>

            {/* Quiz button OR Next button */}
            {!canAdvance ? (
              <button
                onClick={() => setPage('quiz')}
                style={{
                  background: mod.color, border: 'none', color: '#fff',
                  cursor: 'pointer', padding: '7px 14px', borderRadius: 6,
                  fontSize: 12, fontWeight: 700, fontFamily: T.font,
                  transition: 'all 0.15s', whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >Quiz →</button>
            ) : (
              <button
                onClick={goNext}
                disabled={activeM === MODULES.length - 1 && activeL === mod.lessons.length - 1}
                style={{
                  background: mod.color, border: 'none', color: '#fff',
                  cursor: (activeM === MODULES.length - 1 && activeL === mod.lessons.length - 1) ? 'default' : 'pointer',
                  padding: '7px 14px', borderRadius: 6,
                  fontSize: 12, fontWeight: 700, fontFamily: T.font,
                  transition: 'all 0.15s', whiteSpace: 'nowrap',
                  opacity: (activeM === MODULES.length - 1 && activeL === mod.lessons.length - 1) ? 0.4 : 1,
                }}
                onMouseEnter={e => { if (e.currentTarget.style.opacity !== '0.4') e.currentTarget.style.opacity = '0.88'; }}
                onMouseLeave={e => { if (e.currentTarget.style.opacity !== '0.4') e.currentTarget.style.opacity = '1'; }}
              >Next →</button>
            )}
          </div>
        </header>

        {/* scrollable content — video + notes in one view */}
        <main ref={contentRef} style={{ flex: 1, overflowY: 'auto' }}>
          <LessonView
            lesson={lesson}
            mod={mod}
            lKey={lKey}
            completed={completed}
            quiz={quiz}
            quizScore={quizScore}
            quizPassed={quizPassed}
            quizPct={quizPct}
            activeL={activeL}
            onQuiz={() => setPage('quiz')}
            onMarkComplete={markComplete}
            goNext={goNext}
          />
        </main>
      </div>
    </div>
  );
}

/* ── Combined Lesson View: video + notes in single scroll ──────────────── */
function LessonView({ lesson, mod, lKey, completed, quiz, quizScore, quizPassed, quizPct, activeL, onQuiz, onMarkComplete, goNext }) {
  const isComplete = completed[lKey];
  const [mi, li] = lKey.split('-').map(Number);
  const isCourseStart = mi === 0 && li === 0;

  return (
    <div>
      {/* ── Course welcome banner (first lesson only) ── */}
      {isCourseStart && (
        <div style={{
          background: `linear-gradient(135deg, ${mod.color}12, ${mod.color}06)`,
          borderBottom: `1px solid ${mod.color}20`,
          padding: 'clamp(20px,4vw,32px) clamp(16px,4vw,32px) clamp(16px,3vw,24px)',
        }}>
          <div style={{ maxWidth: 860 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: `${mod.color}18`, border: `1px solid ${mod.color}30`,
              borderRadius: 20, padding: '4px 12px', marginBottom: 14,
            }}>
              <span style={{ fontSize: 12 }}>🎓</span>
              <span style={{ fontFamily: T.mono, fontSize: 10, color: mod.color, letterSpacing: '0.1em', fontWeight: 600 }}>
                COURSE INTRODUCTION
              </span>
            </div>
            <h2 style={{
              fontFamily: T.display, fontWeight: 800, fontSize: 'clamp(20px,3vw,28px)',
              color: T.text, margin: '0 0 12px', letterSpacing: '-0.03em', lineHeight: 1.2,
            }}>
              Welcome to Prompt Engineering Mastery
            </h2>
            <p style={{
              fontFamily: T.font, fontSize: 'clamp(13px,1.8vw,15px)', color: T.muted,
              lineHeight: 1.7, margin: '0 0 16px', maxWidth: 680,
            }}>
              This course takes you from zero to confident — no AI background required. You'll learn how to communicate with AI models so they produce exactly what you need, every time. By the end, you'll have a practical, hands-on toolkit of prompting techniques used by professionals building real AI-powered workflows.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {[
                { icon: '📚', label: '7 Modules' },
                { icon: '🎬', label: '22 Lessons' },
                { icon: '✅', label: 'Quizzes & Certificate' },
                { icon: '⚡', label: 'Beginner Friendly' },
              ].map(({ icon, label }) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: T.bg2, border: `1px solid ${T.border}`,
                  borderRadius: 8, padding: '6px 12px',
                }}>
                  <span style={{ fontSize: 12 }}>{icon}</span>
                  <span style={{ fontFamily: T.mono, fontSize: 10, color: T.dim, letterSpacing: '0.05em' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Lesson intro (shown for every lesson) ── */}
      {lesson.intro && (
        <div style={{
          padding: 'clamp(14px,3vw,20px) clamp(16px,4vw,32px)',
          borderBottom: `1px solid ${T.border}`,
          background: T.bg1,
        }}>
          <div style={{ maxWidth: 860, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0, marginTop: 1,
              background: `${mod.color}14`, border: `1px solid ${mod.color}28`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14,
            }}>▶</div>
            <p style={{
              fontFamily: T.font, fontSize: 'clamp(13px,1.6vw,14px)', color: T.muted,
              lineHeight: 1.7, margin: 0,
            }}>
              {lesson.intro}
            </p>
          </div>
        </div>
      )}

      {/* ── Video embed ── */}
      <div style={{ background: '#000', position: 'relative', paddingBottom: '56.25%' }}>
        <iframe
          src={`https://www.youtube.com/embed/${lesson.vid}?rel=0&modestbranding=1`}
          title={lesson.title}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      <div style={{ padding: 'clamp(20px,4vw,28px) clamp(16px,4vw,32px)', maxWidth: 860 }}>

        {/* ── Lesson header ── */}
        <ModPill icon={mod.icon} title={mod.title} color={mod.color} />

        <h1 style={{
          fontFamily: T.display, fontWeight: 700,
          fontSize: 'clamp(18px,3vw,24px)', color: T.text,
          letterSpacing: '-0.03em', margin: '10px 0 8px', lineHeight: 1.2,
        }}>
          {lesson.title}
        </h1>

        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginBottom: 24 }}>
          <span style={{ fontFamily: T.mono, fontSize: 11, color: T.dim }}>⏱ {lesson.dur}</span>
          {isComplete && !quizScore && (
            <span style={{ fontFamily: T.mono, fontSize: 11, color: T.success }}>✓ COMPLETED</span>
          )}
          {quizScore && (
            <span style={{
              fontFamily: T.mono, fontSize: 11,
              color: getGrade(quizPct).color,
            }}>
              Quiz: {quizScore.score}/{quizScore.total} · {quizPct}% · {getGrade(quizPct).letter}
              {quizPassed ? ' ✓' : ' ✗'}
            </span>
          )}
        </div>

        {/* ── Notes section header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
          paddingBottom: 10, borderBottom: `1px solid ${T.border}`,
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: `${mod.color}0e`, border: `1px solid ${mod.color}25`,
            borderRadius: 6, padding: '4px 10px',
          }}>
            <span style={{ fontSize: 11 }}>📄</span>
            <span style={{ fontFamily: T.mono, fontSize: 10, color: mod.color, letterSpacing: '0.08em' }}>
              LESSON NOTES
            </span>
          </div>
          <span style={{ fontFamily: T.mono, fontSize: 9, color: T.faint }}>
            Read along after watching the video
          </span>
        </div>

        {/* ── Lesson body (notes) ── */}
        <LessonBody text={lesson.body} color={mod.color} />

        {/* ── Quiz card OR Mark Complete ── */}
        <div style={{ marginTop: 40, paddingTop: 24, borderTop: `1px solid ${T.border}` }}>
          {quiz ? (
            <QuizCard
              quiz={quiz}
              mod={mod}
              onQuiz={onQuiz}
              quizPassed={quizPassed}
              quizScore={quizScore}
              quizPct={quizPct}
            />
          ) : isComplete ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16, color: T.success }}>✓</span>
                <span style={{ fontFamily: T.mono, fontSize: 11, color: T.success, letterSpacing: '0.06em' }}>LESSON COMPLETED</span>
              </div>
              <button
                onClick={goNext}
                style={{
                  background: `${mod.color}0e`, border: `1px solid ${mod.color}28`,
                  color: mod.color, cursor: 'pointer', padding: '10px 20px', borderRadius: 8,
                  fontSize: 12, fontWeight: 700, fontFamily: T.mono, letterSpacing: '0.06em',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = `${mod.color}1a`}
                onMouseLeave={e => e.currentTarget.style.background = `${mod.color}0e`}
              >NEXT LESSON →</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontFamily: T.mono, fontSize: 10, color: T.dim, letterSpacing: '0.08em', marginBottom: 4 }}>
                  LESSON {activeL + 1} · NO QUIZ
                </div>
                <div style={{ fontFamily: T.font, fontSize: 13, color: T.muted }}>
                  Watched the video and read the notes? Mark this lesson done.
                </div>
              </div>
              <button
                onClick={onMarkComplete}
                style={{
                  background: mod.color, border: 'none', color: '#fff',
                  cursor: 'pointer', padding: '11px 22px', borderRadius: 8,
                  fontSize: 13, fontWeight: 700, fontFamily: T.font,
                  transition: 'all 0.15s', whiteSpace: 'nowrap',
                  boxShadow: `0 4px 16px ${mod.color}40`,
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >✓ Mark Complete &amp; Continue →</button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

/* ── Quiz Card (inside lesson view) ────────────────────────────────────── */
function QuizCard({ quiz, mod, onQuiz, quizPassed, quizScore, quizPct }) {
  return (
    <div style={{
      background: T.bg1, border: `1.5px solid ${quizPassed ? T.success + '30' : mod.color + '22'}`,
      borderRadius: 12, padding: 'clamp(16px,3vw,22px) clamp(16px,3vw,22px)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 16, flexWrap: 'wrap',
    }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: mod.color, letterSpacing: '0.1em' }}>
            LESSON QUIZ
          </div>
          {quizPassed && (
            <span style={{
              background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.35)',
              color: T.success, fontFamily: T.mono, fontSize: 9, letterSpacing: '0.08em',
              padding: '2px 8px', borderRadius: 100,
            }}>✓ PASSED</span>
          )}
        </div>
        <div style={{ fontFamily: T.font, fontSize: 13, color: T.muted }}>
          {quiz.questions.length} questions
          {quizScore
            ? ` · Last score: ${quizScore.score}/${quizScore.total} (${quizPct}%)`
            : ' · Must score ≥' + PASS_THRESHOLD + '% to unlock the next lesson'}
        </div>
        {!quizPassed && (
          <div style={{ fontFamily: T.mono, fontSize: 9, color: T.faint, marginTop: 4 }}>
            ⚠ Complete this quiz with a passing grade to continue
          </div>
        )}
      </div>
      <button
        onClick={onQuiz}
        style={{
          background: quizPassed ? 'transparent' : mod.color,
          border: quizPassed ? `1px solid ${mod.color}40` : 'none',
          color: quizPassed ? mod.color : '#fff',
          cursor: 'pointer', padding: '10px 22px', borderRadius: 8,
          fontSize: 13, fontWeight: 700, fontFamily: T.font,
          flexShrink: 0, transition: 'all 0.15s',
          boxShadow: quizPassed ? 'none' : `0 4px 12px ${mod.color}40`,
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        {quizPassed ? 'Retake Quiz' : 'Start Quiz →'}
      </button>
    </div>
  );
}
