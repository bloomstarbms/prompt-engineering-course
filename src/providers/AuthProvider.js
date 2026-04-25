'use client';
/**
 * AuthProvider — wraps useAuth() in a React context so the session is
 * loaded exactly once (in layout.js) and shared across ALL page routes.
 *
 * Without this, every Next.js route navigation mounts a fresh CourseApp,
 * which would re-run getSession() and show the splash screen on every nav.
 * With this, getSession() runs once; subsequent mounts read the cached
 * ready/user/progress values from context immediately.
 */
import { createContext, useContext } from 'react';
import { useAuth } from '@/hooks/useAuth';

const DEFAULTS = {
  user:           null,
  userId:         null,
  progress:       { completed: {}, quizScores: {}, lastLesson: { m: 0, l: 0 } },
  ready:          false,
  login:          async () => ({ ok: false, error: 'Not initialised' }),
  register:       async () => ({ ok: false, error: 'Not initialised' }),
  logout:         async () => {},
  updateProgress: () => {},
  updateProfile:  async () => ({ ok: false }),
  updatePassword: async () => ({ ok: false }),
};

const AuthContext = createContext(DEFAULTS);

export function AuthProvider({ children }) {
  const auth = useAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

/**
 * useAuthCtx — drop-in replacement for useAuth() in any component that
 * is a descendant of AuthProvider. Returns the same shape as useAuth().
 */
export function useAuthCtx() {
  return useContext(AuthContext);
}
