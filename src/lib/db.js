// ─── db.js — all Supabase database operations ────────────────────────────────
// Handles profiles, progress, and certificates.
// Auth (login/signup/logout) lives in supabase.js + useAuth.js.

import { createClient as _createClient } from '@supabase/supabase-js';
import { supabase } from './supabase';

// ── Pre-authed client factory ─────────────────────────────────────────────
// Creates a lightweight Supabase client that sends `accessToken` directly in
// the Authorization header — no getSession() calls, no Web Locks contention.
//
// Why this matters: the standard `supabase` client calls getSession() before
// every query to attach a fresh JWT. getSession() internally acquires the Web
// Locks API mutex "lock:sb-*-auth-token". If Supabase's own auto-refresh timer
// fires concurrently (which it always does on page load — it checks immediately
// whether the cached token needs refreshing) it calls lock() with steal:true,
// forcibly evicting our getSession() call and throwing:
//   "Lock was released because another request stole it"
//
// Passing the access_token we already received from onAuthStateChange bypasses
// getSession() entirely, so no lock is acquired and no contention is possible.
function makeTokenClient(accessToken) {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL   || '';
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return _createClient(url, anon, {
    auth: {
      persistSession:     false,
      autoRefreshToken:   false,
      detectSessionInUrl: false,
    },
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  });
}

// ── Cert ID generator (same algorithm as before) ──────────────────────────
function generateCertId(email) {
  const raw = email + new Date().toISOString() + Math.random().toString(36);
  let hash = 5381;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) + hash) + raw.charCodeAt(i);
    hash = hash & hash;
  }
  return 'PE-' + Math.abs(hash).toString(36).toUpperCase().padStart(8, '0');
}

// ── Normalize DB snake_case → camelCase for the rest of the app ───────────
function normalizeCert(row) {
  return {
    certId:        row.cert_id,
    name:          row.name,
    email:         row.email,
    pct:           row.pct,
    grade:         row.grade,
    moduleScores:  row.module_scores  || [],
    totalCorrect:  row.total_correct  || 0,
    totalPossible: row.total_possible || 0,
    issuedAt:      row.issued_at,
  };
}

// ── PROFILE ───────────────────────────────────────────────────────────────

export async function getProfile(userId, accessToken) {
  const client = accessToken ? makeTokenClient(accessToken) : supabase;
  const { data, error } = await client
    .from('profiles')
    .select('name, bio, avatar_url')
    .eq('id', userId)
    .maybeSingle();
  if (error) console.error('[db] getProfile error:', error.message);
  return data || null;
}

export async function upsertProfile(userId, { name, bio = '', avatarUrl = '' }) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, name: name.trim(), bio, avatar_url: avatarUrl }, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// ── PROGRESS ──────────────────────────────────────────────────────────────

export async function loadProgress(userId, accessToken) {
  const client = accessToken ? makeTokenClient(accessToken) : supabase;
  const { data, error } = await client
    .from('progress')
    .select('completed, quiz_scores, last_lesson')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) console.error('[db] loadProgress error:', error.message);
  if (!data) return { completed: {}, quizScores: {}, lastLesson: { m: 0, l: 0 } };
  return {
    completed:  data.completed   || {},
    quizScores: data.quiz_scores || {},
    lastLesson: data.last_lesson || { m: 0, l: 0 },
  };
}

export async function saveProgress(userId, progress) {
  const { error } = await supabase
    .from('progress')
    .upsert({
      user_id:     userId,
      completed:   progress.completed,
      quiz_scores: progress.quizScores,
      last_lesson: progress.lastLesson,
      updated_at:  new Date().toISOString(),
    }, { onConflict: 'user_id' });
  if (error) console.error('[db] saveProgress error:', error.message);
}

// ── CERTIFICATES ──────────────────────────────────────────────────────────

export async function issueCertificate(userId, { name, email, pct, grade, moduleScores, totalCorrect, totalPossible, existingCertId }) {
  // Return existing cert if already issued
  const existing = await getUserCert(userId);
  if (existing) return existing;

  // Use the preserved cert ID (migration) or generate a new one
  const certId = existingCertId || generateCertId(email);
  const { data, error } = await supabase
    .from('certificates')
    .insert({
      user_id:        userId,
      cert_id:        certId,
      name,
      email:          email.toLowerCase(),
      pct:            pct || 0,
      grade:          grade || 'F',
      module_scores:  moduleScores  || [],
      total_correct:  totalCorrect  || 0,
      total_possible: totalPossible || 0,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return normalizeCert(data);
}

export async function getUserCert(userId, accessToken) {
  const client = accessToken ? makeTokenClient(accessToken) : supabase;
  const { data, error } = await client
    .from('certificates')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) console.error('[db] getUserCert error:', error.message);
  return data ? normalizeCert(data) : null;
}

export async function getCertificateById(certId) {
  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('cert_id', certId)
    .maybeSingle();
  if (error) console.error('[db] getCertificateById error:', error.message, '| certId:', certId);
  return data ? normalizeCert(data) : null;
}
