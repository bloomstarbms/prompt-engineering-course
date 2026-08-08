import CourseApp from '@/components/CourseApp';
import JsonLd from '@/components/seo/JsonLd';
import { courseJsonLd } from '@/lib/jsonld';

/* Canonical is set here, not in the root layout: a layout-level canonical is
   inherited by every child route, so all 60-odd URLs would claim to be this
   page. Each indexable route declares its own. */
export const metadata = { alternates: { canonical: '/' } };

/**
 * The landing page.
 *
 * JsonLd renders on the server, so the Course markup is in the HTML source
 * even though CourseApp itself is a client component whose content is not yet
 * server-rendered. Structured data and rendered content are separate problems;
 * this fixes the first one only. The second is the SSR step, and until it
 * lands this page still ships an empty shell to a crawler.
 */
export default function Page() {
  return (
    <>
      <JsonLd data={courseJsonLd()} />
      <CourseApp />
    </>
  );
}
