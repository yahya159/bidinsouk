import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { AnalyticsContent } from '@/components/workspace/analytics/AnalyticsContent';

export default async function WorkspaceAnalyticsPage() {
  const session = await getServerSession(authConfig);
  
  if (!session?.user) {
    redirect('/login?callbackUrl=/workspace/analytics');
  }

  const user = session.user;

  // Check if user has permission to access analytics
  if (user.role !== 'VENDOR' && user.role !== 'ADMIN') {
    redirect('/workspace/dashboard');
  }

  return <AnalyticsContent user={user as any} />;
}