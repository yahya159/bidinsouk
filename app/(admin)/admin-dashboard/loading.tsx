import { Container, Stack, Title } from '@mantine/core';
import { DashboardStatsSkeleton, ActivityLogSkeleton } from '@/components/admin/shared/LoadingSkeletons';

export default function DashboardLoading() {
  return (
    <Container size="xl">
      <Stack gap="xl">
        <Title order={1}>Dashboard</Title>
        <DashboardStatsSkeleton />
        <ActivityLogSkeleton />
      </Stack>
    </Container>
  );
}
