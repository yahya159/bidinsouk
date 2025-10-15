import { SimpleGrid, Card, Skeleton, Stack, Grid } from '@mantine/core';

export function DashboardSkeleton() {
  return (
    <Stack gap="xl">
      {/* Header */}
      <div>
        <Skeleton height={32} width={200} mb="xs" />
        <Skeleton height={20} width={300} />
      </div>

      {/* KPI Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="md">
              <Skeleton height={40} width={40} circle />
              <Skeleton height={32} width="60%" />
              <Skeleton height={14} width="80%" />
              <Skeleton height={14} width="50%" />
            </Stack>
          </Card>
        ))}
      </SimpleGrid>

      {/* Charts */}
      <Grid>
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Skeleton height={24} width={200} mb="md" />
            <Skeleton height={300} />
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Skeleton height={24} width={150} mb="md" />
            <Skeleton height={300} />
          </Card>
        </Grid.Col>
      </Grid>

      {/* Activity */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Skeleton height={24} width={150} mb="md" />
        <Stack gap="md">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Skeleton height={40} width={40} circle />
              <div style={{ flex: 1 }}>
                <Skeleton height={16} mb={4} />
                <Skeleton height={12} width="60%" />
              </div>
              <Skeleton height={12} width={60} />
            </div>
          ))}
        </Stack>
      </Card>
    </Stack>
  );
}

