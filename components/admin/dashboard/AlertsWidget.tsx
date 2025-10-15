'use client';

import { Card, Text, Alert, Stack, Badge, Group, Loader, Center, Button } from '@mantine/core';
import { 
  IconAlertCircle, 
  IconInfoCircle, 
  IconAlertTriangle,
  IconExternalLink
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AlertItem {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  actionUrl?: string;
  count?: number;
}

export function AlertsWidget() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      
      // Fetch various counts that might need attention
      const [storesResponse, ordersResponse] = await Promise.all([
        fetch('/api/admin/stores/pending'),
        fetch('/api/admin/orders?fulfillStatus=PENDING&page=1&pageSize=1'),
      ]);

      const alertsList: AlertItem[] = [];

      // Check pending stores
      if (storesResponse.ok) {
        const storesData = await storesResponse.json();
        if (storesData.stores && storesData.stores.length > 0) {
          alertsList.push({
            id: 'pending-stores',
            type: 'warning',
            title: 'Pending Store Approvals',
            message: `${storesData.stores.length} store(s) awaiting approval`,
            actionUrl: '/admin-dashboard/stores',
            count: storesData.stores.length,
          });
        }
      }

      // Check pending orders
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        if (ordersData.total > 0) {
          alertsList.push({
            id: 'pending-orders',
            type: 'info',
            title: 'Pending Orders',
            message: `${ordersData.total} order(s) pending fulfillment`,
            actionUrl: '/admin-dashboard/orders',
            count: ordersData.total,
          });
        }
      }

      // Add system info alert if no critical alerts
      if (alertsList.length === 0) {
        alertsList.push({
          id: 'system-ok',
          type: 'info',
          title: 'System Status',
          message: 'All systems operational. No pending actions required.',
        });
      }

      setAlerts(alertsList);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      setAlerts([
        {
          id: 'error',
          type: 'error',
          title: 'Error Loading Alerts',
          message: 'Unable to fetch system alerts. Please refresh the page.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <IconAlertCircle size={16} />;
      case 'warning':
        return <IconAlertTriangle size={16} />;
      default:
        return <IconInfoCircle size={16} />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'red';
      case 'warning':
        return 'yellow';
      default:
        return 'blue';
    }
  };

  return (
    <Card withBorder padding="lg" radius="md" h="100%">
      <Stack gap="md">
        <Group justify="space-between">
          <Text size="lg" fw={600}>
            Alerts & Notifications
          </Text>
          {alerts.length > 1 && (
            <Badge variant="filled" color="red" size="sm">
              {alerts.filter(a => a.type !== 'info').length}
            </Badge>
          )}
        </Group>

        {loading ? (
          <Center py="xl">
            <Loader size="sm" />
          </Center>
        ) : (
          <Stack gap="sm">
            {alerts.map((alert) => (
              <Alert
                key={alert.id}
                icon={getAlertIcon(alert.type)}
                title={
                  <Group gap="xs">
                    {alert.title}
                    {alert.count && alert.count > 0 && (
                      <Badge size="xs" variant="filled" color={getAlertColor(alert.type)}>
                        {alert.count}
                      </Badge>
                    )}
                  </Group>
                }
                color={getAlertColor(alert.type)}
                variant="light"
              >
                <Group justify="space-between" align="flex-start">
                  <Text size="sm">{alert.message}</Text>
                  {alert.actionUrl && (
                    <Button
                      size="xs"
                      variant="subtle"
                      color={getAlertColor(alert.type)}
                      rightSection={<IconExternalLink size={14} />}
                      onClick={() => router.push(alert.actionUrl!)}
                    >
                      View
                    </Button>
                  )}
                </Group>
              </Alert>
            ))}
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
