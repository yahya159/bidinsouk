'use client';

import { Container, Title, Text, Paper, Stack, Alert } from '@mantine/core';
import { IconClock } from '@tabler/icons-react';

export default function VendorPendingPage() {
  return (
    <Container size="md" py="xl">
      <Paper p="xl" withBorder>
        <Stack gap="md" align="center">
          <IconClock size={64} color="orange" />
          
          <Title order={1}>Application Under Review</Title>
          
          <Text size="lg" c="dimmed" ta="center">
            Your vendor application is currently being reviewed by our team.
          </Text>
          
          <Alert color="blue" title="What happens next?" mt="xl" w="100%">
            <Stack gap="sm">
              <Text size="sm">
                • Our team will review your application within 2-3 business days
              </Text>
              <Text size="sm">
                • You'll receive an email notification once a decision is made
              </Text>
              <Text size="sm">
                • If approved, you'll be able to create your store and list products
              </Text>
              <Text size="sm">
                • If additional information is needed, we'll contact you
              </Text>
            </Stack>
          </Alert>
          
          <Text size="sm" c="dimmed" mt="md">
            Thank you for your patience!
          </Text>
        </Stack>
      </Paper>
    </Container>
  );
}
