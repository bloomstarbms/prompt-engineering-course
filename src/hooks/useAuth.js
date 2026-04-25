'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { getProfile, upsertProfile, loadProgress, saveProgress } from '@/lib/db';

export function useAuth() {
  const [user,     setUser]     = useState(null);   // { email, name, bio, avatarUrl }
  const [userId,   setUserId]   = useState(null);   // Supabase auth UUID
  const [progress, setProgress] = useState({ completed: {}, quizScores: {}, lastLesson: { m: 0, l: 0 } });
  const [ready,    setReady]    = useState(false);
  const saveTimer = useRef(null);

  // ── Hydrate user + progress from Supabase ────────────────────────────
  async function hydrateUser(authUser) {
    try {
      const profile = await getProfile(authUser.id);
      setUserId(authUser.id);
      setUser({
        email:     authUser.email,
        name:      profile?.name       ?? authUser.email.split('@')[0],
        bio:       profile?.bio        ?? '',
        avatarUrl: profile?.avatar_url ?? '',
      });
      const prog = await loadProgress(authUser.id);
      setProgress(prog);
    } catch (e) {
      console.error('[useAuth] hydrateUser error', e);
    }
  }

  // ── Session listener ─────────────────────────────────────────────────
  useEffect(() => {
    // Restore any existing session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) await hydrateUser(session.user);
      setReady(true);
    });

    // Keep in sync with Supabase auth state changes (login / logout / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await hydrateUser(session.user);
      } else {
        setUser(null);
        setUserId(null);
        setProgress({ completed: {}, quizScores: {}, lastLesson: { m: 0, l: 0 } });
      }
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── LOGIN ────────────────────────────────────────────────────────────
  const handleLogin = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }, []);

  // ── REGISTER ─────────────────────────────────────────────────────────
  const handleRegister = useCallback(async (name, email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { ok: false, error: error.message };

    // Create profile row immediately after signup
    if (data.user) {
      try {
        await upsertProfile(data.user.id, { name, bio: '', avatarUrl: '' });
      } catch { /* profile will be created on next login if this fails */ }

      // Track enrollment (fire-and-forget)
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'enroll', email, name }),
      }).catch(() => {});
    }

    // Supabase may require email confirmation — if so, session won't exist yet
    if (!data.session) {
      return { ok: true, needsConfirm: true };
    }
    return { ok: true };
  }, []);

  // ── LOGOUT ───────────────────────────────────────────────────────────
  const handleLogout = useCallback(async () => {
    clearTimeout(saveTimer.current);
    await supabase.auth.signOut();
  }, []);

  // ── PROGRESS ─────────────────────────────────────────────────────────
  // Debounce saves to avoid hitting Supabase on every click
  const updateProgress = useCallback((updater) => {
    if (!userId) return;
    setProgress(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => saveProgress(userId, next), 800);
      return next;
    });
  }, [userId]);

  // ── UPDATE PROFILE ───────────────────────────────────────────────────
  const handleUpdateProfile = useCallback(async ({ name, bio, avatarUrl }) => {
    if (!userId) return { ok: false, error: 'Not logged in.' };
    try {
      await upsertProfile(userId, { name, bio: bio ?? '', avatarUrl: avatarUrl ?? '' });
      setUser(prev => ({ ...prev, name, bio: bio ?? '', avatarUrl: avatarUrl ?? '' }));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }, [userId]);

  // ── UPDATE PASSWORD ──────────────────────────────────────────────────
  const handleUpdatePassword = useCallback(async (currentPassword, newPassword) => {
    if (!user) return { ok: false, error: 'Not logged in.' };
    // Verify current password by attempting re-auth
    const { error: verifyErr } = await supabase.auth.signInWithPassword({
      email: user.email, password: currentPassword,
    });
    if (verifyErr) return { ok: false, error: 'Current password is incorrect.' };
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }, [user]);

  return {
    user,
    userId,
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
