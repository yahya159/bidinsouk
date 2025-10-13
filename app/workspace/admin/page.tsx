import { redirect } from 'next/navigation';

export default function WorkspaceAdminRedirect() {
  // Redirect to the main admin dashboard
  redirect('/admin-dashboard');
}