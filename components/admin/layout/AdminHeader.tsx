'use client';

import {
  Group,
  Avatar,
  Menu,
  Text,
  TextInput,
  Button,
  ActionIcon,
  Tooltip,
  Badge,
  Box,
} from '@mantine/core';
import { 
  IconSearch, 
  IconBell, 
  IconSettings, 
  IconLogout, 
  IconUser 
} from '@tabler/icons-react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { notifications } from '@mantine/notifications';

interface AdminHeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationCount] = useState(0); // Mock data

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/admin-dashboard/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: '/login' });
      notifications.show({
        title: 'Logged out',
        message: 'See you soon!',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error during logout',
        color: 'red',
      });
    }
  };

  return (
    <Group h="100%" px="lg" justify="space-between">
      {/* Left Section - Logo */}
      <Group gap="xl">
        <Text
          size="xl"
          fw={700}
          c="#228be6"
          style={{
            cursor: 'pointer',
            fontSize: '1.75rem',
          }}
          onClick={() => router.push('/')}
        >
          Bidinsouk
        </Text>

        {/* Admin Badge */}
        <Text
          size="sm"
          c="white"
          style={{
            cursor: 'pointer',
            padding: '8px 16px',
            borderRadius: '6px',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
          }}
          onClick={() => router.push('/admin-dashboard')}
        >
          Administration
        </Text>
      </Group>

      {/* Center Section - Search */}
      <Box style={{ flex: 1, maxWidth: 400, margin: '0 2rem' }}>
        <form onSubmit={handleSearch}>
          <TextInput
            placeholder="Search..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            radius="md"
            styles={{
              input: {
                backgroundColor: '#334155',
                border: '1px solid #475569',
                color: 'white',
                '&::placeholder': {
                  color: '#94a3b8',
                },
                '&:focus': {
                  borderColor: '#3b82f6',
                },
              },
            }}
          />
        </form>
      </Box>

      {/* Right Section - Actions & User */}
      <Group gap="sm">
        {/* Notifications */}
        <Tooltip label="Notifications">
          <ActionIcon
            variant="subtle"
            size="lg"
            onClick={() => router.push('/admin-dashboard/activity-logs')}
            style={{ position: 'relative', color: 'white' }}
          >
            <IconBell size={20} />
            {notificationCount > 0 && (
              <Badge
                size="xs"
                color="red"
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  minWidth: 16,
                  height: 16,
                  padding: 0,
                  fontSize: 10,
                }}
              >
                {notificationCount}
              </Badge>
            )}
          </ActionIcon>
        </Tooltip>

        {/* User Menu */}
        <Menu shadow="md" width={250}>
          <Menu.Target>
            <Group style={{ cursor: 'pointer' }} gap="xs">
              <Avatar src={user.image} size="sm" radius="xl" color="red">
                {user.name?.charAt(0) || 'A'}
              </Avatar>
              <Text size="sm" fw={500} c="white">
                Admin
              </Text>
            </Group>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>My Account</Menu.Label>
            <Menu.Item
              leftSection={<IconUser size={16} />}
              onClick={() => router.push('/workspace')}
            >
              My Profile
            </Menu.Item>
            <Menu.Item
              leftSection={<IconSettings size={16} />}
              onClick={() => router.push('/admin-dashboard/settings')}
            >
              Settings
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item leftSection={<IconLogout size={16} />} onClick={handleLogout} color="red">
              Logout
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Group>
  );
}
