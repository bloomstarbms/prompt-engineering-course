import { supabase } from '@/lib/supabase';

export async function POST(req) {
  /* Silently succeed if Supabase isn't configured yet */
  if (!supabase) return Response.json({ ok: true, configured: false });

  try {
    const { event, email, name } = await req.json();
    if (!event || !email) return Response.json({ ok: false, error: 'Missing fields' }, { status: 400 });

    const normalEmail = email.toLowerCase().trim();

    /* Deduplicate — don't record the same event twice for the same user */
    const { data: existing } = await supabase
      .from('course_events')
      .select('id')
      .eq('email', normalEmail)
      .eq('event', event)
      .maybeSingle();

    if (existing) return Response.json({ ok: true, duplicate: true });

    const { error } = await supabase
      .from('course_events')
      .insert({ event, email: normalEmail, name: name || '' });

    if (error) throw error;
    return Response.json({ ok: true });
  } catch (e) {
    /* Never break the app if analytics fails */
    console.error('[track]', e.message);
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
