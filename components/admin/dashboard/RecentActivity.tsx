'use client';

import { Card, Text, Timeline, Stack, Badge, Group, Loader, Center } from '@mantine/core';
import { 
  IconUser, 
  IconShoppingCart, 
  IconGavel, 
  IconBuildingStore,
  IconSettings,
  IconClock
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';

interface ActivityItem {
  id: string;
  action: string;
  entity: string;
  actorName: string;
  timestamp: Date;
  metadata?: any;
}

export function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  const fetchRecentActivity = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/activity-logs?page=1&pageSize=10');
      if (response.ok) {
        const data = await response.json();
        setActivities(data.logs || []);
      }
    } catch (error) {
      console.error('Failed to fetch recent activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (entity: string) => {
    switch (entity.toLowerCase()) {
      case 'user':
        return <IconUser size={16} />;
      case 'order':
        return <IconShoppingCart size={16} />;
      case 'auction':
        return <IconGavel size={16} />;
      case 'store':
        return <IconBuildingStore size={16} />;
      case 'settings':
        return <IconSettings size={16} />;
      default:
        return <IconClock size={16} />;
    }
  };

  const getActivityColor = (action: string) => {
    if (action.includes('CREATE')) return 'green';
    if (action.includes('UPDATE')) return 'blue';
    if (action.includes('DELETE')) return 'red';
    if (action.includes('APPROVE')) return 'teal';
    if (action.includes('REJECT')) return 'orange';
    return 'gray';
  };

  const formatAction = (action: string) => {
    return action
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatTimestamp = (timestamp: Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card withBorder padding="lg" radius="md" h="100%">
      <Stack gap="md">
        <Group justify="space-between">
          <Text size="lg" fw={600}>
            Recent Activity
          </Text>
          <Badge variant="light" color="blue">
            Live
          </Badge>
        </Group>

        {loading ? (
          <Center py="xl">
            <Loader size="sm" />
          </Center>
        ) : activities.length === 0 ? (
          <Center py="xl">
            <Text size="sm" c="dimmed">
              No recent activity
            </Text>
          </Center>
        ) : (
          <Timeline active={-1} bulletSize={24} lineWidth={2}>
            {activities.slice(0, 8).map((activity) => (
              <Timeline.Item
                key={activity.id}
                bullet={getActivityIcon(activity.entity)}
                title={
                  <Group gap="xs">
                    <Text size="sm" fw={500}>
                      {activity.actorName}
                    </Text>
                    <Badge size="xs" color={getActivityColor(activity.action)}>
                      {formatAction(activity.action)}
                    </Badge>
                  </Group>
                }
              >
                <Text size="xs" c="dimmed" mt={4}>
                  {activity.entity} • {formatTimestamp(activity.timestamp)}
                </Text>
              </Timeline.Item>
            ))}
          </Timeline>
        )}
      </Stack>
    </Card>
  );
}
