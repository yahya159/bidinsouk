import { Button, Container, Title, Text, Group, Stack } from '@mantine/core';
import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <Container size="sm" style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
      <Stack align="center" gap="lg">
        <Title order={1} size="h2">
          Access Denied
        </Title>
        <Text size="lg" c="dimmed" ta="center">
          You don&apos;t have permission to access this page. This area is
          restricted to administrators only.
        </Text>
        <Group>
          <Button component={Link} href="/" variant="filled">
            Go to Home
          </Button>
          <Button component={Link} href="/login" variant="outline">
            Login with Different Account
          </Button>
        </Group>
      </Stack>
    </Container>
  );
}
