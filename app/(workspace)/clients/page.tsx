import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/config';
import { ClientsContent } from '@/components/workspace/clients/ClientsContent';

export const dynamic = 'force-dynamic';

export default async function WorkspaceClientsPage() {
  const session = await getServerSession(authConfig);
  
  if (!session?.user) {
    return null;
  }

  return <ClientsContent user={session.user as any} />;
}
