import { redirect } from 'next/navigation';

export default async function VendorDashboardRedirect() {
  // Redirect to the new workspace dashboard
  redirect('/workspace/dashboard');
}