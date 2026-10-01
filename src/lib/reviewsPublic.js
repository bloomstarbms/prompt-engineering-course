// ─── reviewsPublic.js — the approved reviews, for the home page ──────────
// SERVER-ONLY. Called from app/page.js at render time (static, regenerated
// hourly and on every moderation action via revalidatePath('/')).
//
// Returns the array to render, and NEVER throws: the home page is the one
// page that must always render. No database (previews), a network error, a
// missing table, a flag that is off — every one of those is "no reviews",
// and the page renders without the section. It is not an empty shell: the
// whole rest of the landing page is unaffected.
//
// What leaves this module is exactly what the page shows: body, the stored
// display_name, and the decision date. No user_id, no email, no consent
// version. The service-role key stays here; the browser never sees a row.
import 'server-only';
import { createAdminClient } from '@/lib/supabaseAdmin';
import { REVIEWS_ENABLED } from '@/lib/docs';

/** How many to show at most. The row scrolls past 4; a dozen is plenty. */
export const HOME_REVIEWS_MAX = 12;

export async function getApprovedReviews() {
  if (!REVIEWS_ENABLED) return [];
  try {
    const admin = createAdminClient();
    if (!admin) return [];
    const { data, error } = await admin
      .from('reviews')
      .select('id, body, display_name, decided_at')
      .eq('status', 'approved')
      .order('decided_at', { ascending: false })
      .limit(HOME_REVIEWS_MAX);
    if (error) {
      console.error('[reviewsPublic] fetch failed:', error.message);
      return [];
    }
    return (data || []).map(r => ({
      id: r.id, body: r.body, displayName: r.display_name, decidedAt: r.decided_at,
    }));
  } catch (e) {
    console.error('[reviewsPublic] fetch threw:', e?.message || e);
    return [];
  }
}
