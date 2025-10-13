import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { AuctionsContent } from '@/components/workspace/auctions/AuctionsContent';
import { DashboardLayout } from '@/components/workspace/DashboardLayout';

export default async function WorkspaceAuctionsPage() {
  const session = await getServerSession(authConfig);
  
  if (!session?.user) {
    redirect('/login?callbackUrl=/workspace/my-auctions');
  }

  // Check if user has vendor or admin role
  if (session.user.role !== 'VENDOR' && session.user.role !== 'ADMIN') {
    redirect('/vendors/apply?reason=workspace&message=Vous devez devenir vendeur pour accéder à cet espace.');
  }

  return (
    <DashboardLayout user={session.user as any}>
      <AuctionsContent user={session.user as any} />
    </DashboardLayout>
  );
}