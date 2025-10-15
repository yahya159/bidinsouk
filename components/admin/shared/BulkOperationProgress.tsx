'use client';

import { Modal, Progress, Text, Stack, Group, Badge } from '@mantine/core';
import { IconCheck, IconX } from '@tabler/icons-react';

interface BulkOperationProgressProps {
  opened: boolean;
  title: string;
  total: number;
  completed: number;
  successful: number;
  failed: number;
  currentItem?: string;
}

export function BulkOperationProgress({
  opened,
  title,
  total,
  completed,
  successful,
  failed,
  currentItem,
}: BulkOperationProgressProps) {
  const progress = total > 0 ? (completed / total) * 100 : 0;
  const isComplete = completed === total;

  return (
    <Modal
      opened={opened}
      onClose={() => {}}
      title={title}
      closeOnClickOutside={false}
      closeOnEscape={false}
      withCloseButton={false}
      centered
    >
      <Stack gap="md">
        <Progress value={progress} size="xl" animated={!isComplete} />

        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Progress: {completed} / {total}
          </Text>
          <Text size="sm" fw={600}>
            {Math.round(progress)}%
          </Text>
        </Group>

        {currentItem && !isComplete && (
          <Text size="sm" c="dimmed">
            Processing: {currentItem}
          </Text>
        )}

        <Group gap="md">
          <Group gap="xs">
            <IconCheck size={16} color="green" />
            <Badge color="green" variant="light">
              {successful} successful
            </Badge>
          </Group>
          {failed > 0 && (
            <Group gap="xs">
              <IconX size={16} color="red" />
              <Badge color="red" variant="light">
                {failed} failed
              </Badge>
            </Group>
          )}
        </Group>

        {isComplete && (
          <Text size="sm" fw={600} c={failed > 0 ? 'orange' : 'green'}>
            {failed > 0
              ? `Operation completed with ${failed} error(s)`
              : 'Operation completed successfully'}
          </Text>
        )}
      </Stack>
    </Modal>
  );
}
