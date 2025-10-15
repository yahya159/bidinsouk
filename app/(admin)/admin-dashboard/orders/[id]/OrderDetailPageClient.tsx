'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Title,
  Group,
  Button,
  Stack,
  Breadcrumbs,
  Anchor,
  Modal,
  Textarea,
  Text,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconEdit,
  IconCurrencyDollar,
  IconMessageCircle,
} from '@tabler/icons-react';
import { OrderDetailCard } from '@/components/admin/orders/OrderDetailCard';
import { OrderStatusUpdate } from '@/components/admin/orders/OrderStatusUpdate';
import { ConfirmDialog } from '@/components/admin/shared/ConfirmDialog';
import { notifications } from '@mantine/notifications';

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

interface OrderDetailPageClientProps {
  order: OrderDetail;
}

export function OrderDetailPageClient({ order: initialOrder }: OrderDetailPageClientProps) {
  const router = useRouter();
  const [order, setOrder] = useState(initialOrder);
  const [statusUpdateOpened, setStatusUpdateOpened] = useState(false);
  const [refundModalOpened, setRefundModalOpened] = useState(false);
  const [disputeModalOpened, setDisputeModalOpened] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundNotes, setRefundNotes] = useState('');
  const [disputeNotes, setDisputeNotes] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);
  const [disputeLoading, setDisputeLoading] = useState(false);

  const handleStatusUpdateSuccess = async () => {
    // Refresh order data
    try {
      const response = await fetch(`/api/admin/orders/${order.id}`);
      if (response.ok) {
        const updatedOrder = await response.json();
        setOrder(updatedOrder);
      }
    } catch (error) {
      console.error('Error refreshing order:', error);
    }
  };

  const handleRefund = async () => {
    if (!refundReason.trim()) {
      notifications.show({
        title: 'Error',
        message: 'Please provide a reason for the refund',
        color: 'red',
      });
      return;
    }

    setRefundLoading(true);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: refundReason,
          notes: refundNotes || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process refund');
      }

      notifications.show({
        title: 'Success',
        message: 'Refund processed successfully',
        color: 'green',
      });

      setRefundModalOpened(false);
      setRefundReason('');
      setRefundNotes('');

      // Refresh order data
      const orderResponse = await fetch(`/api/admin/orders/${order.id}`);
      if (orderResponse.ok) {
        const updatedOrder = await orderResponse.json();
        setOrder(updatedOrder);
      }
    } catch (error: any) {
      console.error('Error processing refund:', error);
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to process refund',
        color: 'red',
      });
    } finally {
      setRefundLoading(false);
    }
  };

  const handleDisputeResolution = async () => {
    if (!disputeNotes.trim()) {
      notifications.show({
        title: 'Error',
        message: 'Please provide resolution notes',
        color: 'red',
      });
      return;
    }

    setDisputeLoading(true);
    try {
      // In a real implementation, this would call a dispute resolution API
      // For now, we'll just add a note to the order timeline
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: `Dispute Resolution: ${disputeNotes}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add dispute resolution notes');
      }

      notifications.show({
        title: 'Success',
        message: 'Dispute resolution notes added',
        color: 'green',
      });

      setDisputeModalOpened(false);
      setDisputeNotes('');

      // Refresh order data
      const orderResponse = await fetch(`/api/admin/orders/${order.id}`);
      if (orderResponse.ok) {
        const updatedOrder = await orderResponse.json();
        setOrder(updatedOrder);
      }
    } catch (error: any) {
      console.error('Error adding dispute notes:', error);
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to add dispute resolution notes',
        color: 'red',
      });
    } finally {
      setDisputeLoading(false);
    }
  };

  const canRefund = order.status !== 'CANCELED_AFTER_CONFIRM' && order.status !== 'REFUSED';

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <Stack gap="xs">
            <Breadcrumbs>
              <Anchor onClick={() => router.push('/admin-dashboard')}>Dashboard</Anchor>
              <Anchor onClick={() => router.push('/admin-dashboard/orders')}>Orders</Anchor>
              <Text>{order.number}</Text>
            </Breadcrumbs>
            <Group>
              <Button
                variant="subtle"
                leftSection={<IconArrowLeft size={16} />}
                onClick={() => router.push('/admin-dashboard/orders')}
              >
                Back to Orders
              </Button>
            </Group>
          </Stack>

          <Group>
            <Button
              leftSection={<IconEdit size={16} />}
              onClick={() => setStatusUpdateOpened(true)}
            >
              Update Status
            </Button>
            {canRefund && (
              <Button
                leftSection={<IconCurrencyDollar size={16} />}
                color="red"
                variant="light"
                onClick={() => setRefundModalOpened(true)}
              >
                Process Refund
              </Button>
            )}
            <Button
              leftSection={<IconMessageCircle size={16} />}
              variant="light"
              onClick={() => setDisputeModalOpened(true)}
            >
              Dispute Resolution
            </Button>
          </Group>
        </Group>

        <OrderDetailCard order={order} />
      </Stack>

      {/* Status Update Modal */}
      <OrderStatusUpdate
        orderId={order.id}
        currentStatus={order.status}
        currentFulfillStatus={order.fulfillStatus}
        opened={statusUpdateOpened}
        onClose={() => setStatusUpdateOpened(false)}
        onSuccess={handleStatusUpdateSuccess}
      />

      {/* Refund Modal */}
      <Modal
        opened={refundModalOpened}
        onClose={() => setRefundModalOpened(false)}
        title="Process Refund"
        size="md"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            This will cancel the order and process a full refund to the buyer.
          </Text>

          <Textarea
            label="Refund Reason"
            placeholder="Enter the reason for this refund"
            value={refundReason}
            onChange={(e) => setRefundReason(e.currentTarget.value)}
            required
            minRows={2}
          />

          <Textarea
            label="Additional Notes"
            placeholder="Add any additional notes (optional)"
            value={refundNotes}
            onChange={(e) => setRefundNotes(e.currentTarget.value)}
            minRows={3}
          />

          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              onClick={() => setRefundModalOpened(false)}
              disabled={refundLoading}
            >
              Cancel
            </Button>
            <Button
              color="red"
              onClick={handleRefund}
              loading={refundLoading}
            >
              Process Refund
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Dispute Resolution Modal */}
      <Modal
        opened={disputeModalOpened}
        onClose={() => setDisputeModalOpened(false)}
        title="Dispute Resolution"
        size="md"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Add notes about the dispute resolution for this order.
          </Text>

          <Textarea
            label="Resolution Notes"
            placeholder="Enter dispute resolution details"
            value={disputeNotes}
            onChange={(e) => setDisputeNotes(e.currentTarget.value)}
            required
            minRows={4}
          />

          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              onClick={() => setDisputeModalOpened(false)}
              disabled={disputeLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDisputeResolution}
              loading={disputeLoading}
            >
              Save Resolution
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
