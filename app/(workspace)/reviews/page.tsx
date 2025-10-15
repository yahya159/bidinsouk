import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { ReviewsContent } from '@/components/workspace/reviews/ReviewsContent';

export const dynamic = 'force-dynamic';

export default async function WorkspaceReviewsPage() {
  const session = await getServerSession(authConfig);
  
  if (!session?.user) {
    redirect('/login?callbackUrl=/workspace/reviews');
  }

  const user = session.user;

  // Check if user has permission to access reviews
  if (user.role !== 'VENDOR' && user.role !== 'ADMIN') {
    redirect('/workspace/dashboard');
  }

  return <ReviewsContent user={user as any} />;
}
