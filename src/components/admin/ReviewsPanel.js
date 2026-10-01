'use client';
import { useState, useEffect, useCallback } from 'react';
import { T } from '@/lib/theme';
import { REVIEWS_ENABLED } from '@/lib/docs';
import { listReviews, moderateReview, rebuildHomePage } from '@/lib/adminApi';

/**
 * Moderation. Four actions and a rebuild; no editing, by decision and by the
 * terms ("shown as you wrote it or not at all"). The list is refetched after
 * every action so the screen never shows a state the database has left.
 */

const STATUS_COLOR = { pending: T.warning, approved: T.success, rejected: T.dim, unpublished: T.info };
const FILTERS = ['pending', 'approved', 'unpublished', 'rejected', 'all'];

function when(iso) {
  return iso ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
}

function ActionBtn({ children, onClick, tone = 'neutral', disabled }) {
  const colors = {
    neutral: { bg: T.bg2, border: T.border2, fg: T.text },
    good:    { bg: 'rgba(52,211,153,0.10)', border: 'rgba(52,211,153,0.40)', fg: T.success },
    warn:    { bg: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.40)', fg: T.warning },
    bad:     { bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.40)', fg: T.error },
  }[tone];
  return (
    <button type="button" onClick={onClick} disabled={disabled} style={{
      background: colors.bg, border: `1px solid ${colors.border}`, color: colors.fg,
      padding: '7px 13px', borderRadius: 8, cursor: disabled ? 'default' : 'pointer',
      fontFamily: T.font, fontWeight: 600, fontSize: 12, opacity: disabled ? 0.5 : 1,
    }}>{children}</button>
  );
}

export default function ReviewsPanel({ callAuthed }) {
  const [data,    setData]    = useState(null);
  const [error,   setError]   = useState('');
  const [notice,  setNotice]  = useState('');
  const [busy,    setBusy]    = useState(false);
  const [filter,  setFilter]  = useState('pending');
  const [confirm, setConfirm] = useState(null);   // id awaiting delete confirmation

  // `silent` keeps whatever message an action just set: the list is refetched
  // after every action, and a successful refetch must not erase "Could not
  // approve" — that is exactly the moment the message matters.
  const load = useCallback(async ({ silent = false } = {}) => {
    try { setData(await callAuthed(listReviews)); if (!silent) setError(''); }
    catch (e) { setError(e?.message || 'Could not load reviews.'); }
  }, [callAuthed]);

  useEffect(() => { if (REVIEWS_ENABLED) load(); }, [load]);

  if (!REVIEWS_ENABLED) {
    return (
      <div style={{ marginTop: 36, padding: '14px 18px', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, fontFamily: T.mono, fontSize: 11, color: T.dim }}>
        reviews: off — REVIEWS_ENABLED is false in src/lib/docs.js. The table, routes and this panel are built; nothing is reachable until it is true.
      </div>
    );
  }

  async function act(action, id) {
    setBusy(true); setError(''); setNotice('');
    try {
      const r = await callAuthed(tok => moderateReview(tok, action, id));
      setNotice(action === 'delete' ? 'Deleted.' : `Now ${r.review?.status}.`);
      setConfirm(null);
    } catch (e) {
      setError(e?.message || `Could not ${action}.`);
    } finally {
      setBusy(false);
      await load({ silent: true });
    }
  }
  async function rebuild() {
    setBusy(true); setError(''); setNotice('');
    try { await callAuthed(rebuildHomePage); setNotice('Home page revalidated. Load https://www.prompten.xyz/ fresh to confirm.'); }
    catch (e) { setError(e?.message || 'Could not rebuild.'); }
    finally { setBusy(false); }
  }

  const reviews = (data?.reviews || []).filter(r => filter === 'all' || r.status === filter);
  const counts  = data?.counts || {};

  return (
    <section aria-labelledby="reviews-h" style={{ marginTop: 36 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <h2 id="reviews-h" style={{ fontFamily: T.font, fontWeight: 700, fontSize: 15, color: T.text, margin: 0 }}>Reviews</h2>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTERS.map(f => {
            const on = filter === f;
            const n = f === 'all' ? Object.values(counts).reduce((a, b) => a + b, 0) : (counts[f] || 0);
            return (
              <button key={f} type="button" onClick={() => setFilter(f)} aria-pressed={on} style={{
                background: on ? T.accentLight : 'none', border: `1px solid ${on ? T.accentBorder : T.border}`,
                color: on ? T.text : T.muted, padding: '5px 10px', borderRadius: 100, cursor: 'pointer',
                fontFamily: T.mono, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>{f} {n}</button>
            );
          })}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <ActionBtn onClick={() => load()} disabled={busy}>↻ Reload</ActionBtn>
          <ActionBtn onClick={rebuild} disabled={busy}>Rebuild home page</ActionBtn>
        </div>
      </div>

      {error  && <p role="alert"  style={{ fontFamily: T.font, fontSize: 13, color: T.error,   margin: '0 0 12px' }}>{error}</p>}
      {notice && <p role="status" style={{ fontFamily: T.font, fontSize: 13, color: T.success, margin: '0 0 12px' }}>{notice}</p>}

      {!data && !error && <p style={{ fontFamily: T.mono, fontSize: 11, color: T.dim }}>Loading…</p>}

      {data && reviews.length === 0 && (
        <p style={{ fontFamily: T.font, fontSize: 13, color: T.faint, padding: '24px 0' }}>Nothing {filter === 'all' ? 'yet' : filter}.</p>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {reviews.map(r => (
          <article key={r.id} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 14, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
              <span style={{ fontFamily: T.font, fontWeight: 700, fontSize: 13, color: T.text }}>{r.displayName}</span>
              <span style={{ fontFamily: T.mono, fontSize: 10, color: T.dim }}>{r.attribution === 'full' ? 'full name' : 'first + initial'}</span>
              <span style={{
                fontFamily: T.mono, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
                color: STATUS_COLOR[r.status], border: `1px solid ${STATUS_COLOR[r.status]}55`, borderRadius: 100, padding: '2px 9px',
              }}>{r.status}</span>
              <span style={{ marginLeft: 'auto', fontFamily: T.mono, fontSize: 10, color: T.faint }}>
                submitted {when(r.submittedAt)} · edited {when(r.updatedAt)} · consent {r.consentVersion}
              </span>
            </div>
            <blockquote style={{ margin: 0, fontFamily: T.font, fontSize: 14, color: T.text, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{r.body}</blockquote>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12, alignItems: 'center' }}>
              {['pending', 'rejected', 'unpublished'].includes(r.status) && <ActionBtn tone="good" onClick={() => act('approve', r.id)} disabled={busy}>Approve</ActionBtn>}
              {r.status === 'pending'  && <ActionBtn tone="warn" onClick={() => act('reject', r.id)} disabled={busy}>Reject</ActionBtn>}
              {r.status === 'approved' && <ActionBtn tone="warn" onClick={() => act('unpublish', r.id)} disabled={busy}>Unpublish</ActionBtn>}
              {confirm === r.id ? (
                <>
                  <ActionBtn tone="bad" onClick={() => act('delete', r.id)} disabled={busy}>Yes, delete</ActionBtn>
                  <ActionBtn onClick={() => setConfirm(null)} disabled={busy}>Keep</ActionBtn>
                </>
              ) : (
                <ActionBtn tone="bad" onClick={() => setConfirm(r.id)} disabled={busy}>Delete</ActionBtn>
              )}
              <span style={{ marginLeft: 'auto', fontFamily: T.mono, fontSize: 10, color: T.faint }}>user {r.userId.slice(0, 8)}… · decided {when(r.decidedAt)}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
