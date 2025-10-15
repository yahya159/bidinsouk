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
    
    if (!session?.user) {
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
    const { logger } = await import('@/lib/logger');
    logger.error('Workspace layout error', error);
    redirect('/login');
  }
}
