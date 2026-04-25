'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthCtx } from '@/providers/AuthProvider';
import { T, getGrade } from '@/lib/theme';
import { MODULES, QUIZZES, TOTAL_LESSONS, PASS_THRESHOLD } from '@/data/courseData';
import { isLessonUnlocked } from '@/lib/lessonUnlock';
import AuthPage        from '@/components/auth/AuthPage';
import Landing         from '@/components/course/Landing';
import Sidebar         from '@/components/course/Sidebar';
import QuizView        from '@/components/quiz/QuizView';
import CertificatePage from '@/components/cert/CertificatePage';
import ProfilePage     from '@/components/profile/ProfilePage';
import { getUserCert } from '@/lib/db';
import { LessonBody, ModPill, AccentBtn } from '@/components/ui';


/* ─── Pendulum Splash Screen ──────────────────────────────────────────── */
function SplashScreen() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: T.bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: T.font,
    }}>
      <style>{`
        @keyframes pmSwing {
          from { transform: rotate(-30deg); }
          to   { transform: rotate(30deg); }
        }
        @keyframes pmShadow {
          from { transform: translateX(-50%) scaleX(0.55) scaleY(0.7); opacity: 0.28; }
          to   { transform: translateX(-50%) scaleX(1.3)  scaleY(1.0); opacity: 0.07; }
        }
        @keyframes pmFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pmBlink {
          0%, 80%, 100% { opacity: 0.45; }
          40%            { opacity: 1; }
        }
      `}</style>

      {/* Pendulum assembly */}
      <div style={{ position: 'relative', width: 80, height: 210, marginBottom: 44 }}>

        {/* Ceiling mount bar */}
        <div style={{
          position: 'absolute', top: 0, left: '50%',
          transform: 'translateX(-50%)',
          width: 38, height: 4, borderRadius: 2,
          background: `linear-gradient(90deg, transparent, rgba(129,140,248,0.25), transparent)`,
        }}/>

        {/* Pivot bearing */}
        <div style={{
          position: 'absolute', top: 2, left: '50%',
          transform: 'translateX(-50%)',
          width: 11, height: 11, borderRadius: '50%',
          background: T.bg3,
          border: '1.8px solid rgba(129,140,248,0.50)',
          boxShadow: '0 0 8px rgba(129,140,248,0.2)',
          zIndex: 2,
        }}/>

        {/* Swinging arm */}
        <div style={{
          position: 'absolute', top: 7, left: '50%',
          marginLeft: -1,
          transformOrigin: 'top center',
          animation: 'pmSwing 1.3s ease-in-out infinite alternate',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          {/* Rod */}
          <div style={{
            width: 2, height: 136,
            background: 'linear-gradient(to bottom, rgba(129,140,248,0.55) 0%, rgba(99,102,241,0.12) 100%)',
            borderRadius: 2,
          }}/>
          {/* Bob */}
          <div style={{
            width: 32, height: 32, borderRadius: '50%', marginTop: -1,
            background: 'radial-gradient(circle at 33% 30%, #c7d2fe 0%, #818cf8 42%, #3730a3 100%)',
            boxShadow: '0 0 20px rgba(99,102,241,0.70), 0 0 42px rgba(99,102,241,0.28)',
            border: '1.5px solid rgba(129,140,248,0.65)',
          }}/>
        </div>

        {/* Floor shadow */}
        <div style={{
          position: 'absolute', bottom: -4, left: '50%',
          width: 48, height: 7, borderRadius: '50%',
          background: 'rgba(99,102,241,0.22)',
          filter: 'blur(4px)',
          animation: 'pmShadow 1.3s ease-in-out infinite alternate',
        }}/>
      </div>

      {/* Brand lock-up */}
      <div style={{ animation: 'pmFadeUp 0.65s 0.15s ease both', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 10,
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: 7,
            background: T.accentLight, border: `1px solid ${T.accentBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: T.mono, fontSize: 10, color: T.accent, fontWeight: 700,
          }}>PE</div>
          <span style={{
            fontFamily: T.font, fontWeight: 800, fontSize: 19,
            color: T.text, letterSpacing: '-0.03em',
          }}>PromptMastery</span>
        </div>
        <div style={{
          fontFamily: T.mono, fontSize: 10, color: T.dim, letterSpacing: '0.16em',
          animation: 'pmBlink 2s ease-in-out infinite',
        }}>
          LOADING…
        </div>
      </div>
    </div>
  );
}

export default function CourseApp() {
  // ── Auth state comes from the shared context (lives in layout.js).
  // On client-side navigation, ready/user/progress are already populated
  // because the context never unmounts — no re-auth, no splash on nav.
  const { user, userId, progress, ready, login, register, logout, updateProgress, updateProfile, updatePassword } = useAuthCtx();

  // ── URL-based routing — each section has its own path ──────────────
  const router   = useRouter();
  const pathname = usePathname();

  const page = useMemo(() => {
    const map = { '/course': 'course', '/profile': 'profile', '/cert': 'cert', '/auth': 'auth', '/quiz': 'quiz' };
    return map[pathname] || 'landing';
  }, [pathname]);

  // Navigate by updating the URL (adds to browser history — back button works).
  // Use router.replace for auth redirects so they don't pollute history.
  const setPage = useCallback((p) => {
    router.push(p === 'landing' ? '/' : `/${p}`);
  }, [router]);

  // ── Splash screen ────────────────────────────────────────────────────
  // On the very first page load, auth hasn't resolved yet → show the
  // pendulum for at least 1.3 s.  On client-side navigation, ready is
  // already true (auth context persists) → skip the splash entirely.
  const [splashDone, setSplashDone] = useState(ready); // instant if pre-loaded

  useEffect(() => {
    if (splashDone) return; // already done — client-side navigation case
    const t = setTimeout(() => setSplashDone(true), 1300);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Also clear splash immediately if auth resolves before the timer fires
  useEffect(() => {
    if (ready && !splashDone) setSplashDone(true);
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Course position ──────────────────────────────────────────────────
  // Initialise directly from progress so navigating back to /course after
  // visiting /profile shows the correct lesson without an extra render.
  const [activeM, setActiveM] = useState(() => progress?.lastLesson?.m ?? 0);
  const [activeL, setActiveL] = useState(() => progress?.lastLesson?.l ?? 0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile,    setIsMobile]    = useState(false);
  const contentRef       = useRef(null);
  const progressRestored = useRef(false);

  /* Auto-redirect ─────────────────────────────────────────────────────
     Logged-in user on landing/auth → push to /course.
     Logged-out user on a protected page → push to /auth.           */
  useEffect(() => {
    if (!ready) return;
    if (user && (page === 'landing' || page === 'auth')) {
      router.replace('/course');
    } else if (!user && !['landing', 'auth'].includes(page)) {
      router.replace('/auth');
    }
  }, [ready, user, page]); // eslint-disable-line react-hooks/exhaustive-deps

  /* responsive */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => { if (!isMobile) setSidebarOpen(true); }, [isMobile]);

  /* restore last position after login (first-load path) or if the user
     lands directly on /course after a fresh page load.  The effect re-runs
     whenever user or progress changes so it catches the post-hydration batch
     where both become available at the same time. */
  useEffect(() => {
    if (!user) { progressRestored.current = false; return; }
    if (progressRestored.current) return;
    progressRestored.current = true;
    setActiveM(progress.lastLesson?.m ?? 0);
    setActiveL(progress.lastLesson?.l ?? 0);
  }, [user, progress]); // eslint-disable-line react-hooks/exhaustive-deps

  const mod    = MODULES[activeM];
  const lesson = mod.lessons[activeL];
  const lKey   = `${activeM}-${activeL}`;
  const quiz   = QUIZZES[lKey];

  const { completed, quizScores } = progress;
  const completedCount = Object.keys(completed).length;
  const allDone = completedCount === TOTAL_LESSONS;

  /* Also unlock cert access for students who already have an issued cert
     (covers: course updated with new lessons after they graduated, or any
     edge-case where completedCount doesn't equal TOTAL_LESSONS exactly) */
  const [hasCert, setHasCert] = useState(false);
  useEffect(() => {
    if (userId) {
      getUserCert(userId).then(cert => setHasCert(!!cert)).catch(() => {});
    }
  }, [userId]);

  const canSeeCert = allDone || hasCert;

  /* Track course completion once — fire-and-forget */
  const trackedComplete = useRef(false);
  useEffect(() => {
    if (allDone && user && !trackedComplete.current) {
      trackedComplete.current = true;
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'complete', email: user.email, name: user.name }),
      }).catch(() => {});
    }
  }, [allDone, user]);

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
    // immediate=true: lesson completion is critical — don't risk losing it
    // if the user closes the tab before the 800ms debounce fires.
    updateProgress(prev => ({
      ...prev,
      completed: { ...prev.completed, [lKey]: true },
    }), true);
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
    // immediate=true: quiz scores are critical data — save right away.
    updateProgress(prev => ({
      ...prev,
      quizScores: { ...prev.quizScores, [lKey]: result },
      completed:  (result.passed || prev.completed[lKey])
        ? { ...prev.completed, [lKey]: true }
        : prev.completed,
    }), true);
    setPage('course');
  }

  async function handleAuth(mode, name, email, password) {
    return mode === 'register' ? register(name, email, password) : login(email, password);
  }

  /* ── Splash ─────────────────────────────────────────────────────────
     Show until auth resolves AND the 1.3s minimum has elapsed.
     On client-side navigation splashDone starts as true so this is skipped. */
  if (!ready || !splashDone) return <SplashScreen />;

  /* ── URL-driven routing ─────────────────────────────────────────────
     Each section has its own path; the auto-redirect effect above handles
     auth guards so we never reach a protected branch with user === null. */
  if (page === 'landing') return (
    <Landing
      onStart={() => router.push(user ? '/course' : '/auth')}
      onLogin={() => router.push(user ? '/course' : '/auth')}
    />
  );

  if (page === 'auth' || !user) return (
    <AuthPage onAuth={async (mode, name, email, password) => {
      const result = await handleAuth(mode, name, email, password);
      if (result.ok && !result.needsConfirm) router.push('/course');
      return result;
    }} />
  );

  if (page === 'quiz') return (
    <QuizView
      mod={mod} lKey={lKey}
      prevScore={quizScores[lKey]}
      onDone={onQuizDone}
      onBack={() => router.push('/course')}
    />
  );

  if (page === 'cert') return (
    <CertificatePage
      user={user}
      userId={userId}
      quizScores={quizScores}
      onBack={() => { setHasCert(true); router.push('/course'); }}
    />
  );

  if (page === 'profile') return (
    <ProfilePage
      user={user}
      userId={userId}
      progress={progress}
      canSeeCert={canSeeCert}
      updateProfile={updateProfile}
      updatePassword={updatePassword}
      onBack={() => router.push('/course')}
      onLogout={() => { logout(); router.replace('/'); }}
      onCert={() => router.push('/cert')}
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
          canSeeCert={canSeeCert}
          onCert={() => router.push('/cert')}
          onProfile={() => router.push('/profile')}
          onLogout={() => { logout(); router.replace('/'); }}
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
              onClick={() => router.push('/')}
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
            {canSeeCert && !isMobile && (
              <button
                onClick={() => router.push('/cert')}
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
                { icon: '📚', label: `${MODULES.length} Modules` },
                { icon: '🎬', label: `${TOTAL_LESSONS} Lessons` },
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
              fontFamily: T.font, fontSize: 'clamp(15px,1.8vw,16px)', color: T.muted,
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
