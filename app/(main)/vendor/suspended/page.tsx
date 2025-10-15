'use client';

import { useEffect, useState } from 'react';
import { Container, Title, Text, Paper, Stack, Alert } from '@mantine/core';
import { IconBan } from '@tabler/icons-react';

export default function VendorSuspendedPage() {
  const [vendorData, setVendorData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/vendor/status');
        const data = await res.json();
        setVendorData(data.vendor);
      } catch (error) {
        console.error('Failed to fetch vendor status:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchStatus();
  }, []);
  
  if (loading) {
    return <Container size="md" py="xl"><Text>Loading...</Text></Container>;
  }
  
  return (
    <Container size="md" py="xl">
      <Paper p="xl" withBorder>
        <Stack gap="md" align="center">
          <IconBan size={64} color="red" />
          
          <Title order={1}>Account Suspended</Title>
          
          <Text size="lg" c="dimmed" ta="center">
            Your vendor account has been suspended.
          </Text>
          
          {vendorData?.suspensionReason && (
            <Alert color="red" title="Suspension Reason" mt="xl" w="100%">
              <Text size="sm">{vendorData.suspensionReason}</Text>
            </Alert>
          )}
          
          <Alert color="orange" title="Impact of Suspension" mt="md" w="100%">
            <Stack gap="sm">
              <Text size="sm">
                • All your products are hidden from buyers
              </Text>
              <Text size="sm">
                • You cannot list new products
              </Text>
              <Text size="sm">
                • Active auctions have been cancelled
              </Text>
              <Text size="sm">
                • You can still view and fulfill existing orders
              </Text>
            </Stack>
          </Alert>
          
          <Alert color="blue" title="Appeal Process" mt="md" w="100%">
            <Stack gap="sm">
              <Text size="sm">
                If you believe this suspension is an error, you can appeal by:
              </Text>
              <Text size="sm">
                1. Reviewing our vendor policies
              </Text>
              <Text size="sm">
                2. Contacting support with your appeal
              </Text>
              <Text size="sm">
                3. Providing supporting documentation
              </Text>
            </Stack>
          </Alert>
          
          <Text size="sm" c="dimmed" mt="md">
            Contact: support@marketplace.com
          </Text>
        </Stack>
      </Paper>
    </Container>
  );
}
