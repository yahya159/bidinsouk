'use client';

import { Card, Text, Button, Group, Stack, SimpleGrid } from '@mantine/core';
import { 
  IconUserPlus, 
  IconShoppingBagPlus, 
  IconGavel, 
  IconBuildingStore,
  IconFileText,
  IconSettings
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

export function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      label: 'Create User',
      icon: IconUserPlus,
      color: 'blue',
      path: '/admin-dashboard/users/new',
    },
    {
      label: 'View Products',
      icon: IconShoppingBagPlus,
      color: 'green',
      path: '/admin-dashboard/products',
    },
    {
      label: 'View Auctions',
      icon: IconGavel,
      color: 'violet',
      path: '/admin-dashboard/auctions',
    },
    {
      label: 'Create Store',
      icon: IconBuildingStore,
      color: 'teal',
      path: '/admin-dashboard/stores/new',
    },
    {
      label: 'View Reports',
      icon: IconFileText,
      color: 'orange',
      path: '/admin-dashboard/reports',
    },
    {
      label: 'Settings',
      icon: IconSettings,
      color: 'gray',
      path: '/admin-dashboard/settings',
    },
  ];

  return (
    <Card withBorder padding="lg" radius="md" h="100%">
      <Stack gap="md">
        <Text size="lg" fw={600}>
          Quick Actions
        </Text>

        <SimpleGrid cols={2} spacing="sm">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="light"
              color={action.color}
              leftSection={<action.icon size={18} />}
              onClick={() => router.push(action.path)}
              fullWidth
            >
              {action.label}
            </Button>
          ))}
        </SimpleGrid>
      </Stack>
    </Card>
  );
}
