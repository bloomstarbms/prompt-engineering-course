import { MODULES } from '@/data/courseData';

/**
 * On-demand loader for lesson prose.
 *
 * Bodies are 74% of the original courseData.js. Keeping them in the always
 * loaded bundle meant every visitor downloaded all 26 lessons to read one.
 *
 * ─── WHY THE LOADER MAP IS WRITTEN OUT LONGHAND ──────────────────────────
 * `import('./modules/' + slug + '.js')` would defeat the purpose: a fully
 * dynamic specifier makes the bundler include every possible match in one
 * chunk, so nothing is actually split. Static specifiers are what let each
 * module become its own chunk.
 *
 * ─── SERVER VS CLIENT (this constrains Task 4) ───────────────────────────
 * Awaiting this in a SERVER component is fine — the body ends up in the
 * server-rendered HTML, which is what a JavaScript-disabled reader needs.
 * Awaiting it in a CLIENT component means the body arrives after hydration
 * and never reaches the HTML source. Public lessons must therefore load
 * their body on the server; gated lessons can load theirs on the client,
 * since their content is deliberately absent from the HTML anyway.
 * ────────────────────────────────────────────────────────────────────────── */
const LOADERS = {
  'foundations-of-llms':         () => import('@/data/modules/foundations-of-llms'),
  'core-techniques':             () => import('@/data/modules/core-techniques'),
  'advanced-systems':            () => import('@/data/modules/advanced-systems'),
  'output-engineering':          () => import('@/data/modules/output-engineering'),
  'optimization-and-evaluation': () => import('@/data/modules/optimization-and-evaluation'),
  'domain-applications':         () => import('@/data/modules/domain-applications'),
  'production-and-mastery':      () => import('@/data/modules/production-and-mastery'),
  'advanced-frontiers':          () => import('@/data/modules/advanced-frontiers'),
};

/** All bodies for one module, keyed by lesson slug. */
export async function loadModuleBodies(moduleSlug) {
  const load = LOADERS[moduleSlug];
  if (!load) return {};
  const mod = await load();
  return mod.bodies || {};
}

/**
 * One lesson's body, addressed by POSITION.
 *
 * Takes indices rather than slugs so callers keep working in the same
 * coordinates progress is keyed by; the slug lookup happens internally and is
 * never round-tripped back into a storage key.
 */
export async function loadLessonBody(mi, li) {
  const m = MODULES[mi];
  const l = m?.lessons?.[li];
  if (!m || !l) return '';
  const bodies = await loadModuleBodies(m.slug);
  return bodies[l.slug] || '';
}

/** Warm the chunk for a module without using the result (see navigation prefetch). */
export function prefetchModuleBodies(moduleSlug) {
  const load = LOADERS[moduleSlug];
  if (load) load().catch(() => {});
}
