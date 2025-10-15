import { Container, Stack, Title, Grid } from '@mantine/core';
import { ChartSkeleton } from '@/components/admin/shared/LoadingSkeletons';

export default function AnalyticsLoading() {
  return (
    <Container size="xl">
      <Stack gap="xl">
        <Title order={1}>Analytics</Title>
        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <ChartSkeleton />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <ChartSkeleton />
          </Grid.Col>
          <Grid.Col span={12}>
            <ChartSkeleton />
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
}
