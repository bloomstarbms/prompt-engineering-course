'use client';
import { useState, useEffect, useId } from 'react';
import Link from 'next/link';
import { T } from '@/lib/theme';
import { REVIEWS_ENABLED } from '@/lib/docs';
import { getMyReview, submitReview, withdrawReview } from '@/lib/db';
import {
  REVIEW_BODY_MIN, REVIEW_BODY_MAX, displayNameFor, cleanBody, bodyProblem,
} from '@/lib/reviewRules';

/**
 * The review invitation and form. Rendered on the certificate page (after
 * issuance) and on the profile page; the same component in both places so
 * the copy, the consent line and the states cannot drift.
 *
 * Renders NOTHING when REVIEWS_ENABLED is false, when the person holds no
 * certificate, or until the first GET has answered — a box that appears and
 * then vanishes is worse than one that arrives a moment late.
 *
 * States:
 *   form     no review yet, or editing an existing one
 *   view     the stored review with its status chip, Edit and Withdraw
 *
 * Everything the server decides (eligibility, the display name, status) is
 * read back from the server; this component never computes a status and only
 * previews the display name with the same function the route uses.
 */

const STATUS = {
  pending:     { label: 'Pending review',  color: T.warning },
  approved:    { label: 'Published',       color: T.success },
  rejected:    { label: 'Not published',   color: T.dim },
  unpublished: { label: 'Not published',   color: T.dim },
};

function StatusChip({ status }) {
  const s = STATUS[status] || STATUS.pending;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontFamily: T.mono, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
      color: s.color, border: `1px solid ${s.color}55`, background: `${s.color}14`,
      borderRadius: 100, padding: '3px 10px', whiteSpace: 'nowrap',
    }}>
      <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: s.color }}/>
      {s.label}
    </span>
  );
}

const labelStyle = { fontFamily: T.mono, fontSize: 10, color: T.dim, letterSpacing: '0.12em', textTransform: 'uppercase' };

