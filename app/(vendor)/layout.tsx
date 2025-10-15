import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/config';

export default async function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authConfig);
  
  if (!session?.user) {
    redirect('/login');
  }

  // Allow both VENDOR and ADMIN roles to access vendor pages
  if (session.user.role !== 'VENDOR' && session.user.role !== 'ADMIN') {
    redirect('/vendors/apply?reason=dashboard');
  }

  return <>{children}</>;
}
