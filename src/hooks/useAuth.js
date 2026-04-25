'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { getProfile, upsertProfile, loadProgress, saveProgress, issueCertificate } from '@/lib/db';

// ── Legacy localStorage helpers (migration only — read but never write) ───
const LS_USERS    = 'pe_users';
const LS_CERTS    = 'pe_certs';
const lsGet = (key) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; } };
const lsProgressKey = (email) => `pe_progress_${email}`;

function legacyHashPassword(password) {
  let hash = 0;
  const str = password + 'pe_salt_2025';
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/* Returns the old localStorage user IF the password matches, else null */
function getLegacyUser(email, password) {
  if (typeof window === 'undefined') return null;
  const users = lsGet(LS_USERS) || {};
  const key = email.toLowerCase().trim();
  const user = users[key];
  if (!user) return null;
  if (user.passwordHash !== legacyHashPassword(password)) return null;
  return user;
}

/* Migrate old localStorage data to Supabase — runs once, silently */
async function migrateLegacyUser(supabaseUserId, legacyUser) {
  try {
    // 1. Profile
    await upsertProfile(supabaseUserId, {
      name:      legacyUser.name      || '',
      bio:       legacyUser.bio       || '',
      avatarUrl: legacyUser.avatarUrl || '',
    });

    // 2. Progress
    const legacyProgress = lsGet(lsProgressKey(legacyUser.email));
    if (legacyProgress) {
      await saveProgress(supabaseUserId, {
        completed:  legacyProgress.completed  || {},
        quizScores: legacyProgress.quizScores || {},
        lastLesson: legacyProgress.lastLesson || { m: 0, l: 0 },
      });
    }

    // 3. Certificate (preserve the original certId so old verify links keep working)
    const allCerts = lsGet(LS_CERTS) || {};
    const legacyCert = Object.values(allCerts).find(c => c.email === legacyUser.email.toLowerCase());
    if (legacyCert) {
      await issueCertificate(supabaseUserId, {
        name:          legacyCert.name,
        email:         legacyCert.email,
        pct:           legacyCert.pct           || 0,
        grade:         legacyCert.grade         || 'F',
        moduleScores:  legacyCert.moduleScores  || [],
        totalCorrect:  legacyCert.totalCorrect  || 0,
        totalPossible: legacyCert.totalPossible || 0,
        existingCertId: legacyCert.certId,  // preserve so old verify links still work
      });
    }
  } catch (e) {
    console.warn('[migration] partial failure — some data may not have migrated', e);
  }
}

export function useAuth() {
  const [user,     setUser]     = useState(null);   // { email, name, bio, avatarUrl }
  const [userId,   setUserId]   = useState(null);   // Supabase auth UUID
  const [progress, setProgress] = useState({ completed: {}, quizScores: {}, lastLesson: { m: 0, l: 0 } });
  const [ready,    setReady]    = useState(false);
  const saveTimer    = useRef(null);
  const userIdRef    = useRef(null);   // mirrors userId for use inside event listeners/cleanup
  const progressRef  = useRef(null);  // tracks latest unsaved progress state

  // ── Hydrate user + progress from Supabase ────────────────────────────
  async function hydrateUser(authUser) {
    try {
      // Fetch profile and progress in parallel — faster and ensures React 18
      // automatic batching applies to all three state setters below, so
      // CourseApp's position-restore effect sees the loaded progress in the
      // same render cycle that it sees the new user value.
      const [profile, prog] = await Promise.all([
        getProfile(authUser.id),
        loadProgress(authUser.id),
      ]);

      // Name priority: saved profile → auth metadata (set at signup) → email prefix.
      // The metadata fallback handles the case where the profiles insert failed
      // during signup because email confirmation was required (no session = RLS
      // blocked the insert). Now that we have an active session we can create it.
      const metaName = authUser.user_metadata?.name || '';
      const displayName = profile?.name?.trim() || metaName || authUser.email.split('@')[0];

      // If no profile row exists but we have a name from metadata, create the row
      // now while we have an active session (so RLS allows the insert).
      if (!profile && metaName) {
        try {
          await upsertProfile(authUser.id, { name: metaName, bio: '', avatarUrl: '' });
        } catch { /* non-fatal — will retry on next hydration */ }
      }

      // Set progress BEFORE user so that when CourseApp's useEffect fires on
      // the user change it already sees the loaded progress data.
      setProgress(prog);
      setUserId(authUser.id);
      userIdRef.current = authUser.id;
      setUser({
        email:     authUser.email,
        name:      displayName,
        bio:       profile?.bio        ?? '',
        avatarUrl: profile?.avatar_url ?? '',
      });
    } catch (e) {
      console.error('[useAuth] hydrateUser error', e);
    }
  }

  // ── Session listener ─────────────────────────────────────────────────
  useEffect(() => {
    // Guard: Supabase not configured (missing env vars) — mark ready so the
    // app doesn't hang on the splash screen forever.
    if (!supabase) { setReady(true); return; }

    // Restore any existing session on mount.
    // The try/finally ensures setReady(true) fires even if hydrateUser throws
    // (e.g. Supabase unreachable, DB permission error, network timeout).
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        try {
          if (session) await hydrateUser(session.user);
        } catch { /* hydrateUser error is logged internally */ }
        setReady(true);
      })
      .catch(() => setReady(true)); // auth itself threw — still unblock the app

    // Keep in sync with Supabase auth state changes (login / logout / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (session) {
          await hydrateUser(session.user);
        } else {
          // Clear both state and refs so the beforeunload handler doesn't
          // attempt to save stale progress after sign-out.
          clearTimeout(saveTimer.current);
          progressRef.current = null;
          userIdRef.current   = null;
          setUser(null);
          setUserId(null);
          setProgress({ completed: {}, quizScores: {}, lastLesson: { m: 0, l: 0 } });
        }
      } catch (e) {
        console.error('[useAuth] onAuthStateChange handler error', e);
      }
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Flush pending debounced saves on page close or hook unmount ──────
  // Uses refs so the callbacks are stable across re-renders without needing
  // deps — progressRef.current always has the latest unsaved state.
  useEffect(() => {
    const flush = () => {
      if (userIdRef.current && progressRef.current) {
        saveProgress(userIdRef.current, progressRef.current).catch(() => {});
        progressRef.current = null;
      }
    };
    window.addEventListener('beforeunload', flush);
    return () => {
      window.removeEventListener('beforeunload', flush);
      clearTimeout(saveTimer.current);
      flush(); // also flush when the hook unmounts
    };
  }, []); // empty deps — intentional, we rely on refs

  // ── LOGIN ────────────────────────────────────────────────────────────
  const handleLogin = useCallback(async (email, password) => {
    if (!supabase) return { ok: false, error: 'Service unavailable. Please try again later.' };
    // 1. Try Supabase auth first (normal path for all new accounts)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) return { ok: true };

    // 2. Supabase login failed — check if this is an old localStorage user
    //    who hasn't been migrated yet (same device/browser they registered on)
    const legacyUser = getLegacyUser(email, password);
    if (!legacyUser) {
      // Not a legacy user either — return the original Supabase error
      return { ok: false, error: 'Incorrect email or password.' };
    }

    // 3. Legacy user found and password verified — create their Supabase account
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) {
      // If signup fails (e.g. email already in Supabase but different password),
      // fall back to the original error
      return { ok: false, error: 'Incorrect email or password.' };
    }

    // 4. Migrate their data to Supabase in the background
    if (signUpData.user) {
      await migrateLegacyUser(signUpData.user.id, legacyUser);
    }

    // 5. If email confirmation is required, the session won't exist yet
    if (!signUpData.session) {
      return { ok: true, needsConfirm: true };
    }

    return { ok: true };
  }, []);

  // ── REGISTER ─────────────────────────────────────────────────────────
  const handleRegister = useCallback(async (name, email, password) => {
    if (!supabase) return { ok: false, error: 'Service unavailable. Please try again later.' };
    // Store name in auth user metadata so it survives even when the profiles
    // table insert fails before email confirmation (no session = RLS blocks it).
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: name.trim() } },
    });
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
  // Pass immediate=true for critical events (lesson completion, quiz done)
  // so the save isn't lost if the user closes the tab within 800ms.
  // Position-only updates (lastLesson) stay debounced to avoid excessive writes.
  const updateProgress = useCallback((updater, immediate = false) => {
    if (!userId) return;
    setProgress(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      progressRef.current = next; // always keep ref in sync with latest state
      if (immediate) {
        clearTimeout(saveTimer.current);
        saveProgress(userId, next).catch(() => {});
        progressRef.current = null;
      } else {
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
          saveProgress(userId, next).catch(() => {});
          progressRef.current = null;
        }, 800);
      }
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
