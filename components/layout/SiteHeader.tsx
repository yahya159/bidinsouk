'use client';

import { useState } from 'react';
import {
  Container,
  Group,
  Button,
  ActionIcon,
  Menu,
  Modal,
  Text,
  Anchor,
  Box,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useUserCounts } from '@/hooks/useUserCounts';

import {
  Globe,
  Truck,
  ShieldCheck,
  UserRound,
  LogIn,
  Heart,
  Bell,
  MessageCircle,
  ShoppingCart,
  MoreHorizontal,
  Settings,
  LogOut,
} from 'lucide-react';
import Link from 'next/link';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { SearchBar } from '@/components/shared/SearchBar';

export function SiteHeader() {
  const { data: session } = useSession();
  const router = useRouter();
  const { counts: userCounts } = useUserCounts();
  
  // Simple fallback for translations
  const t = (key: string) => {
    const translations: Record<string, string> = {
      'common.searchPlaceholder': 'Rechercher des produits...'
    };
    return translations[key] || key;
  };
  
  const [adminModalOpened, { open: openAdminModal, close: closeAdminModal }] = useDisclosure(false);
  
  const handleAdminClick = () => {
    if (session?.user?.role === 'VENDOR' || session?.user?.role === 'ADMIN') {
      router.push('/workspace/dashboard');
    } else {
      openAdminModal();
    }
  };

  const handleBecomeVendor = () => {
    closeAdminModal();
    router.push('/vendors/apply?reason=workspace&message=Vous devez devenir vendeur pour accéder à cet espace.');
  };

  return (
    <>
      <header style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: 'white', borderBottom: '1px solid rgba(0,0,0,0.08)', overflow: 'visible' }}>
        {/* Top Utility Bar */}
        <Box style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <Container size="xl" py={8}>
            <Group justify="space-between" gap="md">
              {/* Left side */}
              <Group gap="lg">
                <Group gap="xs">
                  <Globe size={14} />
                  <Text size="sm" c="dimmed">Maroc</Text>
                </Group>
                <Group gap="xs">
                  <Truck size={14} />
                  <Text size="sm" c="dimmed">Livraison gratuite</Text>
                </Group>
                <Group gap="xs">
                  <ShieldCheck size={14} />
                  <Text size="sm" c="dimmed">Paiement sécurisé</Text>
                </Group>
              </Group>

              {/* Right side */}
              <Group gap="md">
                {!session ? (
                  <Group gap="sm">
                    <Button
                      variant="subtle"
                      size="xs"
                      leftSection={<LogIn size={14} />}
                      component={Link}
                      href="/login"
                    >
                      Se connecter
                    </Button>
                    <Button
                      size="xs"
                      component={Link}
                      href="/register"
                    >
                      S'inscrire
                    </Button>
                  </Group>
                ) : (
                  <Group gap="xs">
                    <UserRound size={14} />
                    <Text size="sm">{session.user.name}</Text>
                  </Group>
                )}
                
                <LanguageSwitcher />

                <Text size="sm" fw={500}>MAD</Text>
              </Group>
            </Group>
          </Container>
        </Box>

        {/* Main Navigation */}
        <Container size="xl" py="md" style={{ overflow: 'visible' }}>
          <Group justify="space-between" gap="xl" style={{ overflow: 'visible' }}>
            {/* Logo */}
            <Anchor
              component={Link}
              href="/"
              style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                color: '#228be6',
                textDecoration: 'none',
              }}
            >
              Bidinsouk
            </Anchor>

            {/* Search Bar */}
            <SearchBar placeholder={t('common.searchPlaceholder') || 'Rechercher des produits, enchères, boutiques...'} />

            {/* Quick Links */}
            <Group gap="sm" style={{ overflow: 'visible' }}>

              <Menu 
                shadow="lg" 
                width={260} 
                position="bottom-end"
                offset={8}
                withArrow={false}
                withinPortal
                transitionProps={{ transition: 'scale-y', duration: 150 }}
                styles={{
                  dropdown: {
                    zIndex: 1000,
                    borderRadius: '12px',
                    border: '1px solid rgba(0,0,0,0.08)',
                    padding: '8px',
                  }
                }}
              >
                <Menu.Target>
                  <Tooltip label="Plus d'options" position="bottom">
                    <ActionIcon 
                      variant="subtle" 
                      size="lg"
                      style={{ position: 'relative' }}
                      aria-label="Options du menu"
                    >
                      <MoreHorizontal size={20} />
                    </ActionIcon>
                  </Tooltip>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label style={{ fontSize: '12px', color: '#868e96', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Actions rapides
                  </Menu.Label>
                  
                  <Menu.Item 
                    component={Link} 
                    href="/watchlist"
                    leftSection={<Heart size={16} />}
                    rightSection={
                      userCounts.favorites > 0 ? (
                        <Box
                          style={{
                            backgroundColor: '#fa5252',
                            color: 'white',
                            borderRadius: '10px',
                            padding: '2px 6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            minWidth: '18px',
                            textAlign: 'center',
                          }}
                        >
                          {userCounts.favorites}
                        </Box>
                      ) : null
                    }
                    style={{ borderRadius: '8px', padding: '10px 12px' }}
                  >
                    Mes favoris
                  </Menu.Item>
                  
                  <Menu.Item 
                    component={Link} 
                    href="/notifications"
                    leftSection={<Bell size={16} />}
                    rightSection={
                      userCounts.notifications > 0 ? (
                        <Box
                          style={{
                            backgroundColor: '#fa5252',
                            color: 'white',
                            borderRadius: '10px',
                            padding: '2px 6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            minWidth: '18px',
                            textAlign: 'center',
                          }}
                        >
                          {userCounts.notifications}
                        </Box>
                      ) : null
                    }
                    style={{ borderRadius: '8px', padding: '10px 12px' }}
                  >
                    Notifications
                  </Menu.Item>
                  
                  <Menu.Item 
                    component={Link} 
                    href="/messages"
                    leftSection={<MessageCircle size={16} />}
                    rightSection={
                      userCounts.totalMessages > 0 ? (
                        <Box
                          style={{
                            backgroundColor: '#fa5252',
                            color: 'white',
                            borderRadius: '10px',
                            padding: '2px 6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            minWidth: '18px',
                            textAlign: 'center',
                          }}
                        >
                          {userCounts.totalMessages}
                        </Box>
                      ) : null
                    }
                    style={{ borderRadius: '8px', padding: '10px 12px' }}
                  >
                    Messages
                  </Menu.Item>
                  
                  <Menu.Item 
                    component={Link} 
                    href="/cart"
                    leftSection={<ShoppingCart size={16} />}
                    rightSection={
                      userCounts.cart > 0 ? (
                        <Box
                          style={{
                            backgroundColor: '#fa5252',
                            color: 'white',
                            borderRadius: '10px',
                            padding: '2px 6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            minWidth: '18px',
                            textAlign: 'center',
                          }}
                        >
                          {userCounts.cart}
                        </Box>
                      ) : null
                    }
                    style={{ borderRadius: '8px', padding: '10px 12px' }}
                  >
                    Panier
                  </Menu.Item>
                  
                  <Menu.Divider style={{ margin: '8px 0' }} />
                  
                  <Menu.Label style={{ fontSize: '12px', color: '#868e96', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Mon compte
                  </Menu.Label>
                  
                  <Menu.Item 
                    component={Link} 
                    href="/profile"
                    leftSection={<UserRound size={16} />}
                    style={{ borderRadius: '8px', padding: '10px 12px' }}
                  >
                    Mon profil
                  </Menu.Item>
                  
                  <Menu.Item 
                    component={Link} 
                    href="/orders"
                    leftSection={<ShoppingCart size={16} />}
                    style={{ borderRadius: '8px', padding: '10px 12px' }}
                  >
                    Mes commandes
                  </Menu.Item>
                  
                  <Menu.Item 
                    component={Link} 
                    href="/settings"
                    leftSection={<Settings size={16} />}
                    style={{ borderRadius: '8px', padding: '10px 12px' }}
                  >
                    Paramètres
                  </Menu.Item>
                  
                  {session && (
                    <>
                      <Menu.Divider style={{ margin: '8px 0' }} />
                      <Menu.Item 
                        onClick={() => signOut({ callbackUrl: '/' })}
                        leftSection={<LogOut size={16} />}
                        color="red"
                        style={{ borderRadius: '8px', padding: '10px 12px' }}
                      >
                        Déconnexion
                      </Menu.Item>
                    </>
                  )}
                </Menu.Dropdown>
              </Menu>

              {/* Only show for vendors and admins */}
              {(session?.user?.role === 'VENDOR' || session?.user?.role === 'ADMIN') ? (
                <Button
                  gradient={{ from: 'orange', to: 'red' }}
                  size="md"
                  radius="md"
                  component={Link}
                  href="/auctions/create"
                  style={{
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(255, 107, 0, 0.3)',
                    },
                  }}
                >
                  Déposer une enchère
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="md"
                  radius="md"
                  onClick={() => router.push('/vendors/apply')}
                  style={{
                    transition: 'all 0.2s ease',
                  }}
                >
                  Devenir Vendeur
                </Button>
              )}
            </Group>
          </Group>
        </Container>

        {/* Menu Links Row */}
        <Box style={{ borderTop: '1px solid rgba(0,0,0,0.05)', backgroundColor: '#fafbfc' }}>
          <Container size="xl" py="sm">
            <Group justify="center" gap="xl">
              <Anchor component={Link} href="/products" size="sm" fw={500}>
                Tous les produits
              </Anchor>
              <Anchor component={Link} href="/auctions" size="sm" fw={500}>
                Toutes les Enchères
              </Anchor>
              <Anchor component={Link} href="/auctions?status=live" size="sm" fw={500}>
                Les Enchères en Direct
              </Anchor>
              <Anchor
                component="button"
                onClick={handleAdminClick}
                size="sm"
                fw={500}
                style={{ border: 'none', background: 'none', cursor: 'pointer' }}
              >
                Administration de Boutique
              </Anchor>
              <Anchor component={Link} href="/vendors/apply" size="sm" fw={500}>
                Devenir Vendeur
              </Anchor>
              <Anchor component={Link} href="/auctions?status=ended" size="sm" fw={500}>
                Enchères expirées
              </Anchor>
            </Group>
          </Container>
        </Box>
      </header>

      {/* Admin Access Modal */}
      <Modal
        opened={adminModalOpened}
        onClose={closeAdminModal}
        title="Accès Administration"
        centered
        radius="md"
      >
        <Text mb="md">
          Vous devez devenir vendeur pour accéder à l'administration de boutique.
        </Text>
        <Group justify="flex-end" gap="sm">
          <Button variant="outline" onClick={closeAdminModal}>
            Annuler
          </Button>
          <Button onClick={handleBecomeVendor}>
            Devenir Vendeur
          </Button>
        </Group>
      </Modal>
    </>
  );
}