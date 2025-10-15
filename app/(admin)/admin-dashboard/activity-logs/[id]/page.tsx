'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Container,
  Title,
  Group,
  Button,
  Loader,
  Alert,
  Text,
  Breadcrumbs,
  Anchor,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconAlertCircle,
  IconUser,
  IconExternalLink,
} from '@tabler/icons-react';
import { LogDetailCard } from '@/components/admin/activity-logs/LogDetailCard';
import { notifications } from '@mantine/notifications';
import Link from 'next/link';

interface ActivityLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: any;
  diff: any;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  actorRole: string;
}

export default function ActivityLogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const logId = params.id as string;

  const [log, setLog] = useState<ActivityLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch log details
  useEffect(() => {
    const fetchLog = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/admin/activity-logs/${logId}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Activity log not found');
          }
          throw new Error('Failed to fetch activity log');
        }

        const data = await response.json();
        setLog(data);
      } catch (err) {
        console.error('Error fetching log:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        notifications.show({
          title: 'Error',
          message: 'Failed to fetch activity log details',
          color: 'red',
        });
      } finally {
        setLoading(false);
      }
    };

    if (logId) {
      fetchLog();
    }
  }, [logId]);

  // Get entity link
  const getEntityLink = (entity: string, entityId: string): string | null => {
    const entityLower = entity.toLowerCase();

    if (entityLower === 'user') {
      return `/admin-dashboard/users/${entityId}`;
    }
    if (entityLower === 'product') {
      return `/admin-dashboard/products/${entityId}`;
    }
    if (entityLower === 'auction') {
      return `/admin-dashboard/auctions/${entityId}`;
    }
    if (entityLower === 'order') {
      return `/admin-dashboard/orders/${entityId}`;
    }
    if (entityLower === 'store') {
      return `/admin-dashboard/stores/${entityId}`;
    }

    return null;
  };

  // Breadcrumbs
  const breadcrumbItems = [
    { title: 'Dashboard', href: '/admin-dashboard' },
    { title: 'Activity Logs', href: '/admin-dashboard/activity-logs' },
    { title: `Log #${logId}`, href: '#' },
  ].map((item, index) => (
    <Anchor
      component={Link}
      href={item.href}
      key={index}
      size="sm"
      c={index === 2 ? 'dimmed' : undefined}
    >
      {item.title}
    </Anchor>
  ));

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Group justify="center" py="xl">
          <Loader size="lg" />
        </Group>
      </Container>
    );
  }

  if (error || !log) {
    return (
      <Container size="xl" py="xl">
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Error"
          color="red"
          mb="md"
        >
          {error || 'Activity log not found'}
        </Alert>
        <Button
          leftSection={<IconArrowLeft size={16} />}
          variant="light"
          onClick={() => router.push('/admin-dashboard/activity-logs')}
        >
          Back to Activity Logs
        </Button>
      </Container>
    );
  }

  const entityLink = getEntityLink(log.entity, log.entityId);

  return (
    <Container size="xl" py="xl">
      {/* Breadcrumbs */}
      <Breadcrumbs mb="md">{breadcrumbItems}</Breadcrumbs>

      {/* Header */}
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2}>Activity Log Details</Title>
          <Text size="sm" c="dimmed" mt={4}>
            View complete information about this activity log entry
          </Text>
        </div>

        <Group>
          {/* View Actor Profile */}
          <Button
            component={Link}
            href={`/admin-dashboard/users/${log.actorId}`}
            leftSection={<IconUser size={16} />}
            variant="light"
          >
            View Actor Profile
          </Button>

          {/* View Related Entity */}
          {entityLink && (
            <Button
              component={Link}
              href={entityLink}
              leftSection={<IconExternalLink size={16} />}
              variant="light"
            >
              View {log.entity}
            </Button>
          )}

          {/* Back Button */}
          <Button
            leftSection={<IconArrowLeft size={16} />}
            variant="default"
            onClick={() => router.push('/admin-dashboard/activity-logs')}
          >
            Back to Logs
          </Button>
        </Group>
      </Group>

      {/* Log Detail Card */}
      <LogDetailCard log={log} />
    </Container>
  );
}
