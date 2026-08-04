import { createHash, timingSafeEqual } from 'node:crypto';
import { createAdminClient } from '@/lib/supabaseAdmin';

/* Constant-time secret comparison.
   `!==` on strings short-circuits at the first differing byte, so response
   timing leaks how much of the token a caller guessed correctly. timingSafeEqual
   fixes that but throws when the two buffers differ in length — so we SHA-256
   both sides first: always 32 bytes, and the digest of a wrong-length guess is
   just as uncorrelated as any other wrong guess. */
function secretsMatch(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

export async function POST(req) {
  /* Auth check — token travels in the request body, not the URL, to avoid
     it appearing in server logs or browser history. */
  const body = await req.json().catch(() => ({}));
  const token = body.token;
  const secret = process.env.ADMIN_SECRET;

  if (!secret || !secretsMatch(token, secret)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = createAdminClient();
  if (!db) {
    return Response.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const { data: events, error } = await db
    .from('course_events')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const enrollments  = events.filter(e => e.event === 'enroll');
  const completions  = events.filter(e => e.event === 'complete');
  const rate = enrollments.length > 0
    ? Math.round(completions.length / enrollments.length * 100) : 0;

  return Response.json({
    totalEnrollments: enrollments.length,
    totalCompletions: completions.length,
    completionRate: rate,
    recentEnrollments: enrollments.slice(0, 20).map(e => ({
      name: e.name, email: e.email, at: e.created_at,
    })),
    recentCompletions: completions.slice(0, 20).map(e => ({
      name: e.name, email: e.email, at: e.created_at,
    })),
  });
}
