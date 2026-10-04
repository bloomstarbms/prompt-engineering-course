import CourseApp from '@/components/CourseApp';
import JsonLd from '@/components/seo/JsonLd';
import { courseJsonLd } from '@/lib/jsonld';
import { getApprovedReviews } from '@/lib/reviewsPublic';

/* Canonical is set here, not in the root layout: a layout-level canonical is
   inherited by every child route, so all 60-odd URLs would claim to be this
   page. Each indexable route declares its own. */
export const metadata = { alternates: { canonical: '/' } };

/**
 * STATIC, REGENERATED. The approved reviews are read at build/regeneration
 * time and baked into the HTML, so a visitor never waits on the database and
 * the database being down cannot take the home page down. Two things bring
 * the page up to date:
 *   · revalidatePath('/') from every moderation action, review edit and
 *     withdrawal that touches the approved set — the real mechanism;
 *   · this one-hour timer, as a backstop for a missed call.
 * After revalidation, the FIRST request can still be served the old page
 * while the new one is generated; the request after that gets the new page
 * (seen on production on 4 October 2026). So an approval or a takedown is
 * visible from the second load, not necessarily the first. ERASURE-PROCEDURE
 * step 5 and the admin reviews panel both say to load the home page twice.
 */
export const revalidate = 3600;

/**
 * The landing page.
 *
 * Server-rendered: the hero, module cards, sample certificate and any
 * approved reviews are in the HTML a crawler receives, and the Course
 * structured data is emitted alongside by JsonLd. CourseApp is a client
 * component, but client components render on the server too; only the
 * signed-in views depend on the browser.
 */
export default async function Page() {
  // Never throws; [] on any failure, and the section is absent for [].
  const reviews = await getApprovedReviews();
  return (
    <>
      <JsonLd data={courseJsonLd()} />
      <CourseApp reviews={reviews} />
    </>
  );
}
