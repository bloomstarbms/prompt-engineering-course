import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/auth/verify-password
 *
 * Verifies that { email, password } match a valid Supabase account.
 * Used by the ProfilePage "change password" form to check the current
 * password BEFORE calling supabase.auth.updateUser() on the client.
 *
 * Why server-side?
 * Calling supabase.auth.signInWithPassword() from the browser uses the
 * Web Locks API with `steal: true`, which forcibly releases any lock
 * held by a concurrent DB query (e.g. an in-flight profile save) and
 * causes: "Lock was released because another request stole it."
 *
 * Running the same call server-side (Node.js) never touches the browser
 * lock, so the error cannot occur.
 *
 * Returns:
 *   200 { ok: true }              — credentials are valid
 *   401 { error: '...' }          — wrong password
 *   400 { error: '...' }          — bad request
 *   503 { error: '...' }          — Supabase env vars missing
 */
export async function POST(req) {
  const url    = process.env.NEXT_PUBLIC_SUPABASE_URL      || '';
  const anon   = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!url || !anon) {
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

  const { email, password } = body;
  if (!email?.trim() || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  // Create a short-lived server-side client — no session persistence, no
  // auto-refresh, no storage.  This is Node.js so there is no Web Locks API.
  const client = createClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await client.auth.signInWithPassword({
    email:    email.trim().toLowerCase(),
    password,
  });

  if (error) {
    return NextResponse.json(
      { error: 'Current password is incorrect.' },
      { status: 401 },
    );
  }

  return NextResponse.json({ ok: true });
}
