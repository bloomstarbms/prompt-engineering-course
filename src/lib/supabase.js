import { createClient } from '@supabase/supabase-js';

// Client-safe module: only NEXT_PUBLIC_* values are referenced here.
// The service-role admin client lives in lib/supabaseAdmin.js (server-only).
const url  = process.env.NEXT_PUBLIC_SUPABASE_URL      || '';
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * ─── WHY THIS MODULE NO LONGER EXPORTS `null` ────────────────────────────
 *
 * It used to. `export const supabase = url && anon ? createClient(...) : null`
 * looks careful — it avoids a crash — but it pushes the decision about what a
 * missing backend MEANS out to every call site, and there are ten of them.
 * Each one answered differently, and three answered "carry on":
 *
 *   useAuth.js   `if (!supabase) { setReady(true); return; }`
 *                → the app renders as SIGNED OUT. Indistinguishable, to the
 *                  user and to us, from simply not being logged in.
 *   useAuth.js   `if (supabase) await supabase.auth.signOut();`
 *                → logout does nothing and still reports success.
 *   reset-password  `if (!supabase) return;`
 *                → the form renders and silently never works.
 *
 * A fourth consumer, /api/track, returned `{ ok: true, configured: false }` —
 * a 200 with a success shape, for a write that never happened. Analytics were
 * dead and every signal available said fine.
 *
 * The common defect is not any one guard. It is that `null` is a value the
 * program can carry around and keep working with. Something unusable must not
 * be quietly substitutable for something usable.
 *
 * ─── WHAT THIS DOES INSTEAD ──────────────────────────────────────────────
 *
 * When configuration is missing, `supabase` is a Proxy that throws a named
 * error on ANY property access. There is no path where a caller touches it and
 * gets silence. The failure arrives at the line that actually needed the
 * client, with a message that says what is missing.
 *
 * ─── WHY A PROXY AND NOT `throw` AT MODULE SCOPE ─────────────────────────
 *
 * Throwing on import would be louder still, and was rejected deliberately.
 * This module is imported by client components that are server-rendered, so a
 * module-scope throw takes down every page — including the ones that never
 * touch Supabase — the instant configuration is wrong in the server runtime.
 * As of 17 Aug 2026 we have an UNRESOLVED case where exactly that may have
 * been true in production while every browser worked fine (see
 * SECURITY-NOTES.md). Shipping a boot-time throw before that is understood
 * could take the whole site down rather than one feature. The Proxy fails at
 * the point of use, which is loud enough and cannot cascade.
 *
 * ─── IF YOU WANT TO DEGRADE GRACEFULLY, SAY SO EXPLICITLY ────────────────
 *
 * Import SUPABASE_CONFIGURED and branch on it. That is a deliberate, readable
 * decision to handle the unconfigured case. What is no longer possible is
 * doing it BY ACCIDENT, which is what `null` allowed.
 */

/** True when both public values are present. Branch on this, never on truthiness. */
export const SUPABASE_CONFIGURED = Boolean(url && anon);

function unconfiguredClient() {
  const explain = (prop) =>
    `Supabase is not configured, so \`supabase.${String(prop)}\` cannot be used. ` +
    `Missing: ${[!url && 'NEXT_PUBLIC_SUPABASE_URL', !anon && 'NEXT_PUBLIC_SUPABASE_ANON_KEY']
      .filter(Boolean).join(' and ')}. ` +
    `Note these are read at BUILD time for browser bundles and at RUNTIME for ` +
    `server code, so they can be present in one and absent in the other. ` +
    `To handle this case deliberately, import SUPABASE_CONFIGURED instead.`;

  return new Proxy(Object.create(null), {
    get(_target, prop) {
      /* Let the runtime inspect the object without detonating. Throwing inside
         console.log, JSON.stringify, React devtools or an `await` would turn a
         clear error into a confusing one somewhere else entirely. */
      if (
        prop === Symbol.toPrimitive ||
        prop === Symbol.toStringTag ||
        prop === Symbol.iterator ||
        prop === Symbol.asyncIterator ||
        prop === 'then' ||            // not a thenable: `await supabase` must not hang
        prop === 'toJSON' ||
        prop === 'constructor' ||
        prop === '$$typeof' ||        // React probes this when rendering values
        prop === 'nodeType'
      ) {
        return undefined;
      }
      throw new Error(explain(prop));
    },
    has()  { return true; },
    set(_t, prop) { throw new Error(explain(prop)); },
  });
}

/**
 * Public client — anon key, RLS-constrained, safe in the browser.
 *
 * NOTE FOR ANYONE READING A `!supabase` CHECK IN OLD CODE: this value is now
 * ALWAYS truthy. Such a check can never fire and is dead. The guards that
 * existed when this changed were migrated to SUPABASE_CONFIGURED in the same
 * commit; if you find a new one, it is a bug, not a safety net.
 */
export const supabase = SUPABASE_CONFIGURED ? createClient(url, anon) : unconfiguredClient();
