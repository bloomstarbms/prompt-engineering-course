import './globals.css';
import { AuthProvider } from '@/providers/AuthProvider';
import { SITE_URL, SITE_NAME } from '@/lib/seo';

/**
 * The default page title, and the og/twitter titles that mirror it.
 *
 * ONE CONSTANT FOR ALL THREE, because it was previously the same literal typed
 * out three times and that is how two of them got missed. Changing the <title>
 * while og:title still read the old string would have left the old name on
 * every social preview and every link unfurl — the exact surface the change was
 * made for.
 *
 * WAS 'Prompt Engineering — Zero to Mastery'. Dropped because "Zero to
 * Mastery" is an established brand (zerotomastery.io) and this site has no
 * relationship to it. The site name is Prompten — see SITE_NAME — and
 * title.template below still appends it, so nothing about identity changes.
 */
const DEFAULT_TITLE = 'Prompt Engineering — Master the Art of Prompting AI';

export const metadata = {
  // SITE_URL, not an inline env-or-localhost expression. If the env var were
  // ever missing in production every canonical and og:image would resolve
  // against localhost — invisible in the app, visible only to crawlers.
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: 'A technically rigorous, career-grade prompt engineering course. 8 modules, 26 lessons, quizzes, and a certificate of completion.',
  keywords: ['prompt engineering', 'LLM', 'AI', 'ChatGPT', 'Claude', 'machine learning'],
  openGraph: {
    title: DEFAULT_TITLE,
    description: 'Master the art of prompting. 8 modules · 26 lessons · Certificate included.',
    type: 'website',
    siteName: SITE_NAME,
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: 'Master the art of prompting. 8 modules · 26 lessons · Certificate included.',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#09090b', // matches the dark UI — was #ffffff which flashed white chrome on mobile
  colorScheme: 'dark',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* AuthProvider lives at root so auth state is loaded once and
            shared across all routes — no re-auth, no splash on navigation */}
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
