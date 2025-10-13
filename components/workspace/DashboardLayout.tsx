'use client';

import { useState, useEffect } from 'react';
import {
  AppShell,
  Group,
  Text,
  Menu,
  Avatar,
  ActionIcon,
  Tooltip,
  Badge,
} from '@mantine/core';
import {
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

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: User;
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div style={{ 
        width: sidebarCollapsed ? 84 : 280,
        transition: 'width 0.2s ease',
        borderRight: '1px solid #e9ecef'
      }}>
        <Sidebar
          user={user}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Main Content Area */}
      <div style={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f8fafc'
      }}>
        {/* Top Header */}
        <div style={{
          height: 64,
          backgroundColor: 'white',
          borderBottom: '1px solid #e9ecef',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2rem'
        }}>
          {/* Left side - Logo and Title */}
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
            <Text 
              size="lg" 
              fw={600} 
              c="#64748b"
              style={{ cursor: 'pointer' }}
              onClick={() => router.push('/workspace/dashboard')}
            >
              Administration de Boutique
            </Text>
          </Group>

          {/* Right side - User actions */}
          <Group gap="sm">
            {/* Notifications */}
            <Tooltip label="Notifications">
              <ActionIcon
                variant="subtle"
                size="lg"
                onClick={() => router.push('/notifications')}
                style={{ position: 'relative' }}
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

            {/* User Menu */}
            <Menu shadow="md" width={250}>
              <Menu.Target>
                <Group style={{ cursor: 'pointer' }} gap="xs">
                  <Avatar src={user.avatarUrl} size="sm" radius="xl" color="orange">
                    {user.name.charAt(0)}
                  </Avatar>
                  <Text size="sm" fw={500}>
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
        </div>

        {/* Main Content */}
        <div style={{ 
          flex: 1,
          padding: '2rem',
          overflow: 'auto'
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}