import { Suspense } from 'react';
import { AnalyticsPageClient } from './AnalyticsPageClient';
import { Loader, Center } from '@mantine/core';

export const metadata = {
  title: 'Analytics | Admin Dashboard',
  description: 'View platform analytics and reports',
};

export default function AnalyticsPage() {
  return (
    <Suspense
      fallback={
        <Center h={400}>
          <Loader size="lg" />
        </Center>
      }
    >
      <AnalyticsPageClient />
    </Suspense>
  );
}
