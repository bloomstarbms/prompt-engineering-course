import DocPage from '@/components/docs/DocPage';
import { ABOUT_MD } from '@/content/about';
import { isIndexable, absolute, SITE_NAME } from '@/lib/seo';

export const metadata = {
  title: 'About',
  description:
    'Prompten is written and maintained by Daniels Bloom — a free prompt engineering course built from the primary sources rather than other people’s summaries of them.',
  alternates: { canonical: '/about' },
  robots: { index: isIndexable('/about'), follow: true },
  openGraph: {
    title: `About · ${SITE_NAME}`,
    description: 'Who writes this course, and why it is free.',
    url: absolute('/about'),
    type: 'profile',
    siteName: SITE_NAME,
  },
};

export default function AboutPage() {
  return (
    <DocPage
      title="About"
      markdown={ABOUT_MD}
      links={[{ href: '/privacy', label: 'Privacy Policy' }, { href: '/terms', label: 'Terms of Use' }]}
    />
  );
}
