import LegalPage from '@/components/legal/LegalPage';
import { PRIVACY_MD } from '@/content/legal';
import { isIndexable, absolute, SITE_NAME } from '@/lib/seo';

export const metadata = {
  title: 'Privacy Policy',
  description:
    'What Prompten collects, why, where it is stored, how long it is kept, and your rights under the Nigeria Data Protection Act.',
  alternates: { canonical: '/privacy' },
  // From the indexable set like every other route, so this page and the sitemap
  // cannot disagree. Public content: a privacy notice nobody can find is not a
  // privacy notice.
  robots: { index: isIndexable('/privacy'), follow: true },
  openGraph: {
    title: `Privacy Policy · ${SITE_NAME}`,
    description: 'What we collect, why, and your rights.',
    url: absolute('/privacy'),
    type: 'article',
    siteName: SITE_NAME,
  },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="[DATE]"
      markdown={PRIVACY_MD}
      otherHref="/terms"
      otherLabel="Terms of Use"
    />
  );
}
