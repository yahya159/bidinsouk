import { redirect } from 'next/navigation';

export default function WorkspaceAdminStoresRedirect() {
  // Redirect to the correct admin stores page
  redirect('/admin-dashboard/stores');
}