import { Container, Stack, Title } from '@mantine/core';
import { DataTableSkeleton } from '@/components/admin/shared/LoadingSkeletons';

export default function ActivityLogsLoading() {
  return (
    <Container size="xl">
      <Stack gap="xl">
        <Title order={1}>Activity Logs</Title>
        <DataTableSkeleton />
      </Stack>
    </Container>
  );
}
