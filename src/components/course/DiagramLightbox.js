'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { T } from '@/lib/theme';

/**
 * Tap-to-enlarge wrapper for the lesson diagram (audit finding 12).
 *
 * The diagram is drawn on a 900×400 canvas. At phone width it renders about
 * 350px wide, a 0.39 scale: measured 29 Sep 2026, 16 of its 18 text labels
 * were under 8px tall, median 5px. Full screen on a portrait phone does not
 * fix that by itself, because the width is still ~343px. So when the viewport
 * is taller than it is wide, the enlarged diagram is ROTATED 90° to run along
 * the long axis of the screen: on 375×812 that is a 0.85 scale, median label
 * ~11px. Turn the phone and the overlay re-lays out unrotated. Desktop gets the
 * same overlay, unrotated, as large as the window allows. The browser's own
 * pinch-zoom still works on top (the viewport meta does not disable it).
 *
 * One component wraps all 26 diagrams. `renderDiagram(idPrefix)` is called
 * twice while open — once inline, once in the overlay — with different
 * prefixes, because the SVG defines a filter and a pattern by id and two
 * copies in one document must not share them.
 *
 * Keyboard and screen readers (Group 4's rule: things that navigate are links,
 * things that act are buttons):
 *   - the trigger is a real <button>, so it is in the tab order and opens on
 *     Enter or Space; the global button:focus-visible ring applies to it
 *   - the overlay is role="dialog" aria-modal="true", takes focus on open,
 *     keeps Tab inside (its only focusable control is Close), closes on
 *     Escape, on the Close button, or on a backdrop tap, and returns focus to
 *     the trigger on close
 *   - body scroll is locked while it is open
 * Not implemented: `inert` on the rest of the page. The Tab trap covers the
 * keyboard; a screen reader's virtual cursor can still reach the page behind.
 */
const RATIO = 900 / 400;   // diagram canvas aspect
const PAD   = 16;          // gutter around the enlarged diagram
const BAR   = 48;          // strip at the top of the overlay for Close + hint

export default function DiagramLightbox({ title, renderDiagram }) {
  const [open, setOpen] = useState(false);
  const [vp, setVp]     = useState({ w: 0, h: 0 });
  const triggerRef = useRef(null);
  const closeRef   = useRef(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const measure = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    measure();
    window.addEventListener('resize', measure);

    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      // Keep focus inside the dialog. Close is its only focusable element, so
      // Tab and Shift+Tab both land there rather than leaving for the page.
      if (e.key === 'Tab') { e.preventDefault(); closeRef.current?.focus(); }
    };
    document.addEventListener('keydown', onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const trigger = triggerRef.current;
    return () => {
      window.removeEventListener('resize', measure);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      trigger?.focus();
    };
  }, [open, close]);

  // Focus Close once it exists. The effect above runs before the portal's
  // first paint on some renders, so this catches the case where closeRef was
  // still null at that moment.
  useEffect(() => { if (open && vp.w) closeRef.current?.focus(); }, [open, vp.w]);

  /* ── Enlarged layout ─────────────────────────────────────────────────
     w/h are the diagram's rendered size. In portrait the diagram's long side
     runs down the screen, so the screen's height is its width budget. */
  const portrait = vp.h > vp.w;
  const longAxis  = (portrait ? vp.h : vp.w) - 2 * PAD - (portrait ? BAR : 0);
  const shortAxis = (portrait ? vp.w : vp.h) - 2 * PAD - (portrait ? 0 : BAR);
  const w = Math.max(0, Math.floor(Math.min(longAxis, shortAxis * RATIO)));
  const h = Math.floor(w / RATIO);

  const overlay = open && vp.w > 0 ? createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Enlarged diagram: ${title}`}
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(9,9,11,0.97)',
        display: 'flex', flexDirection: 'column',
        animation: 'fadeIn 0.15s ease both',
      }}
    >
      {/* top strip: hint + close */}
      <div style={{
        height: BAR, flexShrink: 0, padding: `0 ${PAD}px`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}>
        <span style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.1em', color: T.dim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {portrait ? 'ROTATED TO FIT · TURN YOUR PHONE OR PINCH TO ZOOM' : 'PINCH OR ZOOM FOR DETAIL'}
        </span>
        <button
          ref={closeRef}
          type="button"
          onClick={close}
          aria-label="Close enlarged diagram"
          style={{
            flexShrink: 0, background: T.bg2, border: `1px solid ${T.border2}`, color: T.text,
            padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
            fontFamily: T.font, fontWeight: 600, fontSize: 13,
          }}
        >
          ✕ Close
        </button>
      </div>

      {/* diagram, centred in the remaining space */}
      <div
        onClick={(e) => { if (e.target === e.currentTarget) close(); }}
        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: PAD, minHeight: 0 }}
      >
        {portrait ? (
          /* A w×h box rotated about its centre occupies h×w. The wrapper is
             that h×w footprint; the box is offset so their centres coincide. */
          <div style={{ position: 'relative', width: h, height: w, flexShrink: 0 }}>
            <div style={{
              position: 'absolute', width: w, height: h,
              left: (h - w) / 2, top: (w - h) / 2,
              transform: 'rotate(90deg)', transformOrigin: 'center',
            }}>
              {renderDiagram('la-lb')}
            </div>
          </div>
        ) : (
          <div style={{ width: w, height: h, flexShrink: 0 }}>
            {renderDiagram('la-lb')}
          </div>
        )}
      </div>
    </div>,
    document.body,
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`Enlarge diagram: ${title}`}
        title="Enlarge diagram"
        style={{
          // Explicit reset rather than `all: unset`, which would also unset the
          // focus outline the global button:focus-visible rule provides.
          display: 'block', width: '100%', padding: 0, margin: 0, border: 0,
          background: 'none', color: 'inherit', font: 'inherit', textAlign: 'left',
          cursor: 'zoom-in', borderRadius: 8,
        }}
      >
        {renderDiagram('la')}
        <span aria-hidden="true" style={{
          display: 'block', textAlign: 'right', marginTop: 6,
          fontFamily: T.mono, fontSize: 10, letterSpacing: '0.1em', color: T.dim,
        }}>
          ⤢ ENLARGE
        </span>
      </button>
      {overlay}
    </>
  );
}
