'use client';

import {
  Stack,
  Group,
  Text,
  UnstyledButton,
  Tooltip,
  Divider,
  ActionIcon,
  Box,
} from '@mantine/core';
import {
  IconDashboard,
  IconUsers,
  IconPackage,
  IconGavel,
  IconShoppingCart,
  IconBuildingStore,
  IconClipboardList,
  IconChartBar,
  IconFlag,
  IconSettings,
  IconMenu2,
  IconUserCheck,
} from '@tabler/icons-react';
import { useRouter, usePathname } from 'next/navigation';

interface AdminSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  href: string;
  description?: string;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    icon: IconDashboard,
    href: '/admin-dashboard',
    description: 'Overview and statistics',
  },
  {
    label: 'Users',
    icon: IconUsers,
    href: '/admin-dashboard/users',
    description: 'Manage all users',
  },
  {
    label: 'Products',
    icon: IconPackage,
    href: '/admin-dashboard/products',
    description: 'Manage products',
  },
  {
    label: 'Auctions',
    icon: IconGavel,
    href: '/admin-dashboard/auctions',
    description: 'Manage auctions',
  },
  {
    label: 'Orders',
    icon: IconShoppingCart,
    href: '/admin-dashboard/orders',
    description: 'View and manage orders',
  },
  {
    label: 'Vendors',
    icon: IconUserCheck,
    href: '/admin/vendors/pending',
    description: 'Manage vendor applications',
  },
  {
    label: 'Stores',
    icon: IconBuildingStore,
    href: '/admin-dashboard/stores',
    description: 'Manage vendor stores',
  },
  {
    label: 'Activity Logs',
    icon: IconClipboardList,
    href: '/admin-dashboard/activity-logs',
    description: 'View system activity',
  },
  {
    label: 'Analytics',
    icon: IconChartBar,
    href: '/admin-dashboard/analytics',
    description: 'Reports and analytics',
  },
  {
    label: 'Reports',
    icon: IconFlag,
    href: '/admin-dashboard/reports',
    description: 'Abuse reports',
  },
  {
    label: 'Settings',
    icon: IconSettings,
    href: '/admin-dashboard/settings',
    description: 'Platform settings',
  },
];

export function AdminSidebar({ collapsed, onToggleCollapse }: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  const NavButton = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
    const IconComponent = item.icon;

    const button = (
      <UnstyledButton
        onClick={() => handleNavigation(item.href)}
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          padding: collapsed ? '12px' : '12px 16px',
          borderRadius: 8,
          backgroundColor: isActive ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
          color: isActive ? '#ef4444' : '#e2e8f0',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = 'rgba(148, 163, 184, 0.1)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        <Group gap={collapsed ? 0 : 'sm'} justify={collapsed ? 'center' : 'flex-start'}>
          <IconComponent size={20} />
          {!collapsed && (
            <Text size="sm" fw={isActive ? 600 : 400} c="inherit">
              {item.label}
            </Text>
          )}
        </Group>
      </UnstyledButton>
    );

    if (collapsed) {
      return (
        <Tooltip label={item.label} position="right" withArrow>
          {button}
        </Tooltip>
      );
    }

    return button;
  };

  return (
    <Stack
      gap="xs"
      p="md"
      style={{
        height: '100%',
        backgroundColor: '#1e293b',
        borderRight: '1px solid #334155',
      }}
    >
      {/* Toggle Button */}
      <Group justify={collapsed ? 'center' : 'space-between'} mb="md">
        {!collapsed && (
          <Text fw={700} size="lg" c="white">
            Menu
          </Text>
        )}
        <ActionIcon variant="subtle" onClick={onToggleCollapse} size="sm" style={{ color: 'white' }}>
          <IconMenu2 size={16} />
        </ActionIcon>
      </Group>

      {/* Navigation Items */}
      <Stack gap={4} style={{ flex: 1 }}>
        {navItems.map((item) => (
          <NavButton key={item.href} item={item} />
        ))}
      </Stack>
    </Stack>
  );
}
