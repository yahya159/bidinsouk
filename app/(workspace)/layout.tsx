import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/config';
import { WorkspaceLayout } from '@/components/workspace/WorkspaceLayout';

export default async function WorkspaceLayoutPage({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const session = await getServerSession(authConfig);
    
    // Temporary bypass for development - remove this in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (!session?.user) {
      if (isDevelopment) {
        // Create a mock user for development
        const mockUser: { id: string; name: string; email: string; role: 'VENDOR' | 'ADMIN' } = {
          id: 'dev-user',
          name: 'Development User',
          email: 'dev@bidinsouk.com',
          role: 'ADMIN', // Changé de 'VENDOR' à 'ADMIN' pour permettre l'accès admin
        };
        
        return (
          <WorkspaceLayout user={mockUser as any}>
            {children}
          </WorkspaceLayout>
        );
      }
      redirect('/login');
    }

    // Only allow VENDOR and ADMIN roles
    if (session.user.role !== 'VENDOR' && session.user.role !== 'ADMIN') {
      redirect('/vendors/apply?reason=workspace&message=Vous devez devenir vendeur pour accéder à cet espace.');
    }

    return (
      <WorkspaceLayout user={session.user as any}>
        {children}
      </WorkspaceLayout>
    );
  } catch (error) {
    console.error('Workspace layout error:', error);
    
    // In development, show the error instead of redirecting
    if (process.env.NODE_ENV === 'development') {
      return (
        <div style={{ padding: '2rem', color: 'red' }}>
          <h1>Workspace Layout Error</h1>
          <pre>{error?.toString()}</pre>
        </div>
      );
    }
    
    redirect('/login');
  }
}