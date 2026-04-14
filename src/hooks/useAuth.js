'use client';
import { useState, useEffect, useCallback } from 'react';
import { getSession, login, register, logout, loadProgress, saveProgress } from '@/lib/auth';

export function useAuth() {
  const [user, setUser]       = useState(null);   // { email, name }
  const [progress, setProgress] = useState({ completed: {}, quizScores: {}, lastLesson: { m: 0, l: 0 } });
  const [ready, setReady]     = useState(false);  // false until localStorage read

  // Hydrate from localStorage on mount
  useEffect(() => {
    const session = getSession();
    if (session) {
      setUser(session);
      setProgress(loadProgress(session.email));
    }
    setReady(true);
  }, []);

  const handleLogin = useCallback((email, password) => {
    const result = login(email, password);
    if (result.ok) {
      setUser({ email: result.user.email, name: result.user.name });
      setProgress(loadProgress(result.user.email));
    }
    return result;
  }, []);

  const handleRegister = useCallback((name, email, password) => {
    const result = register(name, email, password);
    if (result.ok) {
      setUser({ email: result.user.email, name: result.user.name });
      setProgress(loadProgress(result.user.email));
    }
    return result;
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setUser(null);
    setProgress({ completed: {}, quizScores: {}, lastLesson: { m: 0, l: 0 } });
  }, []);

  const updateProgress = useCallback((updater) => {
    if (!user) return;
    setProgress(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveProgress(user.email, next);
      return next;
    });
  }, [user]);

  return {
    user,
    progress,
    ready,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    updateProgress,
  };
}
