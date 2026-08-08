import { notFound } from 'next/navigation';
import CourseApp from '@/components/CourseApp';
import JsonLd from '@/components/seo/JsonLd';
import { lessonBreadcrumbJsonLd, lessonJsonLd } from '@/lib/jsonld';
import { resolvePosition, allLessonParams, lessonHref } from '@/lib/courseRoutes';
import { MODULES } from '@/data/courseData';
import { SITE_NAME, absolute, clampDescription, isIndexable } from '@/lib/seo';

/**
 * NOINDEX — mostly steady state, not a holding measure. Read to the end
 * before removing this: a blanket removal is a regression.
 *
 * These routes currently serve an empty client-rendered shell that inherits the
 * landing page's title, description and og tags verbatim. 32 prerendered pages
 * presently share one title. Left indexable that is worse than the single
 * sparse page this started as: duplicate titles and thin content across every
 * lesson URL.
 *
 * noindex rather than a robots.txt Disallow, deliberately. Disallow blocks
 * crawling, not indexing — a blocked URL can still be indexed from inbound
 * links as a bare link with no snippet, and if any of these are already indexed
 * the crawler can never fetch the page to learn it should be dropped. noindex
 * permits the crawl and actively de-indexes. It also reverses cleanly: in
 * Task 4 the URLs are already known, so removing it flips them to indexable
 * rather than requiring rediscovery.
 *
 * `follow: true` so link equity still flows and the crawler reaches the
 * landing page.
 *
 * NOT A BLANKET HOLDING MEASURE — most of this is the steady state.
 *
 * Only the three public Module 01 lessons ever become indexable. The other 23
 * are gated, and gated bodies must stay out of the server-rendered HTML by
 * design, so those URLs are permanently contentless and should stay noindex
 * permanently. Task 4 therefore carves a small allow-list rather than removing
 * this tag: removing it broadly would silently re-expose 23 empty pages, which
 * is the same regression this commit fixed wearing a different hat.
 *
 * The sitemap must describe the same set — anything indexable is in it,
 * anything not is in neither.
 */
export async function generateMetadata({ params }) {
  const pos = resolvePosition(params.moduleSlug, params.lessonSlug);
  // Unknown slug: the page component calls notFound(), so this only has to
  // avoid throwing first. Metadata runs before the component.
  if (!pos) return { robots: { index: false, follow: false } };

  const mod = MODULES[pos.mi];
  const lesson = mod.lessons[pos.li];
  const href = lessonHref(pos.mi, pos.li);
  const description = clampDescription(lesson.intro);

  return {
    title: lesson.title,
    description,
    alternates: { canonical: href },
    // Read from the indexable set, never decided here. That is what keeps this
    // tag and the sitemap describing the same URLs. Resolves to false for all
    // 26 today; flipping PUBLIC_LESSONS_INDEXABLE changes this and the sitemap
    // together, in one edit, once the bodies are server-rendered.
    robots: { index: isIndexable(href), follow: true },
    openGraph: {
      title: `${lesson.title} · ${SITE_NAME}`,
      description,
      url: absolute(href),
      type: 'article',
      siteName: SITE_NAME,
    },
  };
}


/**
 * Real, shareable lesson URLs: /course/<moduleSlug>/<lessonSlug>
 *
 * This server component does one job — turn the URL into a position, or 404.
 * Resolution happens here and only here; CourseApp receives plain indices and
 * continues to key progress by them exactly as before.
 *
 * An unknown slug calls notFound() so it renders the real 404 page with a 404
 * status, rather than redirecting to the landing page or leaving an empty SPA
 * shell — both of which look to a crawler like a working page.
 */
export function generateStaticParams() {
  return allLessonParams();
}

export default function LessonPage({ params }) {
  const pos = resolvePosition(params.moduleSlug, params.lessonSlug);
  if (!pos) notFound();
  return (
    <>
      {/* Server-rendered, so this reaches the HTML even though the lesson body
          does not yet. Present on gated lessons too: it describes the lesson,
          it does not disclose it, and it is ready for the day the three public
          URLs become indexable. */}
      <JsonLd data={lessonBreadcrumbJsonLd(pos.mi, pos.li)} />
      <JsonLd data={lessonJsonLd(pos.mi, pos.li)} />
      <CourseApp initialM={pos.mi} initialL={pos.li} />
    </>
  );
}
