import './globals.css';
import { Inter, Space_Grotesk, Instrument_Serif, JetBrains_Mono, Playfair_Display } from 'next/font/google';

/**
 * SELF-HOSTED FONTS. All five families used to be pulled from Google Fonts at
 * runtime: four by an @import in globals.css on every page, Playfair by the
 * certificate face. The privacy policy says no third-party trackers; every
 * visitor was still making requests to fonts.googleapis.com and
 * fonts.gstatic.com. next/font downloads the files once, at build time, and
 * serves them from /_next/static/media on our own origin. Google is never
 * contacted by a visitor's browser.
 *
 * Each family is exposed as a CSS variable on <html>. globals.css maps them
 * onto --font / --display / --mono / --serif / --playfair, which theme.js and
 * the inline styles read. If a variable is not wired through, the fallbacks
 * are generic system faces, not the Google-hosted family, so a missing wire
 * is visible rather than silently fetched.
 *
 * Weights/styles mirror what the old @import requested. Inter, Space Grotesk,
 * JetBrains Mono and Playfair Display are variable fonts on Google Fonts, so
 * no weight list is needed; Instrument Serif is static, 400 only.
 */
const inter      = Inter({ subsets: ['latin'], style: ['normal', 'italic'], display: 'swap', variable: '--font-inter' });
const grotesk    = Space_Grotesk({ subsets: ['latin'], display: 'swap', variable: '--font-grotesk' });
const instrument = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], display: 'swap', variable: '--font-instrument' });
const jetbrains  = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-jetbrains' });
const playfair   = Playfair_Display({ subsets: ['latin'], style: ['normal', 'italic'], display: 'swap', variable: '--font-playfair' });
const FONT_VARS  = [inter, grotesk, instrument, jetbrains, playfair].map(f => f.variable).join(' ');
import { AuthProvider } from '@/providers/AuthProvider';
import ConsentNotice from '@/components/auth/ConsentNotice';
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
  description: 'Free prompt engineering course: from no AI background to production-level prompting. 8 modules, 26 lessons, quizzes and a certificate of completion.',
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
    <html lang="en" className={FONT_VARS}>
      <body>
        {/* AuthProvider lives at root so auth state is loaded once and
            shared across all routes — no re-auth, no splash on navigation */}
        <AuthProvider>
          {children}
          {/* Mounted here rather than inside CourseApp deliberately. CourseApp
              has five separate return sites (quiz, cert, profile, lesson,
              landing); threading a banner through all of them invites the one
              that gets missed. As a sibling of {children} it renders on every
              route under the root layout — including /privacy and /terms, so
              reading the documents does not make it vanish — and it renders
              nothing at all when signed out, because it needs a user.

              It is also structurally incapable of blocking a route: it is not
              in the render path of any page, so it cannot early-return in
              place of one. ConsentGate, by contrast, IS an early return
              inside CourseApp. That difference is the non-blocking guarantee,
              and it is architectural rather than a matter of CSS. */}
          <ConsentNotice />
        </AuthProvider>
      </body>
    </html>
  );
}
