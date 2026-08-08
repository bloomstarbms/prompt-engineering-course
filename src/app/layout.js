import './globals.css';
import { AuthProvider } from '@/providers/AuthProvider';
import { SITE_URL, SITE_NAME } from '@/lib/seo';

export const metadata = {
  // SITE_URL, not an inline env-or-localhost expression. If the env var were
  // ever missing in production every canonical and og:image would resolve
  // against localhost — invisible in the app, visible only to crawlers.
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Prompt Engineering — Zero to Mastery',
    template: `%s · ${SITE_NAME}`,
  },
  description: 'A technically rigorous, career-grade prompt engineering course. 8 modules, 26 lessons, quizzes, and a certificate of completion.',
  keywords: ['prompt engineering', 'LLM', 'AI', 'ChatGPT', 'Claude', 'machine learning'],
  openGraph: {
    title: 'Prompt Engineering — Zero to Mastery',
    description: 'Master the art of prompting. 8 modules · 26 lessons · Certificate included.',
    type: 'website',
    siteName: SITE_NAME,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prompt Engineering — Zero to Mastery',
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
