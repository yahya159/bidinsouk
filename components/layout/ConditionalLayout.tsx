'use client';

import { usePathname } from 'next/navigation';
import { SiteHeader } from './SiteHeader';
import Footer from '../shared/Footer';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  
  // Don't show SiteHeader for workspace pages as they have their own header
  const isWorkspacePage = pathname.startsWith('/workspace');
  
  if (isWorkspacePage) {
    // Workspace pages handle their own layout but we add footer
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <div style={{ flex: 1 }}>
          {children}
        </div>
        <Footer />
      </div>
    );
  }
  
  // Regular pages get the standard layout with SiteHeader and Footer
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <SiteHeader />
      <main style={{ flex: 1 }}>
        {children}
      </main>
      <Footer />
    </div>
  );
}