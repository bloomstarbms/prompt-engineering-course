import { createClient } from '@supabase/supabase-js';

// Client-safe module: only NEXT_PUBLIC_* values are referenced here.
// The service-role admin client lives in lib/supabaseAdmin.js (server-only).
const url  = process.env.NEXT_PUBLIC_SUPABASE_URL      || '';
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/* Public client — anon key, RLS-constrained, safe in the browser */
export const supabase = url && anon
  ? createClient(url, anon)
  : null;
