/**
 * ─── reviewRules.js — the rules a review must satisfy, in one place ──────
 *
 * Client-safe: constants and pure functions only, no Supabase, no secrets.
 * The server route (/api/reviews/mine) is what ENFORCES these; the profile
 * page's form uses the same constants for its counter and its hint text, so
 * the two cannot disagree about what "too short" means. Migration 014 repeats
 * the length and attribution checks as column constraints, so a bypassed
 * route still cannot store anything these rules refuse.
 */

export const REVIEW_BODY_MIN = 20;
export const REVIEW_BODY_MAX = 600;

/** How the author's name is shown. No anonymous option, by decision: an
 *  unattributed review on our own home page is indistinguishable from one we
 *  made up. The default in the UI is first_initial. */
export const ATTRIBUTIONS = ['first_initial', 'full'];

/**
 * The text that will appear beside the review, derived from the name on the
 * person's certificate. "Adaeze Okafor" → "Adaeze O." / "Adaeze Okafor". A
 * single-word name has no initial to add and is shown as it is. Computed at
 * submission and STORED (reviews.display_name), so a later profile rename
 * cannot alter what was published under consent.
 */
export function displayNameFor(certName, attribution) {
  const parts = String(certName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (attribution === 'full') return parts.join(' ');
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

/**
 * Normalise what was typed before measuring or storing it: CRLF → LF, C0
 * control characters other than newline removed (they render as nothing and
 * would count toward the length), runs of blank lines collapsed, trimmed.
 * The words themselves are never altered — "shown as you wrote it or not at
 * all" (terms §6) — this only removes what a reader could not see anyway.
 */
export function cleanBody(raw) {
  return String(raw ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Why a body is unacceptable, or null when it is fine. Shared wording. */
export function bodyProblem(body) {
  const n = body.length;
  if (n < REVIEW_BODY_MIN) return `Please write at least ${REVIEW_BODY_MIN} characters.`;
  if (n > REVIEW_BODY_MAX) return `Please keep it under ${REVIEW_BODY_MAX} characters (yours is ${n}).`;
  return null;
}

/** DB row → the shape the client sees. user_id and decided_by stay server-side. */
export function normalizeReview(row) {
  if (!row) return null;
  return {
    body:           row.body,
    attribution:    row.attribution,
    displayName:    row.display_name,
    status:         row.status,
    consentVersion: row.consent_version,
    submittedAt:    row.submitted_at,
    updatedAt:      row.updated_at,
    decidedAt:      row.decided_at,
  };
}
