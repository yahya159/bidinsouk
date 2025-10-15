import { redirect } from 'next/navigation';

export default function WorkspaceRootPage() {
  // Redirect to dashboard when accessing /workspace
  redirect('/workspace/dashboard');
}
