'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader, Container, Center } from '@mantine/core';

interface VendorGuardProps {
  children: React.ReactNode;
  requireStore?: boolean;
}

export function VendorGuard({ children, requireStore = false }: VendorGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function checkVendorStatus() {
      if (status === 'loading') return;
      
      if (!session) {
        router.push('/auth/signin');
        return;
      }
      
      const roles = session.user?.roles as string[] | undefined;
      if (!roles?.includes('VENDOR')) {
        router.push('/become-vendor');
        return;
      }
      
      // Fetch vendor status
      try {
        const res = await fetch('/api/vendors/status');
        const data = await res.json();
        
        if (!data.vendor) {
          router.push('/become-vendor');
          return;
        }
        
        setVendor(data.vendor);
        
        // Handle different statuses
        if (data.vendor.status === 'PENDING') {
          router.push('/vendor/pending');
          return;
        }
        
        if (data.vendor.status === 'REJECTED') {
          router.push('/vendor/rejected');
          return;
        }
        
        if (data.vendor.status === 'SUSPENDED') {
          router.push('/vendor/suspended');
          return;
        }
        
        if (requireStore && !data.vendor.store) {
          router.push('/vendor/create-store');
          return;
        }
        
        if (requireStore && data.vendor.store?.status !== 'ACTIVE') {
          router.push('/vendor/store-pending');
          return;
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to check vendor status:', error);
        router.push('/become-vendor');
      }
    }
    
    checkVendorStatus();
  }, [session, status, router, requireStore]);
  
  if (loading) {
    return (
      <Container>
        <Center style={{ minHeight: '400px' }}>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }
  
  return <>{children}</>;
}
