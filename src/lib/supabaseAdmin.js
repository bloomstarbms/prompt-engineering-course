// ─── supabaseAdmin.js — SERVER-ONLY Supabase client ──────────────────────────
// Isolated from lib/supabase.js (which is imported by client components) so the
// service-role key is never referenced from a module that reaches the browser.
// Next.js strips non-NEXT_PUBLIC_ env values from client bundles, so nothing
// leaked before — but keeping the admin path in its own server-only module
// means a future refactor can't accidentally pull the key into client code.
//
// Import this ONLY from route handlers / server components.

import { createClient } from '@supabase/supabase-js';

/* Hard runtime guard: if this module is ever imported into a client bundle,
   fail loudly at import time rather than shipping silently. */
if (typeof window !== 'undefined') {
  throw new Error('lib/supabaseAdmin.js is server-only and must not be imported by client code.');
}

const url    = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/* Admin client — bypasses RLS. Behaviour unchanged from the previous
   implementation in lib/supabase.js; only the import boundary moved. */
export function createAdminClient() {
  if (!url || !svcKey) return null;
  return createClient(url, svcKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
