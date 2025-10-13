import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/config';
import { ReportsContent } from '@/components/workspace/reports/ReportsContent';
import { DashboardLayout } from '@/components/workspace/DashboardLayout';

export default async function WorkspaceReportsPage() {
  try {
    const session = await getServerSession(authConfig);
    
    // Development mode bypass
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (!session?.user && !isDevelopment) {
      redirect('/login');
    }

    // Only allow VENDOR and ADMIN roles
    if (!isDevelopment && session?.user?.role !== 'VENDOR' && session?.user?.role !== 'ADMIN') {
      redirect('/vendors/apply?reason=workspace&message=Vous devez devenir vendeur pour accéder à cet espace.');
    }

    // Use mock user in development
    const user = session?.user || {
      id: 'dev-user',
      name: 'Development User',
      email: 'dev@bidinsouk.com',
      role: 'VENDOR' as const,
    };

    return (
      <DashboardLayout user={user as any}>
        <ReportsContent user={user as any} />
      </DashboardLayout>
    );
  } catch (error) {
    console.error('Reports page error:', error);
    
    if (process.env.NODE_ENV === 'development') {
      return (
        <div style={{ padding: '2rem', color: 'red' }}>
          <h1>Reports Page Error</h1>
          <pre>{error?.toString()}</pre>
        </div>
      );
    }
    
    redirect('/login');
  }
}