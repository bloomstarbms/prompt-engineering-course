/**
 * Dynamic route that handles all SPA "pages":
 *   /course  /profile  /cert  /auth  /quiz
 *
 * Each renders the same CourseApp shell, which reads usePathname() to
 * decide what to display. Specific routes (api/*, verify/*, admin,
 * reset-password) are still handled by their own Next.js route files and
 * take precedence over this dynamic segment.
 */
import CourseApp from '@/components/CourseApp';

// These are the only valid slugs this route serves.
// Any other single-segment path not matched by a specific route will still
// hit here — CourseApp falls through to the landing view for unknowns.
export function generateStaticParams() {
  return [
    { page: 'course'  },
    { page: 'profile' },
    { page: 'cert'    },
    { page: 'auth'    },
    { page: 'quiz'    },
  ];
}

export default function Page() {
  return <CourseApp />;
}
