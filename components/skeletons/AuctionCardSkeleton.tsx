import { Card, Skeleton, Stack, Group, Divider } from '@mantine/core';

export function AuctionCardSkeleton() {
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
        <Skeleton height={20} width="70%" />
        
        {/* Badges */}
        <Group gap="xs">
          <Skeleton height={20} width={60} />
          <Skeleton height={20} width={50} />
        </Group>
        
        <Divider />

        {/* Current bid */}
        <div>
          <Skeleton height={14} width={80} mb="xs" />
          <Skeleton height={28} width={120} />
        </div>

        {/* Stats */}
        <Group justify="space-between">
          <Skeleton height={16} width={80} />
          <Skeleton height={16} width={80} />
        </Group>

        <Divider />

        {/* Countdown */}
        <Skeleton height={24} />

        {/* Action button */}
        <Skeleton height={40} />
      </Stack>
    </Card>
  );
}

