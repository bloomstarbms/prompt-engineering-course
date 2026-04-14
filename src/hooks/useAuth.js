'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  getSession, getUser, login, register, logout,
  loadProgress, saveProgress,
  updateProfile as authUpdateProfile,
  updatePassword as authUpdatePassword,
} from '@/lib/auth';

export function useAuth() {
  const [user, setUser]         = useState(null);   // { email, name, bio, avatarUrl }
  const [progress, setProgress] = useState({ completed: {}, quizScores: {}, lastLesson: { m: 0, l: 0 } });
  const [ready, setReady]       = useState(false);  // false until localStorage read

  // Hydrate from localStorage on mount
  useEffect(() => {
    const session = getSession();
    if (session) {
      // Merge session with full user record (bio/avatarUrl may have been updated)
      const full = getUser(session.email);
      setUser({
        email:     session.email,
        name:      full?.name      ?? session.name,
        bio:       full?.bio       ?? session.bio       ?? '',
        avatarUrl: full?.avatarUrl ?? session.avatarUrl ?? '',
      });
      setProgress(loadProgress(session.email));
    }
    setReady(true);
  }, []);

  const handleLogin = useCallback((email, password) => {
    const result = login(email, password);
    if (result.ok) {
      setUser({
        email:     result.user.email,
        name:      result.user.name,
        bio:       result.user.bio       ?? '',
        avatarUrl: result.user.avatarUrl ?? '',
      });
      setProgress(loadProgress(result.user.email));
    }
    return result;
  }, []);

  const handleRegister = useCallback((name, email, password) => {
    const result = register(name, email, password);
    if (result.ok) {
      setUser({
        email:     result.user.email,
        name:      result.user.name,
        bio:       result.user.bio       ?? '',
        avatarUrl: result.user.avatarUrl ?? '',
      });
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

  const handleUpdateProfile = useCallback(({ name, bio, avatarUrl }) => {
    if (!user) return { ok: false, error: 'Not logged in.' };
    const result = authUpdateProfile(user.email, { name, bio, avatarUrl });
    if (result.ok) {
      setUser(prev => ({
        ...prev,
        name:      result.user.name,
        bio:       result.user.bio       ?? '',
        avatarUrl: result.user.avatarUrl ?? '',
      }));
    }
    return result;
  }, [user]);

  const handleUpdatePassword = useCallback((currentPassword, newPassword) => {
    if (!user) return { ok: false, error: 'Not logged in.' };
    return authUpdatePassword(user.email, currentPassword, newPassword);
  }, [user]);

  return {
    user,
    progress,
    ready,
    login:          handleLogin,
    register:       handleRegister,
    logout:         handleLogout,
    updateProgress,
    updateProfile:  handleUpdateProfile,
    updatePassword: handleUpdatePassword,
  };
}
