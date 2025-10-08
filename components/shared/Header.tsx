'use client';

import { TextInput, Container, Group, Button, Anchor, ActionIcon, Avatar, Badge } from '@mantine/core';
import { IconSearch, IconHeart, IconShoppingCart, IconBell } from '@tabler/icons-react';

export default function Header() {
  return (
    <header style={{ borderBottom: '1px solid #e9ecef', backgroundColor: 'white' }}>
      <div style={{ backgroundColor: '#f1f3f5', fontSize: '0.75rem', color: '#495057' }}>
        <Container size="xl" style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Group gap="md">
            <span>Maroc</span>
            <span>Livraison gratuite</span>
            <span>Paiement sécurisé</span>
          </Group>
          <Group gap="md">
            <Anchor href="/login" size="xs" c="dimmed">Se connecter</Anchor>
            <Anchor href="/register" size="xs" c="dimmed">S'inscrire</Anchor>
          </Group>
        </Container>
      </div>

      <Container size="xl">
        <Group h={64} gap="md" wrap="nowrap" justify="space-between">
          <Anchor href="/" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1c7ed6', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Bidinsouk
          </Anchor>

          <div style={{ flex: 1, maxWidth: 720 }}>
            <TextInput
              placeholder="Rechercher des articles, catégories, vendeurs..."
              leftSection={<IconSearch size={18} />}
              radius="xl"
              size="md"
            />
          </div>

          <Group gap="sm">
            <ActionIcon variant="subtle" size="lg"><IconHeart /></ActionIcon>
            <ActionIcon variant="subtle" size="lg"><IconBell /></ActionIcon>
            <ActionIcon variant="light" size="lg"><IconShoppingCart /></ActionIcon>
            <Button component="a" href="/auctions" color="orange" size="sm">
              Déposer une enchère
            </Button>
          </Group>
        </Group>

        <Group gap="xl" pb="sm" justify="space-between">
          <Group gap="lg">
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
      </Container>
    </header>
  )
}