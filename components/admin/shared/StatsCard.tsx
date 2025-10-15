'use client';

import { Card, Group, Text, ThemeIcon, Stack, Badge } from '@mantine/core';
import { IconArrowUpRight, IconArrowDownRight, IconMinus } from '@tabler/icons-react';

export interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  color?: string;
  description?: string;
}

export function StatsCard({
  title,
  value,
  icon,
  trend,
  color = 'blue',
  description,
}: StatsCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return <IconArrowUpRight size={14} />;
    if (trend.value < 0) return <IconArrowDownRight size={14} />;
    return <IconMinus size={14} />;
  };

  const getTrendColor = () => {
    if (!trend) return 'gray';
    if (trend.value > 0) return 'green';
    if (trend.value < 0) return 'red';
    return 'gray';
  };

  return (
    <Card withBorder padding="lg" radius="md">
      <Group justify="space-between" mb="xs">
        <Text size="sm" c="dimmed" fw={500}>
          {title}
        </Text>
        <ThemeIcon color={color} variant="light" size="lg" radius="md">
          {icon}
        </ThemeIcon>
      </Group>

      <Stack gap="xs">
        <Text size="xl" fw={700}>
          {value}
        </Text>

        {trend && (
          <Group gap="xs">
            <Badge
              color={getTrendColor()}
              variant="light"
              leftSection={getTrendIcon()}
              size="sm"
            >
              {Math.abs(trend.value)}%
            </Badge>
            <Text size="xs" c="dimmed">
              {trend.label}
            </Text>
          </Group>
        )}

        {description && (
          <Text size="xs" c="dimmed">
            {description}
          </Text>
        )}
      </Stack>
    </Card>
  );
}
