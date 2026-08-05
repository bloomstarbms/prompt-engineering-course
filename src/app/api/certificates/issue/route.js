import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdmin';
import { MODULES, TOTAL_LESSONS } from '@/data/courseData';
import { getGrade } from '@/lib/theme';

/**
 * POST /api/certificates/issue
 *
 * Issues the caller's certificate. The server is the only issuer: it decides
 * who the caller is, whether they qualify, and what every field contains.
 *
 * ─── WHAT THIS DOES AND DOES NOT GUARANTEE ───────────────────────────────
 *  DOES:
 *    · Makes the server the sole issuer. Identity comes from a cryptographically
 *      verified bearer token, never from a user_id in the request body, so a
 *      caller cannot issue a certificate to (or as) somebody else.
 *    · Prevents client-injected certificate fields. name comes from profiles,
 *      email from the verified token, and pct / grade / module_scores are
 *      computed here from the progress table. The request body is ignored
 *      entirely — it carries no scores, no name, no identifiers.
 *    · Enforces completion server-side rather than trusting the UI's gate.
 *    · Is idempotent: an existing certificate is returned, never duplicated.
 *
 *  DOES NOT:
 *    · Make the underlying scores trustworthy. Quiz answer keys ship in the
 *      client bundle and grading runs in the browser, so quiz_scores in the
 *      progress table is self-reported by construction — a user can write it
 *      directly under the "progress: manage own" policy. Computing pct here
 *      relocates forgery (forge progress, then ask politely) rather than
 *      preventing it. That is an accepted property of a free, unproctored
 *      course, and the certificate copy states as much. It is NOT a claim
 *      this route makes good on.
 * ─────────────────────────────────────────────────────────────────────────
 */

export const dynamic = 'force-dynamic';

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

export async function POST(req) {
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Service unavailable. Please try again later.' }, { status: 503 });
  }

  // ── 1. Identity ─────────────────────────────────────────────────────────
  // The browser holds its session in localStorage (supabase-js), not a cookie,
  // so there is no server-readable session to consult. The client sends its
  // access token as a bearer credential and we verify it here. The user id is
  // therefore derived from a signed token that only Supabase could have issued
  // — not from anything the caller can assert.
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  const { data: authData, error: authError } = await admin.auth.getUser(token);
  if (authError || !authData?.user) {
    return NextResponse.json({ error: 'Your session has expired. Please sign in again.' }, { status: 401 });
  }
  const userId = authData.user.id;
  const email  = (authData.user.email || '').toLowerCase();

  // ── 2. Idempotency ──────────────────────────────────────────────────────
  // Checked before doing any work. unique(user_id) is the real guarantee; this
  // is the fast path that avoids relying on an error to detect the common case.
  const { data: existing, error: existingError } = await admin
    .from('certificates').select('*').eq('user_id', userId).maybeSingle();
  if (existingError) {
    return NextResponse.json({ error: 'Could not read your certificate. Please try again.' }, { status: 500 });
  }
  if (existing) {
    return NextResponse.json({ ok: true, issued: false, certificate: normalizeCert(existing) });
  }

  // ── 3. Eligibility and scores, computed here ────────────────────────────
  const { data: progressRow, error: progressError } = await admin
    .from('progress').select('completed, quiz_scores').eq('user_id', userId).maybeSingle();
  if (progressError) {
    return NextResponse.json({ error: 'Could not read your progress. Please try again.' }, { status: 500 });
  }

  const completed  = progressRow?.completed   || {};
  const quizScores = progressRow?.quiz_scores || {};

  const completedCount = Object.keys(completed).filter(k => completed[k]).length;
  if (completedCount < TOTAL_LESSONS) {
    return NextResponse.json({
      error: `Course not complete — ${completedCount} of ${TOTAL_LESSONS} lessons finished.`,
    }, { status: 403 });
  }

  // Name is read from the profile, never accepted from the caller, so the text
  // engraved on the certificate cannot be set arbitrarily at issue time.
  const { data: profile } = await admin
    .from('profiles').select('name').eq('id', userId).maybeSingle();
  const name = (profile?.name || '').trim();
  if (!name) {
    return NextResponse.json({
      error: 'Please set your display name before claiming your certificate.',
    }, { status: 400 });
  }

  // Aggregate exactly as the UI used to, but from the stored rows.
  let totalCorrect = 0, totalPossible = 0;
  for (const v of Object.values(quizScores)) {
    totalCorrect  += Number(v?.score) || 0;
    totalPossible += Number(v?.total) || 0;
  }
  const pct   = totalPossible > 0 ? Math.round((totalCorrect / totalPossible) * 100) : 0;
  const grade = getGrade(pct).letter;

  const moduleScores = MODULES.map((m, mi) => {
    let c = 0, t = 0;
    m.lessons.forEach((_, li) => {
      const s = quizScores[`${mi}-${li}`];
      if (s) { c += Number(s.score) || 0; t += Number(s.total) || 0; }
    });
    return { tag: m.tag, title: m.title, color: m.color, pct: t > 0 ? Math.round((c / t) * 100) : null };
  });

  // ── 4. Issue. cert_id is assigned by the database trigger (004) ─────────
  const { data: inserted, error: insertError } = await admin
    .from('certificates')
    .insert({
      user_id:        userId,
      name,
      email,
      pct,
      grade,
      module_scores:  moduleScores,
      total_correct:  totalCorrect,
      total_possible: totalPossible,
    })
    .select()
    .single();

  if (insertError) {
    // 23505: a concurrent request won the race. unique(user_id) did its job;
    // return the certificate that exists rather than surfacing an error.
    if (insertError.code === '23505') {
      const { data: raced } = await admin
        .from('certificates').select('*').eq('user_id', userId).maybeSingle();
      if (raced) {
        return NextResponse.json({ ok: true, issued: false, certificate: normalizeCert(raced) });
      }
    }
    console.error('[certificates/issue]', insertError.message);
    return NextResponse.json({ error: 'Could not issue your certificate. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, issued: true, certificate: normalizeCert(inserted) });
}
