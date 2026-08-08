import { MODULES, TOTAL_LESSONS } from '@/data/courseData';
import { SITE_URL, SITE_NAME, absolute } from '@/lib/seo';
import { lessonHref, moduleHref } from '@/lib/courseRoutes';

/**
 * Structured data builders.
 *
 * Everything here is derived from courseData rather than typed out, so the
 * markup cannot claim something the course does not contain. That matters more
 * than usual with schema.org: Google treats structured data that contradicts
 * the visible page as a manual-action risk, and a hardcoded lesson count or
 * duration is exactly the kind of thing that rots silently after an edit.
 */

/** Total taught minutes, summed from the authored lesson durations. */
function courseWorkloadISO() {
  const minutes = MODULES.reduce(
    (total, m) => total + m.lessons.reduce((t, l) => {
      const n = parseInt(String(l.dur ?? '').match(/\d+/)?.[0] ?? '0', 10);
      return t + (Number.isFinite(n) ? n : 0);
    }, 0),
    0,
  );
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `PT${h ? `${h}H` : ''}${m ? `${m}M` : ''}`;
}

/** Course schema for the landing page. */
export function courseJsonLd() {
  const workload = courseWorkloadISO();
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: 'Prompt Engineering',
    description:
      `A free, career-grade prompt engineering course: ${MODULES.length} modules, `
      + `${TOTAL_LESSONS} lessons, graded quizzes and a certificate of completion.`,
    url: SITE_URL,
    inLanguage: 'en',
    isAccessibleForFree: true,
    teaches: MODULES.map(m => m.title),
    provider: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      category: 'Free',
      availability: 'https://schema.org/InStock',
    },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      ...(workload ? { courseWorkload: workload } : {}),
    },
  };
}

/** Home > Module > Lesson for a single lesson page. */
export function lessonBreadcrumbJsonLd(mi, li) {
  const mod = MODULES[mi];
  const lesson = mod?.lessons?.[li];
  if (!mod || !lesson) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: SITE_NAME, item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: mod.title, item: absolute(moduleHref(mi)) },
      // Last crumb carries no `item`: it is the current page, and schema.org
      // wants the trail to end rather than link back to itself.
      { '@type': 'ListItem', position: 3, name: lesson.title },
    ],
  };
}

/** LearningResource for a single lesson page. */
export function lessonJsonLd(mi, li) {
  const mod = MODULES[mi];
  const lesson = mod?.lessons?.[li];
  if (!mod || !lesson) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: lesson.title,
    description: lesson.intro,
    url: absolute(lessonHref(mi, li)),
    inLanguage: 'en',
    isAccessibleForFree: lesson.isPublic === true,
    learningResourceType: 'Lesson',
    timeRequired: (() => {
      const n = parseInt(String(lesson.dur ?? '').match(/\d+/)?.[0] ?? '0', 10);
      return n ? `PT${n}M` : undefined;
    })(),
    isPartOf: {
      '@type': 'Course',
      name: 'Prompt Engineering',
      url: SITE_URL,
    },
    provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
  };
}
