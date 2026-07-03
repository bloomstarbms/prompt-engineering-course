import './globals.css';
import { AuthProvider } from '@/providers/AuthProvider';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'Prompt Engineering — Zero to Mastery',
    template: '%s · PromptMastery',
  },
  description: 'A technically rigorous, career-grade prompt engineering course. 8 modules, 26 lessons, quizzes, and a verified certificate.',
  keywords: ['prompt engineering', 'LLM', 'AI', 'ChatGPT', 'Claude', 'machine learning'],
  openGraph: {
    title: 'Prompt Engineering — Zero to Mastery',
    description: 'Master the art of prompting. 8 modules · 26 lessons · Certificate included.',
    type: 'website',
    siteName: 'PromptMastery',
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
