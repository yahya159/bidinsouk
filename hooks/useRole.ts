import { useSession } from 'next-auth/react';

export function useRole() {
  const { data: session } = useSession();
  
  const user = session?.user;
  const role = user?.role;
  
  const isClient = role === 'CLIENT';
  const isVendor = role === 'VENDOR';
  const isAdmin = role === 'ADMIN';
  const isVendorOrAdmin = isVendor || isAdmin;
  
  return {
    user,
    role,
    isClient,
    isVendor,
    isAdmin,
    isVendorOrAdmin,
    isAuthenticated: !!user,
  };
}