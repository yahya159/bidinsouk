'use client';

import { Modal, Stack, Text, Group, Badge, Table, Title } from '@mantine/core';
import { IconCommand, IconKeyboard } from '@tabler/icons-react';

interface KeyboardShortcutsHelpProps {
  opened: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsHelp({ opened, onClose }: KeyboardShortcutsHelpProps) {
  const shortcuts = [
    {
      category: 'Global',
      items: [
        { keys: ['⌘/Ctrl', 'K'], description: 'Open command palette' },
        { keys: ['⌘/Ctrl', '/'], description: 'Show keyboard shortcuts' },
        { keys: ['⌘/Ctrl', 'H'], description: 'Go to dashboard' },
        { keys: ['Esc'], description: 'Close modals/dialogs' },
      ],
    },
    {
      category: 'Navigation',
      items: [
        { keys: ['G', 'D'], description: 'Go to Dashboard' },
        { keys: ['G', 'U'], description: 'Go to Users' },
        { keys: ['G', 'P'], description: 'Go to Products' },
        { keys: ['G', 'A'], description: 'Go to Auctions' },
        { keys: ['G', 'O'], description: 'Go to Orders' },
        { keys: ['G', 'S'], description: 'Go to Stores' },
      ],
    },
    {
      category: 'Actions',
      items: [
        { keys: ['C'], description: 'Create new item (context-dependent)' },
        { keys: ['E'], description: 'Edit selected item' },
        { keys: ['Delete'], description: 'Delete selected item' },
        { keys: ['⌘/Ctrl', 'S'], description: 'Save form' },
      ],
    },
    {
      category: 'Search & Filter',
      items: [
        { keys: ['/'], description: 'Focus search input' },
        { keys: ['⌘/Ctrl', 'F'], description: 'Open filters' },
        { keys: ['⌘/Ctrl', 'E'], description: 'Export data' },
      ],
    },
  ];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconKeyboard size={24} />
          <Title order={3}>Keyboard Shortcuts</Title>
        </Group>
      }
      size="lg"
      centered
    >
      <Stack gap="xl">
        <Text size="sm" c="dimmed">
          Use these keyboard shortcuts to navigate and perform actions quickly in the admin dashboard.
        </Text>

        {shortcuts.map((section) => (
          <Stack key={section.category} gap="sm">
            <Text fw={600} size="sm">
              {section.category}
            </Text>
            <Table>
              <Table.Tbody>
                {section.items.map((shortcut, index) => (
                  <Table.Tr key={index}>
                    <Table.Td width="40%">
                      <Group gap="xs">
                        {shortcut.keys.map((key, keyIndex) => (
                          <Badge
                            key={keyIndex}
                            variant="light"
                            color="gray"
                            size="lg"
                            leftSection={keyIndex === 0 ? <IconCommand size={12} /> : undefined}
                          >
                            {key}
                          </Badge>
                        ))}
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{shortcut.description}</Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Stack>
        ))}

        <Text size="xs" c="dimmed" ta="center">
          Press <Badge size="sm">⌘/Ctrl + /</Badge> anytime to show this help
        </Text>
      </Stack>
    </Modal>
  );
}
