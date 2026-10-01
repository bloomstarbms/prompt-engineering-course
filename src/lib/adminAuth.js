// ─── adminAuth.js — who may use the admin routes ─────────────────────────
// SERVER-ONLY. Admin is a signed-in account whose user id is listed in the
// ADMIN_USER_IDS environment variable (comma-separated). The id comes from a
// bearer token that Supabase verifies, the same way the certificate and
// review routes identify their caller; nothing in the request body can
// assert it.
//
// This replaces the shared ADMIN_SECRET password, which had no identity
// (anyone holding the string was "the admin", with no record of who) and no
// revocation short of rotating it everywhere. An id list can be edited one
// entry at a time, and every moderation decision records decided_by.
//
// Order of the switch-over, because the only person who can be locked out of
// /admin is its owner: this helper was added ALONGSIDE the password check in
// /api/stats and verified on production by the owner before the password
// path was removed in a later commit. If ADMIN_USER_IDS is ever unset, every
// admin route answers 403 for everyone — including the owner — and the fix
// is the environment variable, not the code.
import 'server-only';

if (typeof window !== 'undefined') {
  throw new Error('lib/adminAuth.js is server-only and must not be imported by client code.');
}

export function adminUserIds() {
  return (process.env.ADMIN_USER_IDS || '')
    .split(',').map(s => s.trim()).filter(Boolean);
}

/**
 * Resolve the caller from the bearer token and check the id list.
 * Returns { admin, userId } on success, or { response } carrying the right
 * status: 401 when there is no usable session, 403 when there is one but it
 * is not an admin. The two are kept distinct so the dashboard can say
 * "sign in" versus "this account is not an admin".
 */
export async function requireAdmin(req, admin) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return { response: Response.json({ error: 'Not signed in.' }, { status: 401 }) };

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) {
    return { response: Response.json({ error: 'Your session has expired. Please sign in again.' }, { status: 401 }) };
  }
  const userId = data.user.id;
  if (!adminUserIds().includes(userId)) {
    return { response: Response.json({ error: 'This account is not an admin.' }, { status: 403 }) };
  }
  return { admin, userId };
}
