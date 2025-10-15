'use client';

import { Skeleton, Stack, Group, Card, Grid, Table } from '@mantine/core';

export function StatsCardSkeleton() {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="sm">
        <Group justify="space-between">
          <Skeleton height={20} width={100} />
          <Skeleton height={24} width={24} circle />
        </Group>
        <Skeleton height={32} width={80} />
        <Skeleton height={16} width={120} />
      </Stack>
    </Card>
  );
}

export function DashboardStatsSkeleton() {
  return (
    <Grid>
      {[1, 2, 3, 4].map((i) => (
        <Grid.Col key={i} span={{ base: 12, sm: 6, md: 3 }}>
          <StatsCardSkeleton />
        </Grid.Col>
      ))}
    </Grid>
  );
}

export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          {Array.from({ length: columns }).map((_, i) => (
            <Table.Th key={i}>
              <Skeleton height={20} />
            </Table.Th>
          ))}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <Table.Tr key={rowIndex}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Table.Td key={colIndex}>
                <Skeleton height={16} />
              </Table.Td>
            ))}
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}

export function DataTableSkeleton() {
  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Skeleton height={36} width={300} />
        <Group gap="sm">
          <Skeleton height={36} width={100} />
          <Skeleton height={36} width={100} />
        </Group>
      </Group>
      <TableSkeleton rows={10} columns={6} />
      <Group justify="center">
        <Skeleton height={36} width={300} />
      </Group>
    </Stack>
  );
}

export function DetailCardSkeleton() {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Skeleton height={28} width="60%" />
        <Skeleton height={1} />
        <Stack gap="sm">
          {[1, 2, 3, 4, 5].map((i) => (
            <Group key={i} justify="space-between">
              <Skeleton height={16} width="30%" />
              <Skeleton height={16} width="50%" />
            </Group>
          ))}
        </Stack>
        <Group gap="sm" mt="md">
          <Skeleton height={36} width={100} />
          <Skeleton height={36} width={100} />
        </Group>
      </Stack>
    </Card>
  );
}

export function FormSkeleton() {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Skeleton height={28} width="40%" />
        {[1, 2, 3, 4].map((i) => (
          <Stack key={i} gap="xs">
            <Skeleton height={16} width={100} />
            <Skeleton height={36} />
          </Stack>
        ))}
        <Group gap="sm" mt="md">
          <Skeleton height={36} width={100} />
          <Skeleton height={36} width={100} />
        </Group>
      </Stack>
    </Card>
  );
}

export function ChartSkeleton() {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Skeleton height={24} width="40%" />
        <Skeleton height={300} />
      </Stack>
    </Card>
  );
}

export function ActivityLogSkeleton() {
  return (
    <Stack gap="sm">
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i} shadow="sm" padding="md" radius="md" withBorder>
          <Group justify="space-between">
            <Group gap="sm">
              <Skeleton height={40} width={40} circle />
              <Stack gap="xs">
                <Skeleton height={16} width={200} />
                <Skeleton height={14} width={150} />
              </Stack>
            </Group>
            <Skeleton height={14} width={100} />
          </Group>
        </Card>
      ))}
    </Stack>
  );
}
