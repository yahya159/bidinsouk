import { Container, Stack, Title } from '@mantine/core';
import { DataTableSkeleton } from '@/components/admin/shared/LoadingSkeletons';

export default function UsersLoading() {
  return (
    <Container size="xl">
      <Stack gap="xl">
        <Title order={1}>Users</Title>
        <DataTableSkeleton />
      </Stack>
    </Container>
  );
}
