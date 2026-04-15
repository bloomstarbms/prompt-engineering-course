import { createClient } from '@supabase/supabase-js';

const url   = process.env.NEXT_PUBLIC_SUPABASE_URL   || '';
const anon  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const svcKey= process.env.SUPABASE_SERVICE_ROLE_KEY   || '';

/* Public client — used for event inserts */
export const supabase = url && anon
  ? createClient(url, anon)
  : null;

/* Server-only admin client — bypasses RLS, used in API routes only */
export function createAdminClient() {
  if (!url || !svcKey) return null;
  return createClient(url, svcKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
