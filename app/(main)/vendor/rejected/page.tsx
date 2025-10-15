'use client';

import { useEffect, useState } from 'react';
import { Container, Title, Text, Paper, Stack, Alert, Button } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

export default function VendorRejectedPage() {
  const router = useRouter();
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
          <IconAlertCircle size={64} color="red" />
          
          <Title order={1}>Application Not Approved</Title>
          
          <Text size="lg" c="dimmed" ta="center">
            Unfortunately, your vendor application was not approved at this time.
          </Text>
          
          {vendorData?.rejectionReason && (
            <Alert color="red" title="Rejection Reason" mt="xl" w="100%">
              <Text size="sm">{vendorData.rejectionReason}</Text>
            </Alert>
          )}
          
          <Alert color="blue" title="What you can do" mt="md" w="100%">
            <Stack gap="sm">
              {vendorData?.canReapply ? (
                <>
                  <Text size="sm">
                    • You can submit a new application now
                  </Text>
                  <Text size="sm">
                    • Please address the issues mentioned in the rejection reason
                  </Text>
                  <Text size="sm">
                    • Ensure all required documents are complete and accurate
                  </Text>
                </>
              ) : (
                <>
                  <Text size="sm">
                    • You can reapply in {vendorData?.daysUntilReapply} days
                  </Text>
                  <Text size="sm">
                    • Use this time to address the issues mentioned above
                  </Text>
                  <Text size="sm">
                    • Prepare all required documentation
                  </Text>
                </>
              )}
            </Stack>
          </Alert>
          
          {vendorData?.canReapply && (
            <Button 
              size="lg" 
              mt="xl"
              onClick={() => router.push('/become-vendor')}
            >
              Submit New Application
            </Button>
          )}
          
          <Text size="sm" c="dimmed" mt="md">
            If you have questions, please contact support.
          </Text>
        </Stack>
      </Paper>
    </Container>
  );
}
