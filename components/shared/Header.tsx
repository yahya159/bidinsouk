'use client';

import { TextInput, Container, Group, Button, Anchor, ActionIcon, Avatar, Badge, Select, Menu, Burger, Collapse, Indicator } from '@mantine/core';
import { IconSearch, IconHeart, IconShoppingCart, IconBell, IconUser, IconLanguage, IconCurrencyDollar, IconChevronDown } from '@tabler/icons-react';
import { AuthStatus } from './AuthStatus';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function Header() {
  const [mobileMenuOpened, setMobileMenuOpened] = useState(false);
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const { data: session, status } = useSession();

  // Fetch counts for watchlist, notifications, and cart
  useEffect(() => {
    if (status === 'authenticated') {
      // Fetch watchlist count
      fetch('/api/watchlist/count')
        .then(res => res.json())
        .then(data => {
          if (data.count !== undefined) {
            setWatchlistCount(data.count);
          }
        })
        .catch(err => console.error('Failed to fetch watchlist count:', err));

      // Fetch notification count
      fetch('/api/notifications/unread-count')
        .then(res => res.json())
        .then(data => {
          if (data.count !== undefined) {
            setNotificationCount(data.count);
          }
        })
        .catch(err => console.error('Failed to fetch notifications count:', err));

      // Fetch cart count
      fetch('/api/cart/count')
        .then(res => res.json())
        .then(data => {
          if (data.count !== undefined) {
            setCartCount(data.count);
          }
        })
        .catch(err => console.error('Failed to fetch cart count:', err));
    }
  }, [status]);

  return (
    <header style={{ borderBottom: '1px solid #e9ecef', backgroundColor: 'white' }}>
      {/* Topbar - Display contact information, language selector, currency selector, user account links */}
      <div style={{ backgroundColor: '#f1f3f5', fontSize: '0.75rem', color: '#495057' }}>
        <Container size="xl" style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Group gap="md" visibleFrom="sm">
            <span>📞 +212 6 12 34 56 78</span>
            <span>✉️ support@bidinsouk.com</span>
          </Group>
          <Group gap="md">
            {/* Language selector dropdown */}
            <Select
              data={['Français', 'العربية', 'English']}
              defaultValue="Français"
              size="xs"
              rightSection={<IconChevronDown size={14} />}
              styles={{ input: { height: 24, paddingLeft: 8, paddingRight: 8 } }}
              withCheckIcon={false}
            />
            {/* Currency selector */}
            <Select
              data={['MAD', 'EUR', 'USD']}
              defaultValue="MAD"
              size="xs"
              rightSection={<IconCurrencyDollar size={14} />}
              styles={{ input: { height: 24, paddingLeft: 8, paddingRight: 8 } }}
              withCheckIcon={false}
            />
            <AuthStatus />
          </Group>
        </Container>
      </div>

      <Container size="xl">
        {/* Main navigation with Logo, Search, and Actions */}
        <Group h={64} gap="md" wrap="nowrap" justify="space-between">
          <Group gap="md">
            {/* Logo linking to homepage */}
            <Anchor href="/" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1c7ed6', textDecoration: 'none', whiteSpace: 'nowrap' }}>
              Bidinsouk
            </Anchor>
            
            {/* Mobile menu toggle */}
            <Burger 
              opened={mobileMenuOpened} 
              onClick={() => setMobileMenuOpened(!mobileMenuOpened)} 
              size="sm" 
              hiddenFrom="md" 
            />
          </Group>

          {/* Search bar with autocomplete suggestions */}
          <div style={{ flex: 1, maxWidth: 720 }}>
            <TextInput
              placeholder="Rechercher des articles, catégories, vendeurs..."
              leftSection={<IconSearch size={18} />}
              radius="xl"
              size="md"
            />
          </div>

          <Group gap="sm">
            {/* User favorites icon with badge */}
            <Indicator label={watchlistCount > 0 ? watchlistCount : null} size={16} color="red">
              <ActionIcon variant="subtle" size="lg" component="a" href="/watchlist">
                <IconHeart />
              </ActionIcon>
            </Indicator>
            
            {/* Notifications icon with badge */}
            <Indicator label={notificationCount > 0 ? notificationCount : null} size={16} color="red">
              <ActionIcon variant="subtle" size="lg" component="a" href="/notifications">
                <IconBell />
              </ActionIcon>
            </Indicator>
            
            {/* Shopping cart icon with badge */}
            <Indicator label={cartCount > 0 ? cartCount : null} size={16} color="red">
              <ActionIcon variant="light" size="lg" component="a" href="/cart">
                <IconShoppingCart />
              </ActionIcon>
            </Indicator>
            
            {/* Sell now button */}
            <Button component="a" href="/auctions" color="orange" size="sm">
              Déposer une enchère
            </Button>
          </Group>
        </Group>

        {/* Main navigation menu */}
        <Group gap="xl" pb="sm" justify="space-between" visibleFrom="md">
          <Group gap="lg">
            {/* Categories dropdown with all category links */}
            <Menu trigger="hover" openDelay={100} closeDelay={400}>
              <Menu.Target>
                <Anchor href="#" size="sm">Catégories <IconChevronDown size={14} style={{ display: 'inline' }} /></Anchor>
              </Menu.Target>
              <Menu.Dropdown>
                {['Auto','Téléphones','Femmes','Vins','Chaussures','Livres','Vêtements','Bébé','Maison','Montres','Sport','Art'].map((c) => (
                  <Menu.Item key={c}>{c}</Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>
            
            <Anchor href="/" size="sm">Toutes les enchères</Anchor>
            <Anchor href="/auctions" size="sm">Les enchères en direct</Anchor>
            <Anchor href="/products" size="sm">Administration de Boutique</Anchor>
            <Anchor href="/vendors/apply" size="sm">Devenir Vendeur</Anchor>
            <Anchor href="/orders" size="sm">Enchères expirées</Anchor>
          </Group>
          <Group gap="xs" visibleFrom="md">
            {['Auto','Téléphones','Femmes','Vins','Chaussures','Livres','Vêtements','Bébé','Maison','Montres','Sport','Art'].map((c) => (
              <Badge key={c} variant="light" color="gray" size="sm" radius="xl">{c}</Badge>
            ))}
          </Group>
        </Group>
        
        {/* Mobile responsive hamburger menu */}
        <Collapse in={mobileMenuOpened} hiddenFrom="md">
          <div style={{ padding: '1rem 0' }}>
            <Group gap="sm" mb="md">
              <TextInput
                placeholder="Rechercher..."
                leftSection={<IconSearch size={16} />}
                radius="xl"
                size="sm"
                style={{ flex: 1 }}
              />
              <Button color="orange" size="sm">Déposer une enchère</Button>
            </Group>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Anchor href="/" size="sm">Accueil</Anchor>
              <Anchor href="/auctions" size="sm">Toutes les enchères</Anchor>
              <Anchor href="/auctions" size="sm">Les enchères en direct</Anchor>
              <Anchor href="/products" size="sm">Administration de Boutique</Anchor>
              <Anchor href="/vendors/apply" size="sm">Devenir Vendeur</Anchor>
              <Anchor href="/orders" size="sm">Enchères expirées</Anchor>
              
              <Menu>
                <Menu.Target>
                  <Anchor href="#" size="sm">Catégories <IconChevronDown size={14} style={{ display: 'inline' }} /></Anchor>
                </Menu.Target>
                <Menu.Dropdown>
                  {['Auto','Téléphones','Femmes','Vins','Chaussures','Livres','Vêtements','Bébé','Maison','Montres','Sport','Art'].map((c) => (
                    <Menu.Item key={c}>{c}</Menu.Item>
                  ))}
                </Menu.Dropdown>
              </Menu>
            </div>
          </div>
        </Collapse>
      </Container>
    </header>
  )
}