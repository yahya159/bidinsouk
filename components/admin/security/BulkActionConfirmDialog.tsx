'use client';

import { Modal, Text, Button, Group, Stack, Alert, List, Badge } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

interface BulkActionConfirmDialogProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemCount: number;
  actionType: 'delete' | 'update' | 'archive' | 'activate' | 'suspend';
  loading?: boolean;
  warnings?: string[];
}

export function BulkActionConfirmDialog({
  opened,
  onClose,
  onConfirm,
  title,
  message,
  itemCount,
  actionType,
  loading = false,
  warnings = [],
}: BulkActionConfirmDialogProps) {
  const isDangerous = actionType === 'delete';
  const buttonColor = isDangerous ? 'red' : 'blue';
  const buttonLabel = actionType === 'delete' ? 'Delete All' : 'Confirm';

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      centered
      size="md"
      closeOnClickOutside={!loading}
      closeOnEscape={!loading}
    >
      <Stack gap="md">
        {isDangerous && (
          <Alert icon={<IconAlertTriangle size={16} />} color="red" variant="light">
            This action cannot be undone
          </Alert>
        )}

        <Text size="sm">{message}</Text>

        <Group gap="xs">
          <Text size="sm" c="dimmed">
            Items selected:
          </Text>
          <Badge color={buttonColor} size="lg">
            {itemCount}
          </Badge>
        </Group>

        {warnings.length > 0 && (
          <Alert color="yellow" variant="light">
            <Text size="sm" fw={600} mb="xs">
              Warnings:
            </Text>
            <List size="sm">
              {warnings.map((warning, index) => (
                <List.Item key={index}>{warning}</List.Item>
              ))}
            </List>
          </Alert>
        )}

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button color={buttonColor} onClick={onConfirm} loading={loading}>
            {buttonLabel}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
