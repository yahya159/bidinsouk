import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { SettingsContent } from '@/components/workspace/settings/SettingsContent';

export default async function SettingsPage() {
  const session = await getServerSession(authConfig);
  
  if (!session?.user) {
    redirect('/login?callbackUrl=/settings');
  }

  // For vendors and admins, show the store administration settings
  // For regular clients, they can also access basic account settings
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <SettingsContent user={session.user as any} section="store" />
    </div>
  );
}
