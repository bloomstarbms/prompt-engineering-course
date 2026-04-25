import { supabase } from '@/lib/supabase';

export async function POST(req) {
  /* Silently succeed if Supabase isn't configured yet */
  if (!supabase) return Response.json({ ok: true, configured: false });

  try {
    const { event, email, name } = await req.json();
    if (!event || !email) return Response.json({ ok: false, error: 'Missing fields' }, { status: 400 });

    const normalEmail = email.toLowerCase().trim();

    /* Upsert with onConflict — idempotent by design.
       The unique index on (email, event) means duplicate calls are silently
       ignored instead of racing: no SELECT → INSERT TOCTOU window. */
    const { error } = await supabase
      .from('course_events')
      .upsert(
        { event, email: normalEmail, name: name || '' },
        { onConflict: 'email,event', ignoreDuplicates: true }
      );

    if (error) throw error;
    return Response.json({ ok: true });
  } catch (e) {
    /* Never break the app if analytics fails */
    console.error('[track]', e.message);
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
