'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { T, MOD_COLORS, getGrade } from '@/lib/theme';
import { MODULES, QUIZZES, TOTAL_LESSONS } from '@/data/courseData';
import AuthPage        from '@/components/auth/AuthPage';
import Landing         from '@/components/course/Landing';
import Sidebar         from '@/components/course/Sidebar';
import QuizView        from '@/components/quiz/QuizView';
import CertificatePage from '@/components/cert/CertificatePage';
import { LessonBody, ModPill } from '@/components/ui';

export default function CourseApp() {
  const { user, progress, ready, login, register, logout, updateProgress } = useAuth();

  const [page,     setPage]     = useState('landing');
  const [activeM,  setActiveM]  = useState(0);
  const [activeL,  setActiveL]  = useState(0);
  const [tab,      setTab]      = useState('video');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
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
  }, [user]);

  const mod    = MODULES[activeM];
  const lesson = mod.lessons[activeL];
  const lKey   = `${activeM}-${activeL}`;
  const quiz   = QUIZZES[lKey];

  const { completed, quizScores } = progress;
  const completedCount = Object.keys(completed).length;
  const allDone = completedCount === TOTAL_LESSONS;

  const navigate = useCallback((mi, li) => {
    setActiveM(mi);
    setActiveL(li);
    setTab('video');
    setPage('course');
    if (contentRef.current) contentRef.current.scrollTop = 0;
    if (isMobile) setSidebarOpen(false);
    updateProgress(prev => ({ ...prev, lastLesson: { m: mi, l: li } }));
  }, [isMobile, updateProgress]);

  function goNext() {
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
    updateProgress(prev => ({
      ...prev,
      quizScores: { ...prev.quizScores, [lKey]: result },
      completed:  { ...prev.completed,  [lKey]: true },
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
          onNavigate={navigate}
          onCert={() => setPage('cert')}
          onLogout={() => { logout(); setPage('landing'); }}
          isMobile={isMobile}
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
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
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
            <button
              onClick={quiz ? () => setPage('quiz') : goNext}
              style={{
                background: mod.color, border: 'none', color: '#fff',
                cursor: 'pointer', padding: '7px 14px', borderRadius: 6,
                fontSize: 12, fontWeight: 700, fontFamily: T.font,
                transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              {quiz ? (!completed[lKey] ? 'Quiz →' : 'Retake →') : 'Next →'}
            </button>
          </div>
        </header>

        {/* tab bar */}
        <div style={{
          display: 'flex', alignItems: 'center', height: 40,
          borderBottom: `1px solid ${T.border}`,
          background: T.bg, flexShrink: 0, paddingLeft: 8,
        }}>
          {[['video', '▶  Video'], ['notes', '📄  Notes']].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              height: '100%', padding: '0 16px',
              background: 'none', border: 'none',
              borderBottom: `2px solid ${tab === k ? mod.color : 'transparent'}`,
              color: tab === k ? mod.color : T.dim,
              cursor: 'pointer', fontSize: 12, fontFamily: T.mono,
              letterSpacing: '0.04em', transition: 'all 0.15s',
              marginBottom: -1, fontWeight: tab === k ? 700 : 400,
            }}>{label}</button>
          ))}

          {quizScores[lKey] && (
            <div style={{
              marginLeft: 'auto', padding: '0 14px',
              fontFamily: T.mono, fontSize: 10,
              color: getGrade(Math.round(quizScores[lKey].score / quizScores[lKey].total * 100)).color,
            }}>
              QUIZ {quizScores[lKey].score}/{quizScores[lKey].total} · {getGrade(Math.round(quizScores[lKey].score / quizScores[lKey].total * 100)).letter}
            </div>
          )}
          {completed[lKey] && !quizScores[lKey] && (
            <div style={{ marginLeft: 'auto', padding: '0 14px', fontFamily: T.mono, fontSize: 10, color: T.success }}>
              ✓ COMPLETED
            </div>
          )}
        </div>

        {/* scrollable content */}
        <main ref={contentRef} style={{ flex: 1, overflowY: 'auto' }}>
          {tab === 'video'
            ? <VideoTab lesson={lesson} mod={mod} lKey={lKey} completed={completed} quiz={quiz} onQuiz={() => setPage('quiz')} />
            : <NotesTab  lesson={lesson} mod={mod} lKey={lKey} activeL={activeL} quiz={quiz} onQuiz={() => setPage('quiz')} goNext={goNext} />
          }
        </main>
      </div>
    </div>
  );
}

