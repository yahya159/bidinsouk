import { Card, Skeleton, Stack, Group } from '@mantine/core';

export function ProductCardSkeleton() {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder style={{ height: '100%' }}>
      {/* Image placeholder */}
      <Card.Section>
        <Skeleton height={200} />
      </Card.Section>

      {/* Content */}
      <Stack gap="sm" mt="md">
        {/* Title */}
        <Skeleton height={20} />
        <Skeleton height={20} width="80%" />
        
        {/* Category */}
        <Skeleton height={14} width="40%" />
        
        {/* Rating */}
        <Group gap="xs">
          <Skeleton height={12} width={80} />
          <Skeleton height={12} width={30} />
        </Group>

        {/* Price */}
        <Group gap="xs" align="baseline">
          <Skeleton height={24} width={100} />
          <Skeleton height={16} width={60} />
        </Group>

        {/* Stock badge */}
        <Skeleton height={24} />

        {/* Action buttons */}
        <Group gap="xs">
          <Skeleton height={36} style={{ flex: 1 }} />
          <Skeleton height={36} width={36} />
        </Group>
      </Stack>
    </Card>
  );
}

