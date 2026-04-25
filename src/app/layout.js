import './globals.css';
import { AuthProvider } from '@/providers/AuthProvider';

export const metadata = {
  title: 'Prompt Engineering — Zero to Mastery',
  description: 'A technically rigorous, career-grade prompt engineering course. 8 modules, 26 lessons, quizzes, and a verified certificate.',
  keywords: ['prompt engineering', 'LLM', 'AI', 'ChatGPT', 'Claude', 'machine learning'],
  openGraph: {
    title: 'Prompt Engineering — Zero to Mastery',
    description: 'Master the art of prompting. 8 modules · 26 lessons · Certificate included.',
    type: 'website',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
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
