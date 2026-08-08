import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdmin';

/**
 * POST /api/auth/register
 *
 * Creates a new user via the Supabase Admin API with email_confirm: true,
 * which skips the email-confirmation step entirely.  The client can then
 * call signInWithPassword() immediately after this succeeds — no inbox
 * check required.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY to be set in the environment.
 * This key is NEVER exposed to the browser (no NEXT_PUBLIC_ prefix).
 */
export async function POST(req) {
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: 'Service unavailable. Please try again later.' },
      { status: 503 },
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { name, email, password, consented, legacyMigration } = body;

  // ── Basic server-side validation ──────────────────────────────────────
  if (!name?.trim())     return NextResponse.json({ error: 'Name is required.' },              { status: 400 });
  if (!email?.trim())    return NextResponse.json({ error: 'Email is required.' },             { status: 400 });
  if (!password)         return NextResponse.json({ error: 'Password is required.' },          { status: 400 });
  if (password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });

  /* Consent is enforced here, not only in the form.
     The checkbox is what a person meets; this is what makes it a control
     rather than a decoration, since anything can POST to this endpoint.

     legacyMigration is the one bypass, and it is explicit on purpose. That
     path runs inside login(), for someone whose account predates Supabase and
     who is being migrated during sign-in — they never saw a checkbox and
     inventing consent for them would be a lie in a column meant as evidence.
     Their consented_at stays null, which is the accurate answer. */
  if (!legacyMigration && consented !== true) {
    return NextResponse.json(
      { error: 'You must confirm you are 18 or older and accept the Terms and Privacy Policy.' },
      { status: 400 },
    );
  }

  /* Stamped from the server clock, never from the client's.
     A timestamp the subject supplies is not evidence of anything. */
  const consentedAt = consented === true ? new Date().toISOString() : null;

  // ── Create user (auto-confirmed — no email needed) ────────────────────
  const { data, error } = await admin.auth.admin.createUser({
    email:         email.trim().toLowerCase(),
    password,
    email_confirm: true,               // ← bypasses the confirmation email
    user_metadata: { name: name.trim() },
  });

  if (error) {
    // Map known Supabase admin errors to friendly messages
    const msg = error.message?.toLowerCase() || '';
    if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('already exists')) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Try logging in instead.' },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message || 'Registration failed.' }, { status: 400 });
  }

  // ── Create profile row while we have the admin client ─────────────────
  // This runs before the client signs in, so RLS restrictions don't apply.
  //
  // THE RESULT IS CHECKED. It previously was not: a failed write returned
  // ok:true and the caller signed in to an account with no profile row, so no
  // name and no consent record, with nothing anywhere saying so. Migration 006
  // made that concrete — deploy the code before the column exists and every
  // registration half-succeeds — but the defect is independent of it. Any
  // write can fail.
  if (!data.user) {
    console.error('[register] createUser returned no user');
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }

  const { error: profileError } = await admin
    .from('profiles')
    .upsert(
      { id: data.user.id, name: name.trim(), bio: '', avatar_url: '', consented_at: consentedAt },
      { onConflict: 'id', ignoreDuplicates: true },
    );

  if (profileError) {
    /* The auth user already exists at this point, so returning an error and
       stopping would strand the address: the caller cannot register again
       ("already exists") and has no usable account. Undo it, so retrying is a
       real option rather than a dead end. */
    const { error: cleanupError } = await admin.auth.admin.deleteUser(data.user.id);
    console.error(
      '[register] profile write failed:', profileError.message,
      cleanupError ? `| ROLLBACK FAILED: ${cleanupError.message}` : '| auth user removed',
    );
    return NextResponse.json(
      {
        error: cleanupError
          ? 'Your account was partly created and we could not undo it. Please get in touch before trying this email address again.'
          : 'Could not finish creating your account. Nothing was saved — please try again.',
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
