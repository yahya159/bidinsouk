import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/config';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authConfig);
  
  if (!session?.user) {
    redirect('/login');
  }

  // Only allow ADMIN role to access admin pages
  if (session.user.role !== 'ADMIN') {
    // Redirect vendors to their dashboard, clients to vendor application
    if (session.user.role === 'VENDOR') {
      redirect('/vendor-dashboard');
    } else {
      redirect('/vendors/apply?reason=admin');
    }
  }

  return <>{children}</>;
}