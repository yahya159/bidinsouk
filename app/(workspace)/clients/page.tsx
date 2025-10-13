import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/config';
import { ClientsContent } from '@/components/workspace/clients/ClientsContent';

export default async function WorkspaceClientsPage() {
  const session = await getServerSession(authConfig);
  
  if (!session?.user) {
    return null;
  }

  return <ClientsContent user={session.user as any} />;
}