/* ── Video Tab ─────────────────────────────────────────────────────────── */
function VideoTab({ lesson, mod, lKey, completed, quiz, onQuiz }) {
  return (
    <div>
      <div style={{ background: '#000', position: 'relative', paddingBottom: '56.25%' }}>
        <iframe
          src={`https://www.youtube.com/embed/${lesson.vid}?rel=0&modestbranding=1`}
          title={lesson.title}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      <div style={{ padding: 'clamp(20px,4vw,28px) clamp(16px,4vw,28px)', maxWidth: 860 }}>
        <ModPill icon={mod.icon} title={mod.title} color={mod.color} />

        <h1 style={{
          fontFamily: T.display, fontWeight: 700,
          fontSize: 'clamp(18px,3vw,24px)', color: T.text,
          letterSpacing: '-0.03em', margin: '10px 0', lineHeight: 1.2,
        }}>
          {lesson.title}
        </h1>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', marginBottom: 22 }}>
          <span style={{ fontFamily: T.mono, fontSize: 11, color: T.dim }}>⏱ {lesson.dur}</span>
          {completed[lKey] && (
            <span style={{ fontFamily: T.mono, fontSize: 11, color: T.success }}>✓ COMPLETED</span>
          )}
        </div>

        {quiz && (
          <div style={{
            background: T.bg1, border: `1.5px solid ${mod.color}22`,
            borderRadius: 12, padding: 'clamp(14px,3vw,18px) clamp(14px,3vw,20px)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 16, flexWrap: 'wrap',
          }}>
            <div>
              <div style={{ fontFamily: T.mono, fontSize: 10, color: mod.color, letterSpacing: '0.1em', marginBottom: 4 }}>
                LESSON QUIZ
              </div>
              <div style={{ fontFamily: T.font, fontSize: 13, color: T.muted }}>
                {quiz.questions.length} questions · Test your understanding
              </div>
            </div>
            <button
              onClick={onQuiz}
              style={{
                background: mod.color, border: 'none', color: '#fff',
                cursor: 'pointer', padding: '10px 20px', borderRadius: 8,
                fontSize: 13, fontWeight: 700, fontFamily: T.font,
                flexShrink: 0, transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              {completed[lKey] ? 'Retake Quiz' : 'Start Quiz →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Notes Tab ─────────────────────────────────────────────────────────── */
function NotesTab({ lesson, mod, lKey, activeL, quiz, onQuiz, goNext }) {
  return (
    <div style={{ padding: 'clamp(24px,5vw,40px) clamp(16px,5vw,44px)', maxWidth: 760 }}>
      <div style={{ marginBottom: 28 }}>
        <ModPill icon={mod.icon} title={`MODULE ${mod.tag} · NOTES`} color={mod.color} />
        <h1 style={{
          fontFamily: T.font, fontWeight: 800,
          fontSize: 'clamp(20px,3.5vw,26px)', color: T.text,
          letterSpacing: '-0.03em', margin: '12px 0 14px', lineHeight: 1.2,
        }}>
          {lesson.title}
        </h1>
        <div style={{ display: 'flex', gap: 3 }}>
          <div style={{ width: 32, height: 3, borderRadius: 2, background: mod.color }} />
          <div style={{ width: 8,  height: 3, borderRadius: 2, background: `${mod.color}55` }} />
          <div style={{ width: 4,  height: 3, borderRadius: 2, background: `${mod.color}28` }} />
        </div>
      </div>

      <LessonBody text={lesson.body} color={mod.color} />

      <div style={{
        marginTop: 48, paddingTop: 24, borderTop: `1px solid ${T.border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ fontFamily: T.mono, fontSize: 10, color: T.faint }}>
          {activeL + 1} / {mod.lessons.length} IN MODULE {mod.tag}
        </div>
        <button
          onClick={quiz ? onQuiz : goNext}
          style={{
            background: `${mod.color}0e`, border: `1px solid ${mod.color}28`,
            color: mod.color, cursor: 'pointer', padding: '10px 20px', borderRadius: 8,
            fontSize: 12, fontWeight: 700, fontFamily: T.mono, letterSpacing: '0.06em',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = `${mod.color}1a`}
          onMouseLeave={e => e.currentTarget.style.background = `${mod.color}0e`}
        >
          {quiz ? '📝 TAKE QUIZ' : 'NEXT LESSON →'}
        </button>
      </div>
    </div>
  );
}
