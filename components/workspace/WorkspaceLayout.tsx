'use client';

import { useState, useEffect } from 'react';
import {
  AppShell,
  Box,
  Group,
  TextInput,
  Button,
  Menu,
  Avatar,
  Badge,
  ActionIcon,
  Tooltip,
  Text,
} from '@mantine/core';
import {
  Search,
  Plus,
  Bell,
  Settings,
  LogOut,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Sidebar } from '@/components/workspace/Sidebar';
import { notifications } from '@mantine/notifications';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'CLIENT' | 'VENDOR' | 'ADMIN';
  avatarUrl?: string;
}

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  user: User;
}

export function WorkspaceLayout({ children, user }: WorkspaceLayoutProps) {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationCount] = useState(3); // Mock data

  // Load sidebar preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved) {
      setSidebarCollapsed(JSON.parse(saved));
    }
  }, []);

  // Save sidebar preference to localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/workspace/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: '/login' });
      notifications.show({
        title: 'Déconnexion réussie',
        message: 'À bientôt !',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Erreur',
        message: 'Erreur lors de la déconnexion',
        color: 'red',
      });
    }
  };

  const handleNewAuction = () => {
    router.push('/workspace/my-auctions/new');
  };

  return (
    <AppShell
      navbar={{
        width: sidebarCollapsed ? 84 : 280,
        breakpoint: 'md',
      }}
      header={{ height: 64 }}
      padding={0}
      styles={{
        main: {
          backgroundColor: '#f8fafc',
        }
      }}
    >
      {/* Header */}
      <AppShell.Header style={{ backgroundColor: '#1e293b', borderBottom: '1px solid #334155' }}>
        <Group h="100%" px="lg" justify="space-between">
          {/* Left Section - Logo and Navigation */}
          <Group gap="xl">
            <Text 
              size="xl" 
              fw={700} 
              c="#228be6"
              style={{ 
                cursor: 'pointer',
                fontSize: '1.75rem'
              }}
              onClick={() => router.push('/')}
            >
              Bidinsouk
            </Text>
            
            {/* Navigation Tabs */}
            <Group gap="md">
              <Text 
                size="sm" 
                c="white" 
                style={{ 
                  cursor: 'pointer',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)'
                }}
                onClick={() => router.push('/workspace/dashboard')}
              >
                Administration
              </Text>
            </Group>
          </Group>

          {/* Center Section - Search */}
          <Box style={{ flex: 1, maxWidth: 400, margin: '0 2rem' }}>
            <form onSubmit={handleSearch}>
              <TextInput
                placeholder="Rechercher..."
                leftSection={<Search size={16} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                radius="md"
                styles={{
                  input: {
                    backgroundColor: '#334155',
                    border: '1px solid #475569',
                    color: 'white',
                    '&::placeholder': {
                      color: '#94a3b8'
                    },
                    '&:focus': {
                      borderColor: '#3b82f6'
                    }
                  }
                }}
              />
            </form>
          </Box>

          {/* Right Section - Actions & User */}
          <Group gap="sm">
            {/* Language Selector */}
            <Text size="sm" c="white" style={{ cursor: 'pointer' }}>
              FR
            </Text>

            {/* Notifications */}
            <Tooltip label="Notifications">
              <ActionIcon
                variant="subtle"
                size="lg"
                onClick={() => router.push('/workspace/notifications')}
                style={{ position: 'relative', color: 'white' }}
              >
                <Bell size={20} />
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

            {/* Quick Actions */}
            <Button
              leftSection={<Plus size={16} />}
              variant="filled"
              size="sm"
              color="orange"
              onClick={handleNewAuction}
              style={{
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                border: 'none'
              }}
            >
              Déposer une enchère
            </Button>

            {/* User Menu */}
            <Menu shadow="md" width={250}>
              <Menu.Target>
                <Group style={{ cursor: 'pointer' }} gap="xs">
                  <Avatar src={user.avatarUrl} size="sm" radius="xl" color="orange">
                    {user.name.charAt(0)}
                  </Avatar>
                  <Text size="sm" fw={500} c="white">
                    {user.role === 'VENDOR' ? 'Vendeur' : user.role}
                  </Text>
                </Group>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Mon compte</Menu.Label>
                <Menu.Item
                  leftSection={<Settings size={16} />}
                  onClick={() => router.push('/settings')}
                >
                  Paramètres
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<LogOut size={16} />}
                  onClick={handleLogout}
                  color="red"
                >
                  Déconnexion
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      {/* Sidebar */}
      <AppShell.Navbar>
        <Sidebar
          user={user}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </AppShell.Navbar>

      {/* Main Content */}
      <AppShell.Main>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          minHeight: 'calc(100vh - 64px)',
          padding: '2rem'
        }}>
          <div style={{ flex: 1 }}>
            {children}
          </div>
        </div>
      </AppShell.Main>
    </AppShell>
  );
}