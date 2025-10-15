'use client';

import { useState } from 'react';
import {
  Group,
  Button,
  Menu,
  ActionIcon,
  Text,
  Badge,
  Modal,
  Stack,
  Alert,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconChevronDown,
  IconCheck,
  IconX,
  IconAlertCircle,
  IconDots,
} from '@tabler/icons-react';

export interface BulkAction {
  key: string;
  label: string;
  icon: React.ReactNode;
  color?: string;
  confirmMessage?: string;
  confirmTitle?: string;
  action: (selectedIds: string[]) => Promise<{ success: number; failed: number }>;
  requiresConfirmation?: boolean;
}

export interface BulkActionsProps {
  selectedIds: string[];
  actions: BulkAction[];
  onClearSelection?: () => void;
  variant?: 'toolbar' | 'menu';
}

export function BulkActions({
  selectedIds,
  actions,
  onClearSelection,
  variant = 'toolbar',
}: BulkActionsProps) {
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<BulkAction | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const handleActionClick = (action: BulkAction) => {
    if (action.requiresConfirmation !== false) {
      setCurrentAction(action);
      setConfirmModalOpen(true);
    } else {
      executeAction(action);
    }
  };

  const executeAction = async (action: BulkAction) => {
    setIsExecuting(true);
    setConfirmModalOpen(false);

    try {
      const result = await action.action(selectedIds);

      if (result.failed === 0) {
        notifications.show({
          title: 'Success',
          message: `Successfully processed ${result.success} item${
            result.success !== 1 ? 's' : ''
          }`,
          color: 'green',
          icon: <IconCheck size={16} />,
        });
      } else if (result.success === 0) {
        notifications.show({
          title: 'Error',
          message: `Failed to process ${result.failed} item${
            result.failed !== 1 ? 's' : ''
          }`,
          color: 'red',
          icon: <IconX size={16} />,
        });
      } else {
        notifications.show({
          title: 'Partial Success',
          message: `Processed ${result.success} item${
            result.success !== 1 ? 's' : ''
          }, ${result.failed} failed`,
          color: 'yellow',
          icon: <IconAlertCircle size={16} />,
        });
      }

      onClearSelection?.();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'An error occurred',
        color: 'red',
        icon: <IconX size={16} />,
      });
    } finally {
      setIsExecuting(false);
      setCurrentAction(null);
    }
  };

  if (selectedIds.length === 0) return null;

  if (variant === 'menu') {
    return (
      <>
        <Group gap="xs">
          <Badge variant="filled" size="lg">
            {selectedIds.length} selected
          </Badge>
          <Menu position="bottom-end" shadow="md">
            <Menu.Target>
              <ActionIcon variant="filled" size="lg">
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Bulk Actions</Menu.Label>
              {actions.map((action) => (
                <Menu.Item
                  key={action.key}
                  leftSection={action.icon}
                  color={action.color}
                  onClick={() => handleActionClick(action)}
                  disabled={isExecuting}
                >
                  {action.label}
                </Menu.Item>
              ))}
              {onClearSelection && (
                <>
                  <Menu.Divider />
                  <Menu.Item
                    leftSection={<IconX size={16} />}
                    onClick={onClearSelection}
                  >
                    Clear Selection
                  </Menu.Item>
                </>
              )}
            </Menu.Dropdown>
          </Menu>
        </Group>

        {currentAction && (
          <Modal
            opened={confirmModalOpen}
            onClose={() => setConfirmModalOpen(false)}
            title={currentAction.confirmTitle || 'Confirm Action'}
            centered
          >
            <Stack gap="md">
              <Alert icon={<IconAlertCircle size={16} />} color="yellow">
                {currentAction.confirmMessage ||
                  `Are you sure you want to perform this action on ${selectedIds.length} item${
                    selectedIds.length !== 1 ? 's' : ''
                  }?`}
              </Alert>
              <Group justify="flex-end" gap="xs">
                <Button
                  variant="default"
                  onClick={() => setConfirmModalOpen(false)}
                  disabled={isExecuting}
                >
                  Cancel
                </Button>
                <Button
                  color={currentAction.color || 'blue'}
                  onClick={() => executeAction(currentAction)}
                  loading={isExecuting}
                >
                  Confirm
                </Button>
              </Group>
            </Stack>
          </Modal>
        )}
      </>
    );
  }

  return (
    <>
      <Group gap="md" p="md" style={{ backgroundColor: 'var(--mantine-color-blue-0)' }}>
        <Badge variant="filled" size="lg">
          {selectedIds.length} selected
        </Badge>
        <Group gap="xs" style={{ flex: 1 }}>
          {actions.map((action) => (
            <Button
              key={action.key}
              leftSection={action.icon}
              color={action.color}
              variant="light"
              size="sm"
              onClick={() => handleActionClick(action)}
              loading={isExecuting && currentAction?.key === action.key}
              disabled={isExecuting && currentAction?.key !== action.key}
            >
              {action.label}
            </Button>
          ))}
        </Group>
        {onClearSelection && (
          <Button
            variant="subtle"
            size="sm"
            onClick={onClearSelection}
            leftSection={<IconX size={16} />}
          >
            Clear
          </Button>
        )}
      </Group>

      {currentAction && (
        <Modal
          opened={confirmModalOpen}
          onClose={() => setConfirmModalOpen(false)}
          title={currentAction.confirmTitle || 'Confirm Action'}
          centered
        >
          <Stack gap="md">
            <Alert icon={<IconAlertCircle size={16} />} color="yellow">
              {currentAction.confirmMessage ||
                `Are you sure you want to perform this action on ${selectedIds.length} item${
                  selectedIds.length !== 1 ? 's' : ''
                }?`}
            </Alert>
            <Group justify="flex-end" gap="xs">
              <Button
                variant="default"
                onClick={() => setConfirmModalOpen(false)}
                disabled={isExecuting}
              >
                Cancel
              </Button>
              <Button
                color={currentAction.color || 'blue'}
                onClick={() => executeAction(currentAction)}
                loading={isExecuting}
              >
                Confirm
              </Button>
            </Group>
          </Stack>
        </Modal>
      )}
    </>
  );
}
