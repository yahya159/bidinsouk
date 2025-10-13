'use client';

import { useState } from 'react';
import {
  Stack,
  Group,
  Text,
  UnstyledButton,
  Tooltip,
  Divider,
  ActionIcon,
  Modal,
  TextInput,
  Button,
  Alert,
  Box,
} from '@mantine/core';
import {
  LayoutDashboard,
  Package,
  Gavel,
  ShoppingBag,
  UsersRound,
  MessageSquare,
  BarChart3,
  Store,
  Settings,
  LogOut,
  Trash2,
  Menu,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useDisclosure } from '@mantine/hooks';
import { signOut } from 'next-auth/react';
import { notifications } from '@mantine/notifications';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'CLIENT' | 'VENDOR' | 'ADMIN';
  avatarUrl?: string;
}

interface SidebarProps {
  user: User;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  href: string;
  adminOnly?: boolean;
  danger?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/workspace/dashboard' },
  { label: 'Produits', icon: Package, href: '/workspace/products' },
  { label: 'Enchères', icon: Gavel, href: '/workspace/my-auctions' },
  { label: 'Commandes', icon: ShoppingBag, href: '/workspace/orders' },
  { label: 'Clients', icon: UsersRound, href: '/workspace/clients' },
  { label: 'Avis', icon: MessageSquare, href: '/workspace/reviews' },
  { label: 'Analytiques', icon: BarChart3, href: '/workspace/analytics' },
  { label: 'Rapports', icon: FileText, href: '/workspace/reports' },
  { label: 'Magasin vendeur', icon: Store, href: '/workspace/admin/stores', adminOnly: true },
  { label: 'Réglages', icon: Settings, href: '/settings' },
];

export function Sidebar({ user, collapsed, onToggleCollapse }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleNavigation = (href: string) => {
    router.push(href);
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

  const handleDeleteAccount = async () => {
    if (deleteConfirmEmail !== user.email || deleteConfirmText !== 'SUPPRIMER') {
      notifications.show({
        title: 'Erreur',
        message: 'Veuillez confirmer votre email et taper SUPPRIMER',
        color: 'red',
      });
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch('/api/users/me', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        notifications.show({
          title: 'Compte supprimé',
          message: 'Votre compte a été supprimé avec succès',
          color: 'green',
        });
        await signOut({ callbackUrl: '/' });
      } else {
        throw new Error('Erreur lors de la suppression');
      }
    } catch (error) {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de supprimer le compte',
        color: 'red',
      });
    } finally {
      setIsDeleting(false);
      closeDeleteModal();
    }
  };

  const NavButton = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
    const IconComponent = item.icon;

    // Hide admin-only items for vendors
    if (item.adminOnly && user.role !== 'ADMIN') {
      return null;
    }

    const button = (
      <UnstyledButton
        onClick={() => item.danger ? openDeleteModal() : handleNavigation(item.href)}
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          padding: collapsed ? '12px' : '12px 16px',
          borderRadius: 8,
          backgroundColor: isActive ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
          color: item.danger ? '#ef4444' : isActive ? '#3b82f6' : '#e2e8f0',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          if (!isActive && !item.danger) {
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
    <>
      <Stack 
        gap="xs" 
        p="md" 
        style={{ 
          height: '100%',
          backgroundColor: '#1e293b',
          borderRight: '1px solid #334155'
        }}
      >
        {/* Toggle Button */}
        <Group justify={collapsed ? 'center' : 'space-between'} mb="md">
          {!collapsed && (
            <Text fw={700} size="lg" c="white">
              Menu
            </Text>
          )}
          <ActionIcon
            variant="subtle"
            onClick={onToggleCollapse}
            size="sm"
            style={{ color: 'white' }}
          >
            <Menu size={16} />
          </ActionIcon>
        </Group>

        {/* Navigation Items */}
        <Stack gap={4} style={{ flex: 1 }}>
          {navItems.map((item) => (
            <NavButton key={item.href} item={item} />
          ))}
        </Stack>

        {/* Bottom Actions */}
        <Box>
          <Divider mb="md" color="#334155" />
          
          {/* Logout */}
          <UnstyledButton
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              padding: collapsed ? '12px' : '12px 16px',
              borderRadius: 8,
              backgroundColor: 'transparent',
              color: '#e2e8f0',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(148, 163, 184, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Group gap={collapsed ? 0 : 'sm'} justify={collapsed ? 'center' : 'flex-start'}>
              <LogOut size={20} />
              {!collapsed && (
                <Text size="sm" fw={400} c="inherit">
                  Déconnexion
                </Text>
              )}
            </Group>
          </UnstyledButton>
          
          {/* Delete Account */}
          <NavButton item={{ label: 'Supprimer le compte', icon: Trash2, href: '#', danger: true }} />
        </Box>
      </Stack>

      {/* Delete Account Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title="Supprimer le compte"
        centered
        size="md"
      >
        <Alert
          icon={<AlertTriangle size={16} />}
          title="Action irréversible"
          color="red"
          mb="md"
        >
          Cette action est définitive et ne peut pas être annulée. Toutes vos données seront supprimées.
        </Alert>

        <Stack gap="md">
          <TextInput
            label="Confirmez votre email"
            placeholder={user.email}
            value={deleteConfirmEmail}
            onChange={(e) => setDeleteConfirmEmail(e.target.value)}
            error={deleteConfirmEmail && deleteConfirmEmail !== user.email ? 'Email incorrect' : null}
          />

          <TextInput
            label="Tapez SUPPRIMER pour confirmer"
            placeholder="SUPPRIMER"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            error={deleteConfirmText && deleteConfirmText !== 'SUPPRIMER' ? 'Tapez exactement SUPPRIMER' : null}
          />

          <Group justify="flex-end" gap="sm">
            <Button variant="outline" onClick={closeDeleteModal}>
              Annuler
            </Button>
            <Button
              color="red"
              onClick={handleDeleteAccount}
              loading={isDeleting}
              disabled={deleteConfirmEmail !== user.email || deleteConfirmText !== 'SUPPRIMER'}
            >
              Supprimer définitivement
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}