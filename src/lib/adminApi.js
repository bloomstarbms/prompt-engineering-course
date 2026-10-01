// ─── adminApi.js — the dashboard's calls, client-safe ───────────────────
// Every call takes the access token and is meant to be run through
// callAuthed() from useAuth, which retries once on a 401 with a fresh token.
// Errors carry `status` for that, and `notAdmin` so the dashboard can tell
// "sign in" from "this account is not an admin".
async function request(path, accessToken, { method = 'GET', body } = {}) {
  const res = await fetch(path, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* non-JSON error page */ }
  if (!res.ok) {
    const err = new Error(json?.error || `Admin service returned ${res.status}.`);
    err.status   = res.status;
    err.notAdmin = res.status === 403;
    throw err;
  }
  return json;
}

export const fetchStatsAsAdmin = (token)              => request('/api/stats', token, { method: 'POST' });
export const listReviews       = (token)              => request('/api/admin/reviews', token);
export const moderateReview    = (token, action, id)  => request('/api/admin/reviews', token, { method: 'POST', body: { action, id } });
export const rebuildHomePage   = (token)              => request('/api/admin/reviews', token, { method: 'POST', body: { action: 'rebuild' } });
