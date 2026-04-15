import { createAdminClient } from '@/lib/supabase';

export async function GET(req) {
  /* Auth check */
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const secret = process.env.ADMIN_SECRET;

  if (!secret || token !== secret) {
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
