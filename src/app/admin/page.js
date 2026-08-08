import AdminDashboard from '@/components/admin/AdminDashboard';

export const metadata = {
  title: 'Admin · PE Course',
  // Never indexable: this is an internal login form, not a public page.
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminDashboard />;
}
