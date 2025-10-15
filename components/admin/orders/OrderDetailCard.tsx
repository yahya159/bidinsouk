'use client';

import {
  Card,
  Grid,
  Stack,
  Text,
  Badge,
  Group,
  Divider,
  Timeline,
  Avatar,
  Paper,
  Title,
} from '@mantine/core';
import {
  IconUser,
  IconBuilding,
  IconTruck,
  IconCreditCard,
  IconClock,
  IconCheck,
  IconX,
  IconPackage,
} from '@tabler/icons-react';

interface OrderDetail {
  id: string;
  number: string;
  total: number;
  status: string;
  fulfillStatus: string;
  shipping: any;
  timeline: any[];
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
  };
  store: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: any;
    seller: {
      id: string;
      name: string;
      email: string;
      phone?: string;
    };
  };
}

interface OrderDetailCardProps {
  order: OrderDetail;
}

export function OrderDetailCard({ order }: OrderDetailCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'green';
      case 'REFUSED':
        return 'red';
      case 'CANCELED_AFTER_CONFIRM':
        return 'gray';
      default:
        return 'blue';
    }
  };

  const getFulfillStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'yellow';
      case 'PREPARING':
        return 'blue';
      case 'READY_FOR_PICKUP':
        return 'cyan';
      case 'SHIPPED':
        return 'indigo';
      case 'DELIVERED':
        return 'green';
      case 'CANCELED':
        return 'red';
      default:
        return 'gray';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getTimelineIcon = (entry: any) => {
    if (entry.action === 'REFUND_PROCESSED') {
      return <IconX size={16} />;
    }
    
    switch (entry.status) {
      case 'DELIVERED':
        return <IconCheck size={16} />;
      case 'SHIPPED':
        return <IconTruck size={16} />;
      case 'CANCELED':
        return <IconX size={16} />;
      default:
        return <IconPackage size={16} />;
    }
  };

  const getTimelineColor = (entry: any) => {
    if (entry.action === 'REFUND_PROCESSED') {
      return 'red';
    }
    
    switch (entry.status) {
      case 'DELIVERED':
        return 'green';
      case 'SHIPPED':
        return 'indigo';
      case 'CANCELED':
        return 'red';
      default:
        return 'blue';
    }
  };

  return (
    <Stack gap="md">
      {/* Order Summary */}
      <Card withBorder>
        <Stack gap="md">
          <Group justify="space-between">
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                Order Number
              </Text>
              <Title order={3}>{order.number}</Title>
            </div>
            <Group>
              <Badge color={getStatusColor(order.status)} size="lg" variant="light">
                {order.status.replace(/_/g, ' ')}
              </Badge>
              <Badge color={getFulfillStatusColor(order.fulfillStatus)} size="lg" variant="light">
                {order.fulfillStatus.replace(/_/g, ' ')}
              </Badge>
            </Group>
          </Group>

          <Divider />

          <Grid>
            <Grid.Col span={6}>
              <Text size="sm" c="dimmed">Order Date</Text>
              <Text fw={500}>{formatDate(order.createdAt)}</Text>
            </Grid.Col>
            <Grid.Col span={6}>
              <Text size="sm" c="dimmed">Total Amount</Text>
              <Text fw={700} size="xl" c="blue">
                {formatCurrency(order.total)}
              </Text>
            </Grid.Col>
          </Grid>
        </Stack>
      </Card>

      <Grid>
        {/* Buyer Information */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder h="100%">
            <Stack gap="md">
              <Group>
                <IconUser size={20} />
                <Text fw={600}>Buyer Information</Text>
              </Group>
              <Divider />
              <Group>
                <Avatar
                  src={order.user.avatarUrl}
                  alt={order.user.name}
                  radius="xl"
                  size="lg"
                />
                <Stack gap={0}>
                  <Text fw={500}>{order.user.name}</Text>
                  <Text size="sm" c="dimmed">{order.user.email}</Text>
                  {order.user.phone && (
                    <Text size="sm" c="dimmed">{order.user.phone}</Text>
                  )}
                </Stack>
              </Group>
            </Stack>
          </Card>
        </Grid.Col>

        {/* Seller Information */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder h="100%">
            <Stack gap="md">
              <Group>
                <IconBuilding size={20} />
                <Text fw={600}>Seller Information</Text>
              </Group>
              <Divider />
              <Stack gap="xs">
                <div>
                  <Text size="sm" c="dimmed">Store</Text>
                  <Text fw={500}>{order.store.name}</Text>
                </div>
                <div>
                  <Text size="sm" c="dimmed">Owner</Text>
                  <Text>{order.store.seller.name}</Text>
                </div>
                <div>
                  <Text size="sm" c="dimmed">Contact</Text>
                  <Text size="sm">{order.store.email}</Text>
                  {order.store.phone && (
                    <Text size="sm">{order.store.phone}</Text>
                  )}
                </div>
              </Stack>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Shipping Information */}
      {order.shipping && (
        <Card withBorder>
          <Stack gap="md">
            <Group>
              <IconTruck size={20} />
              <Text fw={600}>Shipping Information</Text>
            </Group>
            <Divider />
            <Grid>
              {order.shipping.address && (
                <Grid.Col span={6}>
                  <Text size="sm" c="dimmed">Shipping Address</Text>
                  <Text>{order.shipping.address.street || 'N/A'}</Text>
                  <Text>
                    {order.shipping.address.city}, {order.shipping.address.state} {order.shipping.address.zip}
                  </Text>
                  {order.shipping.address.country && (
                    <Text>{order.shipping.address.country}</Text>
                  )}
                </Grid.Col>
              )}
              {order.shipping.method && (
                <Grid.Col span={6}>
                  <Text size="sm" c="dimmed">Shipping Method</Text>
                  <Text>{order.shipping.method}</Text>
                </Grid.Col>
              )}
              {order.shipping.trackingNumber && (
                <Grid.Col span={6}>
                  <Text size="sm" c="dimmed">Tracking Number</Text>
                  <Text fw={500}>{order.shipping.trackingNumber}</Text>
                </Grid.Col>
              )}
              {order.shipping.carrier && (
                <Grid.Col span={6}>
                  <Text size="sm" c="dimmed">Carrier</Text>
                  <Text>{order.shipping.carrier}</Text>
                </Grid.Col>
              )}
            </Grid>
          </Stack>
        </Card>
      )}

      {/* Order Timeline */}
      {order.timeline && order.timeline.length > 0 && (
        <Card withBorder>
          <Stack gap="md">
            <Group>
              <IconClock size={20} />
              <Text fw={600}>Order Timeline</Text>
            </Group>
            <Divider />
            <Timeline active={order.timeline.length} bulletSize={24} lineWidth={2}>
              {order.timeline.map((entry: any, index: number) => (
                <Timeline.Item
                  key={index}
                  bullet={getTimelineIcon(entry)}
                  title={
                    <Group gap="xs">
                      <Text fw={500}>
                        {entry.action === 'REFUND_PROCESSED' 
                          ? 'Refund Processed' 
                          : entry.status?.replace(/_/g, ' ') || 'Status Update'}
                      </Text>
                      <Badge size="xs" color={getTimelineColor(entry)} variant="light">
                        {entry.actorRole || 'SYSTEM'}
                      </Badge>
                    </Group>
                  }
                  color={getTimelineColor(entry)}
                >
                  <Text size="sm" c="dimmed" mt={4}>
                    {formatDate(entry.timestamp)}
                  </Text>
                  {entry.actor && (
                    <Text size="sm" mt={4}>
                      By: {entry.actor}
                    </Text>
                  )}
                  {entry.notes && (
                    <Paper p="xs" mt="xs" bg="gray.0">
                      <Text size="sm">{entry.notes}</Text>
                    </Paper>
                  )}
                  {entry.action === 'REFUND_PROCESSED' && entry.refundAmount && (
                    <Text size="sm" mt={4} fw={500} c="red">
                      Refund Amount: {formatCurrency(entry.refundAmount)}
                    </Text>
                  )}
                  {entry.reason && (
                    <Text size="sm" mt={4} c="dimmed">
                      Reason: {entry.reason}
                    </Text>
                  )}
                </Timeline.Item>
              ))}
            </Timeline>
          </Stack>
        </Card>
      )}
    </Stack>
  );
}
