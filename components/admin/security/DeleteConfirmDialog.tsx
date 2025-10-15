'use client';

import { Modal, Text, Button, Group, Stack, Alert } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

interface DeleteConfirmDialogProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemName?: string;
  loading?: boolean;
  danger?: boolean;
}

export function DeleteConfirmDialog({
  opened,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  loading = false,
  danger = true,
}: DeleteConfirmDialogProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      centered
      closeOnClickOutside={!loading}
      closeOnEscape={!loading}
    >
      <Stack gap="md">
        {danger && (
          <Alert icon={<IconAlertTriangle size={16} />} color="red" variant="light">
            This action cannot be undone
          </Alert>
        )}

        <Text size="sm">{message}</Text>

        {itemName && (
          <Text size="sm" fw={600} c={danger ? 'red' : 'dimmed'}>
            {itemName}
          </Text>
        )}

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            color={danger ? 'red' : 'blue'}
            onClick={onConfirm}
            loading={loading}
          >
            {danger ? 'Delete' : 'Confirm'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
