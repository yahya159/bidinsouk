import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/config';
import { DashboardContent } from '@/components/workspace/dashboard/DashboardContent';

export default async function WorkspaceDashboardPage() {
  const session = await getServerSession(authConfig);
  
  if (!session?.user) {
    return null;
  }

  return <DashboardContent user={session.user as any} />;
}