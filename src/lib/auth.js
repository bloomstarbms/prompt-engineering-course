// ─── auth.js — all user management via localStorage ───────────────────────
// No backend required. Data persists in the browser per device.
// Structure:
//   pe_users          → { [email]: { name, email, passwordHash, bio, avatarUrl, createdAt } }
//   pe_progress_{email} → { completed, quizScores, lastLesson }
//   pe_certs          → { [certId]: { name, email, pct, grade, date, modules } }
//   pe_session        → { email, name, bio, avatarUrl }

const USERS_KEY     = 'pe_users';
const SESSION_KEY   = 'pe_session';
const CERTS_KEY     = 'pe_certs';
const progressKey   = (email) => `pe_progress_${email}`;

// ── simple hash (not crypto-secure, fine for a course app) ─────────────────
function hashPassword(password) {
  let hash = 0;
  const str = password + 'pe_salt_2025';
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function generateCertId(email, date) {
  const raw = email + date + Math.random().toString(36);
  let hash = 5381;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) + hash) + raw.charCodeAt(i);
    hash = hash & hash;
  }
  return 'PE-' + Math.abs(hash).toString(36).toUpperCase().padStart(8, '0');
}

// ── safe localStorage wrappers (persistent: users, progress, certs) ────────
function get(key) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : null;
  } catch { return null; }
}
function set(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
}

// ── sessionStorage wrappers (session only — cleared when browser closes) ───
// This ensures users must enter their password every time they open the site.
function sessionGet(key) {
  try {
    const v = sessionStorage.getItem(key);
    return v ? JSON.parse(v) : null;
  } catch { return null; }
}
function sessionSet(key, value) {
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
}
function sessionRemove(key) {
  try { sessionStorage.removeItem(key); } catch { /* */ }
}

// ── USER AUTH ──────────────────────────────────────────────────────────────
export function register(name, email, password) {
  const users = get(USERS_KEY) || {};
  const key = email.toLowerCase().trim();
  if (users[key]) return { ok: false, error: 'An account with this email already exists.' };
  if (!name.trim()) return { ok: false, error: 'Name is required.' };
  if (password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };

  users[key] = {
    name: name.trim(),
    email: key,
    passwordHash: hashPassword(password),
    bio: '',
    avatarUrl: '',
    createdAt: new Date().toISOString(),
  };
  set(USERS_KEY, users);
  const sessionUser = { email: key, name: name.trim(), bio: '', avatarUrl: '' };
  sessionSet(SESSION_KEY, sessionUser);
  return { ok: true, user: users[key] };
}

export function login(email, password) {
  const users = get(USERS_KEY) || {};
  const key = email.toLowerCase().trim();
  const user = users[key];
  if (!user) return { ok: false, error: 'No account found with this email.' };
  if (user.passwordHash !== hashPassword(password)) return { ok: false, error: 'Incorrect password.' };
  const sessionUser = { email: key, name: user.name, bio: user.bio || '', avatarUrl: user.avatarUrl || '' };
  sessionSet(SESSION_KEY, sessionUser);
  return { ok: true, user };
}

export function getUser(email) {
  const users = get(USERS_KEY) || {};
  return users[email.toLowerCase().trim()] || null;
}

export function updateProfile(email, { name, bio, avatarUrl }) {
  const users = get(USERS_KEY) || {};
  const key = email.toLowerCase().trim();
  if (!users[key]) return { ok: false, error: 'User not found.' };
  if (name !== undefined && !name.trim()) return { ok: false, error: 'Name cannot be empty.' };

  if (name !== undefined) users[key].name = name.trim();
  if (bio !== undefined) users[key].bio = bio;
  if (avatarUrl !== undefined) users[key].avatarUrl = avatarUrl;
  set(USERS_KEY, users);

  // Keep session in sync
  const session = sessionGet(SESSION_KEY);
  if (session && session.email === key) {
    session.name = users[key].name;
    session.bio = users[key].bio;
    session.avatarUrl = users[key].avatarUrl;
    sessionSet(SESSION_KEY, session);
  }
  return { ok: true, user: users[key] };
}

export function updatePassword(email, currentPassword, newPassword) {
  const users = get(USERS_KEY) || {};
  const key = email.toLowerCase().trim();
  if (!users[key]) return { ok: false, error: 'User not found.' };
  if (users[key].passwordHash !== hashPassword(currentPassword)) return { ok: false, error: 'Current password is incorrect.' };
  if (newPassword.length < 6) return { ok: false, error: 'New password must be at least 6 characters.' };
  if (currentPassword === newPassword) return { ok: false, error: 'New password must be different from current password.' };
  users[key].passwordHash = hashPassword(newPassword);
  set(USERS_KEY, users);
  return { ok: true };
}

/* Forgot-password reset — bypasses current password check.
 * Safe because: account data is stored in this browser's localStorage,
 * so only someone physically on this device can call this. */
export function resetPasswordByEmail(email, newPassword) {
  const users = get(USERS_KEY) || {};
  const key = email.toLowerCase().trim();
  if (!users[key]) return { ok: false, error: 'No account found with this email on this device.' };
  if (newPassword.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };
  users[key].passwordHash = hashPassword(newPassword);
  set(USERS_KEY, users);
  return { ok: true };
}

export function logout() {
  sessionRemove(SESSION_KEY);
}

export function getSession() {
  return sessionGet(SESSION_KEY);
}

// ── PROGRESS ───────────────────────────────────────────────────────────────
export function loadProgress(email) {
  return get(progressKey(email)) || { completed: {}, quizScores: {}, lastLesson: { m: 0, l: 0 } };
}

export function saveProgress(email, progress) {
  set(progressKey(email), progress);
}

// ── CERTIFICATES ──────────────────────────────────────────────────────────
export function issueCertificate({ name, email, pct, grade, moduleScores, totalCorrect, totalPossible }) {
  // Check if this user already has a cert
  const certs = get(CERTS_KEY) || {};
  const existing = Object.values(certs).find(c => c.email === email.toLowerCase());
  if (existing) return existing;

  const certId = generateCertId(email, new Date().toISOString());
  const cert = {
    certId,
    name,
    email: email.toLowerCase(),
    pct,
    grade,
    moduleScores,
    totalCorrect,
    totalPossible,
    issuedAt: new Date().toISOString(),
  };
  certs[certId] = cert;
  set(CERTS_KEY, certs);
  return cert;
}

export function getCertificate(certId) {
  const certs = get(CERTS_KEY) || {};
  return certs[certId] || null;
}

export function getAllCerts() {
  return get(CERTS_KEY) || {};
}

export function getUserCert(email) {
  const certs = get(CERTS_KEY) || {};
  return Object.values(certs).find(c => c.email === email.toLowerCase()) || null;
}
