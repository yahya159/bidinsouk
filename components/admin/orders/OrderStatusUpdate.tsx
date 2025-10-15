'use client';

import { useState } from 'react';
import {
  Modal,
  Select,
  Textarea,
  Button,
  Stack,
  Group,
  Text,
  Alert,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

interface OrderStatusUpdateProps {
  orderId: string;
  currentStatus: string;
  currentFulfillStatus: string;
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ORDER_STATUSES = [
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'REFUSED', label: 'Refused' },
  { value: 'CANCELED_AFTER_CONFIRM', label: 'Canceled' },
];

const FULFILL_STATUSES = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'PREPARING', label: 'Preparing' },
  { value: 'READY_FOR_PICKUP', label: 'Ready for Pickup' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELED', label: 'Canceled' },
];

// Define valid status transitions
const VALID_ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  CONFIRMED: ['REFUSED', 'CANCELED_AFTER_CONFIRM'],
  REFUSED: ['CONFIRMED'],
  CANCELED_AFTER_CONFIRM: [],
};

const VALID_FULFILL_STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['PREPARING', 'CANCELED'],
  PREPARING: ['READY_FOR_PICKUP', 'SHIPPED', 'CANCELED'],
  READY_FOR_PICKUP: ['SHIPPED', 'DELIVERED', 'CANCELED'],
  SHIPPED: ['DELIVERED', 'CANCELED'],
  DELIVERED: [],
  CANCELED: [],
};

export function OrderStatusUpdate({
  orderId,
  currentStatus,
  currentFulfillStatus,
  opened,
  onClose,
  onSuccess,
}: OrderStatusUpdateProps) {
  const [status, setStatus] = useState<string | null>(currentStatus);
  const [fulfillStatus, setFulfillStatus] = useState<string | null>(currentFulfillStatus);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateTransition = () => {
    // Check order status transition
    if (status && status !== currentStatus) {
      const validTransitions = VALID_ORDER_STATUS_TRANSITIONS[currentStatus] || [];
      if (!validTransitions.includes(status)) {
        return `Cannot transition from ${currentStatus} to ${status}`;
      }
    }

    // Check fulfillment status transition
    if (fulfillStatus && fulfillStatus !== currentFulfillStatus) {
      const validTransitions = VALID_FULFILL_STATUS_TRANSITIONS[currentFulfillStatus] || [];
      if (!validTransitions.includes(fulfillStatus)) {
        return `Cannot transition from ${currentFulfillStatus} to ${fulfillStatus}`;
      }
    }

    // Check if order is canceled, fulfillment should also be canceled
    if (status === 'CANCELED_AFTER_CONFIRM' && fulfillStatus !== 'CANCELED') {
      return 'When order is canceled, fulfillment status must also be canceled';
    }

    return null;
  };

  const handleSubmit = async () => {
    // Validate transitions
    const error = validateTransition();
    if (error) {
      setValidationError(error);
      return;
    }

    // Check if anything changed
    if (status === currentStatus && fulfillStatus === currentFulfillStatus && !notes) {
      notifications.show({
        title: 'No Changes',
        message: 'No status changes were made',
        color: 'yellow',
      });
      return;
    }

    setLoading(true);
    setValidationError(null);

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: status !== currentStatus ? status : undefined,
          fulfillStatus: fulfillStatus !== currentFulfillStatus ? fulfillStatus : undefined,
          notes: notes || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update order status');
      }

      notifications.show({
        title: 'Success',
        message: 'Order status updated successfully',
        color: 'green',
      });

      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error updating order status:', error);
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to update order status',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStatus(currentStatus);
    setFulfillStatus(currentFulfillStatus);
    setNotes('');
    setValidationError(null);
    onClose();
  };

  // Filter available statuses based on valid transitions
  const availableOrderStatuses = ORDER_STATUSES.filter(
    (s) => s.value === currentStatus || (VALID_ORDER_STATUS_TRANSITIONS[currentStatus] || []).includes(s.value)
  );

  const availableFulfillStatuses = FULFILL_STATUSES.filter(
    (s) => s.value === currentFulfillStatus || (VALID_FULFILL_STATUS_TRANSITIONS[currentFulfillStatus] || []).includes(s.value)
  );

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Update Order Status"
      size="md"
    >
      <Stack gap="md">
        {validationError && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" title="Validation Error">
            {validationError}
          </Alert>
        )}

        <Select
          label="Order Status"
          placeholder="Select order status"
          data={availableOrderStatuses}
          value={status}
          onChange={setStatus}
          required
        />

        <Select
          label="Fulfillment Status"
          placeholder="Select fulfillment status"
          data={availableFulfillStatuses}
          value={fulfillStatus}
          onChange={setFulfillStatus}
          required
        />

        <Textarea
          label="Notes"
          placeholder="Add notes about this status change (optional)"
          value={notes}
          onChange={(e) => setNotes(e.currentTarget.value)}
          minRows={3}
          maxRows={6}
        />

        <Text size="xs" c="dimmed">
          Current Status: <strong>{currentStatus.replace(/_/g, ' ')}</strong>
          <br />
          Current Fulfillment: <strong>{currentFulfillStatus.replace(/_/g, ' ')}</strong>
        </Text>

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            Update Status
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
