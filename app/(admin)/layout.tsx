import { redirect } from 'next/navigation';
import { requireAdminAuth } from '@/lib/middleware/admin-auth';
import { AdminLayoutShell } from '@/components/admin/layout/AdminLayoutShell';
import { AdminErrorBoundary } from '@/components/admin/security/AdminErrorBoundary';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { redirect: redirectUrl, session } = await requireAdminAuth();

  if (redirectUrl) {
    redirect(redirectUrl);
  }

  return (
    <AdminErrorBoundary>
      <AdminLayoutShell user={session?.user!}>
        {children}
      </AdminLayoutShell>
    </AdminErrorBoundary>
  );
}