export default function ReviewBox({ callAuthed, variant = 'profile' }) {
  const [state,    setState]    = useState('loading');   // loading | hidden | view | form
  const [review,   setReview]   = useState(null);
  const [certName, setCertName] = useState('');
  const [body,     setBody]     = useState('');
  const [attr,     setAttr]     = useState('first_initial');
  const [busy,     setBusy]     = useState(false);
  const [error,    setError]    = useState('');
  const [notice,   setNotice]   = useState('');
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const uid = useId();

  useEffect(() => {
    if (!REVIEWS_ENABLED || !callAuthed) { setState('hidden'); return; }
    let cancelled = false;
    (async () => {
      try {
        const r = await callAuthed(getMyReview);
        if (cancelled) return;
        if (!r?.eligible) { setState('hidden'); return; }
        setCertName(r.certName || '');
        setReview(r.review);
        if (r.review) { setBody(r.review.body); setAttr(r.review.attribution); }
        setState(r.review ? 'view' : 'form');
      } catch (e) {
        // A failed read hides the box rather than showing an empty form that
        // would fail again on submit. The certificate and profile pages carry
        // on without it.
        console.warn('[ReviewBox] could not load review:', e?.message);
        if (!cancelled) setState('hidden');
      }
    })();
    return () => { cancelled = true; };
  }, [callAuthed]);

  if (!REVIEWS_ENABLED || state === 'loading' || state === 'hidden') return null;

  const cleaned = cleanBody(body);
  const count   = cleaned.length;
  const problem = bodyProblem(cleaned);
  const preview = displayNameFor(certName, attr);
  const editingPublished = state === 'form' && review?.status === 'approved';

  async function onSubmit(e) {
    e.preventDefault();
    if (problem) { setError(problem); return; }
    setBusy(true); setError(''); setNotice('');
    try {
      const r = await callAuthed(tok => submitReview(tok, { body: cleaned, attribution: attr }));
      setReview(r.review);
      setBody(r.review.body); setAttr(r.review.attribution);
      setState('view');
      setNotice(r.resubmitted ? 'Updated. It comes back once we have read it again.' : 'Thank you. We read every review before it goes up.');
    } catch (err) {
      setError(err?.message || 'Could not save your review. Please try again.');
    } finally { setBusy(false); }
  }

  async function onWithdraw() {
    setBusy(true); setError(''); setNotice('');
    try {
      await callAuthed(withdrawReview);
      setReview(null); setBody(''); setAttr('first_initial'); setConfirmWithdraw(false);
      setState('form');
      setNotice('Withdrawn. Nothing of it remains on the site.');
    } catch (err) {
      setError(err?.message || 'Could not withdraw your review. Please try again.');
    } finally { setBusy(false); }
  }

  const card = {
    background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 14,
    padding: 'clamp(18px,4vw,24px)', fontFamily: T.font,
  };

  return (
    <section
      aria-labelledby={`${uid}-h`}
      className="no-print"
      style={{ marginTop: variant === 'cert' ? 36 : 32, maxWidth: variant === 'cert' ? 640 : undefined, marginLeft: 'auto', marginRight: 'auto' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={labelStyle}>Your review</span>
        <div style={{ flex: 1, height: 1, background: T.border }}/>
        {state === 'view' && review && <StatusChip status={review.status}/>}
      </div>

      <div style={card}>
        {/* ── Stored review ── */}
        {state === 'view' && review && (
          <div>
            <h3 id={`${uid}-h`} style={{ fontFamily: T.display, fontWeight: 700, fontSize: 16, color: T.text, margin: '0 0 10px', letterSpacing: '-0.02em' }}>
              What should someone starting tomorrow know?
            </h3>
            <blockquote style={{
              margin: 0, padding: '14px 16px', borderLeft: `2px solid ${T.accentBorder}`,
              background: T.bg, borderRadius: '0 10px 10px 0',
              fontFamily: T.font, fontSize: 14, color: T.text, lineHeight: 1.7, whiteSpace: 'pre-wrap',
            }}>
              {review.body}
              <footer style={{ marginTop: 10, fontFamily: T.mono, fontSize: 11, color: T.muted, letterSpacing: '0.04em' }}>
                — {review.displayName}
              </footer>
            </blockquote>
            <p style={{ fontFamily: T.font, fontSize: 12, color: T.dim, lineHeight: 1.6, margin: '12px 0 0' }}>
              {review.status === 'approved'
                ? 'This is on the home page. Editing takes it down until we approve the new version.'
                : review.status === 'pending'
                  ? 'We read every review before it goes up. You can edit or withdraw it at any time.'
                  : 'This one is not on the site. You can edit it and send it again, or withdraw it.'}
            </p>
            {notice && <p role="status" style={{ fontFamily: T.font, fontSize: 12.5, color: T.success, margin: '10px 0 0' }}>{notice}</p>}
            {error  && <p role="alert"  style={{ fontFamily: T.font, fontSize: 12.5, color: T.error,   margin: '10px 0 0' }}>{error}</p>}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
              <button type="button" onClick={() => { setState('form'); setNotice(''); setError(''); setConfirmWithdraw(false); }} disabled={busy} style={{
                background: T.bg2, border: `1px solid ${T.border2}`, color: T.text,
                padding: '9px 16px', borderRadius: 8, cursor: 'pointer',
                fontFamily: T.font, fontWeight: 600, fontSize: 13,
              }}>Edit</button>
              {!confirmWithdraw ? (
                <button type="button" onClick={() => setConfirmWithdraw(true)} disabled={busy} style={{
                  background: 'none', border: `1px solid ${T.border}`, color: T.muted,
                  padding: '9px 16px', borderRadius: 8, cursor: 'pointer',
                  fontFamily: T.font, fontWeight: 600, fontSize: 13,
                }}>Withdraw</button>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" onClick={onWithdraw} disabled={busy} style={{
                    background: 'rgba(248,113,113,0.10)', border: `1px solid rgba(248,113,113,0.40)`, color: T.error,
                    padding: '9px 16px', borderRadius: 8, cursor: 'pointer',
                    fontFamily: T.font, fontWeight: 700, fontSize: 13,
                  }}>{busy ? 'Withdrawing…' : 'Yes, withdraw it'}</button>
                  <button type="button" onClick={() => setConfirmWithdraw(false)} disabled={busy} style={{
                    background: 'none', border: 'none', color: T.muted, padding: '9px 6px', cursor: 'pointer',
                    fontFamily: T.font, fontSize: 13,
                  }}>Keep it</button>
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── Form ── */}
        {state === 'form' && (
          <form onSubmit={onSubmit} noValidate>
            <h3 id={`${uid}-h`} style={{ fontFamily: T.display, fontWeight: 700, fontSize: 16, color: T.text, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
              What should someone starting tomorrow know?
            </h3>
            <p style={{ fontFamily: T.font, fontSize: 13, color: T.muted, lineHeight: 1.65, margin: '0 0 16px' }}>
              Say it in your own words. We publish it on the home page as you wrote it, under your name as you choose to show it, after a quick check.
            </p>
            {editingPublished && (
              <p style={{ fontFamily: T.font, fontSize: 12.5, color: T.warning, lineHeight: 1.6, margin: '0 0 14px' }}>
                This review is on the home page now. Saving a change takes it down until we approve the new version.
              </p>
            )}

            {/* The section label above already reads "Your review"; this one is
                for the accessibility tree only, so the field has a name. */}
            <label htmlFor={`${uid}-body`} style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}>Your review</label>
            <textarea
              id={`${uid}-body`} value={body} onChange={e => { setBody(e.target.value); setError(''); }}
              rows={5} maxLength={REVIEW_BODY_MAX + 200}
              aria-describedby={`${uid}-count`}
              placeholder="Two or three sentences is plenty."
              style={{
                width: '100%', boxSizing: 'border-box', resize: 'vertical', minHeight: 110,
                background: T.bg, border: `1.5px solid ${error ? T.error + '60' : T.border}`,
                borderRadius: 10, padding: '12px 14px',
                fontFamily: T.font, fontSize: 14, color: T.text, lineHeight: 1.6, outline: 'none',
              }}
              onFocus={e => { e.target.style.borderColor = T.accent; e.target.style.boxShadow = '0 0 0 3px rgba(129,140,248,0.12)'; }}
              onBlur={e => { e.target.style.borderColor = error ? T.error + '60' : T.border; e.target.style.boxShadow = 'none'; }}
            />
            <div id={`${uid}-count`} aria-live="polite" style={{
              fontFamily: T.mono, fontSize: 11, marginTop: 6, textAlign: 'right',
              color: count > REVIEW_BODY_MAX ? T.error : count < REVIEW_BODY_MIN ? T.dim : T.muted,
            }}>
              {count} / {REVIEW_BODY_MAX}{count > 0 && count < REVIEW_BODY_MIN ? ` · at least ${REVIEW_BODY_MIN}` : ''}
            </div>

            <fieldset style={{ border: 'none', padding: 0, margin: '14px 0 0' }}>
              <legend style={{ ...labelStyle, marginBottom: 8, padding: 0 }}>Shown as</legend>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[
                  ['first_initial', 'First name and initial'],
                  ['full',          'Full name'],
                ].map(([value, text]) => {
                  const on = attr === value;
                  return (
                    <label key={value} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 9, cursor: 'pointer',
                      background: on ? T.accentLight : T.bg, border: `1.5px solid ${on ? T.accentBorder : T.border}`,
                      borderRadius: 10, padding: '9px 13px', flex: '1 1 200px', minWidth: 0,
                    }}>
                      <input type="radio" name={`${uid}-attr`} value={value} checked={on} onChange={() => setAttr(value)}
                        style={{ accentColor: T.accent, margin: 0, flexShrink: 0 }}/>
                      <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span style={{ fontFamily: T.font, fontSize: 13, color: T.text, fontWeight: 600 }}>{text}</span>
                        <span style={{ fontFamily: T.mono, fontSize: 11, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          — {displayNameFor(certName, value)}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <p style={{ fontFamily: T.font, fontSize: 12, color: T.dim, lineHeight: 1.6, margin: '16px 0 0' }}>
              By submitting you agree to the review being shown publicly under the name format you chose — see{' '}
              <Link href="/privacy" style={{ color: T.muted }}>Privacy Policy §3</Link>.
            </p>

            {error  && <p role="alert"  style={{ fontFamily: T.font, fontSize: 12.5, color: T.error,   margin: '12px 0 0' }}>{error}</p>}
            {notice && <p role="status" style={{ fontFamily: T.font, fontSize: 12.5, color: T.success, margin: '12px 0 0' }}>{notice}</p>}

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 16 }}>
              {/* Never disabled for validation: a disabled button is not
                  focusable and tells a keyboard user nothing. Clicking with a
                  short or long body shows the message instead (onSubmit). Only
                  an in-flight request disables it. */}
              <button type="submit" disabled={busy} style={{
                background: busy ? T.bg3 : T.accent, border: 'none',
                color: busy ? T.dim : '#fff',
                padding: '11px 22px', borderRadius: 9, cursor: busy ? 'default' : 'pointer',
                fontFamily: T.font, fontWeight: 700, fontSize: 14,
                boxShadow: busy ? 'none' : '0 4px 16px rgba(99,102,241,0.35)',
              }}>
                {busy ? 'Sending…' : review ? 'Save changes' : 'Submit review'}
              </button>
              {review && (
                <button type="button" onClick={() => { setState('view'); setBody(review.body); setAttr(review.attribution); setError(''); }} disabled={busy} style={{
                  background: 'none', border: 'none', color: T.muted, padding: '11px 8px', cursor: 'pointer',
                  fontFamily: T.font, fontSize: 13,
                }}>Cancel</button>
              )}
              <span style={{ fontFamily: T.font, fontSize: 12, color: T.faint, marginLeft: 'auto' }}>
                Optional. Never required for your certificate.
              </span>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
