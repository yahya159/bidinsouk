'use client';

import { Modal, Button, Group, Stack, Text, Alert } from '@mantine/core';
import { IconAlertCircle, IconAlertTriangle, IconInfoCircle } from '@tabler/icons-react';

export interface ConfirmDialogProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export function ConfirmDialog({
  opened,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmColor = 'blue',
  variant = 'info',
  loading = false,
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <IconAlertCircle size={16} />;
      case 'warning':
        return <IconAlertTriangle size={16} />;
      case 'info':
      default:
        return <IconInfoCircle size={16} />;
    }
  };

  const getColor = () => {
    switch (variant) {
      case 'danger':
        return 'red';
      case 'warning':
        return 'yellow';
      case 'info':
      default:
        return 'blue';
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={title} centered>
      <Stack gap="md">
        <Alert icon={getIcon()} color={getColor()} variant="light">
          <Text size="sm">{message}</Text>
        </Alert>
        <Group justify="flex-end" gap="xs">
          <Button variant="default" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            color={confirmColor}
            onClick={handleConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

// Hook for easier usage
export function useConfirmDialog() {
  const [opened, setOpened] = useState(false);
  const [config, setConfig] = useState<Omit<ConfirmDialogProps, 'opened' | 'onClose'>>({
    onConfirm: () => {},
    title: '',
    message: '',
  });

  const confirm = (newConfig: Omit<ConfirmDialogProps, 'opened' | 'onClose'>) => {
    setConfig(newConfig);
    setOpened(true);
    return new Promise<boolean>((resolve) => {
      const originalOnConfirm = newConfig.onConfirm;
      setConfig({
        ...newConfig,
        onConfirm: async () => {
          await originalOnConfirm();
          setOpened(false);
          resolve(true);
        },
      });
    });
  };

  const dialog = (
    <ConfirmDialog
      {...config}
      opened={opened}
      onClose={() => {
        setOpened(false);
      }}
    />
  );

  return { confirm, dialog };
}

// Import useState for the hook
import { useState } from 'react';
