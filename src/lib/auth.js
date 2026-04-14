// ─── auth.js — all user management via localStorage ───────────────────────
// No backend required. Data persists in the browser per device.
// Structure:
//   pe_users          → { [email]: { name, email, passwordHash, createdAt } }
//   pe_progress_{email} → { completed, quizScores, lastLesson }
//   pe_certs          → { [certId]: { name, email, pct, grade, date, modules } }
//   pe_session        → { email, name }

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

// ── safe localStorage wrappers ─────────────────────────────────────────────
function get(key) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : null;
  } catch { return null; }
}
function set(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
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
    createdAt: new Date().toISOString(),
  };
  set(USERS_KEY, users);
  set(SESSION_KEY, { email: key, name: name.trim() });
  return { ok: true, user: users[key] };
}

export function login(email, password) {
  const users = get(USERS_KEY) || {};
  const key = email.toLowerCase().trim();
  const user = users[key];
  if (!user) return { ok: false, error: 'No account found with this email.' };
  if (user.passwordHash !== hashPassword(password)) return { ok: false, error: 'Incorrect password.' };
  set(SESSION_KEY, { email: key, name: user.name });
  return { ok: true, user };
}

export function logout() {
  try { localStorage.removeItem(SESSION_KEY); } catch { /* */ }
}

export function getSession() {
  return get(SESSION_KEY);
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
