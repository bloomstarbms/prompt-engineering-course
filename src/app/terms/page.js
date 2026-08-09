import DocPage from '@/components/docs/DocPage';
import { TERMS_MD } from '@/content/legal';
import { isIndexable, absolute, SITE_NAME } from '@/lib/seo';

export const metadata = {
  title: 'Terms of Use',
  description:
    'The terms for using Prompten: your account, acceptable use, what the certificate is and is not, and the limits of what we promise.',
  alternates: { canonical: '/terms' },
  robots: { index: isIndexable('/terms'), follow: true },
  openGraph: {
    title: `Terms of Use · ${SITE_NAME}`,
    description: 'Your account, acceptable use, and what the certificate is and is not.',
    url: absolute('/terms'),
    type: 'article',
    siteName: SITE_NAME,
  },
};

export default function TermsPage() {
  return (
    <DocPage
      title="Terms of Use"
      updated="9 August 2026"
      markdown={TERMS_MD}
      links={[{ href: '/privacy', label: 'Privacy Policy' }, { href: '/about', label: 'About' }]}
    />
  );
}
