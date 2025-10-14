'use client';

import {
  Container,
  Title,
  Text,
  Card,
  Grid,
  Group,
  Stack,
  Button,
  Badge,
  ThemeIcon,
  Loader,
} from '@mantine/core';
import {
  IconShoppingCart,
  IconHeart,
  IconEye,
  IconStar,
  IconHammer,
  IconPackage,
  IconBell,
  IconSettings,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useClientStats } from '@/hooks/useClientStats';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'CLIENT' | 'VENDOR' | 'ADMIN';
  avatarUrl?: string;
}

interface ClientDashboardProps {
  user: User;
}

export function ClientDashboard({ user }: ClientDashboardProps) {
  const router = useRouter();
  const { stats, loading, error } = useClientStats();

  const quickActions = [
    {
      title: 'Mes Commandes',
      description: 'Voir toutes mes commandes',
      icon: IconShoppingCart,
      color: 'blue',
      href: '/orders',
    },
    {
      title: 'Ma Watchlist',
      description: 'Produits que je surveille',
      icon: IconHeart,
      color: 'red',
      href: '/watchlist',
    },
    {
      title: 'Mes Enchères',
      description: 'Enchères auxquelles je participe',
      icon: IconHammer,
      color: 'orange',
      href: '/auctions/my-bids',
    },
    {
      title: 'Mes Avis',
      description: 'Avis que j\'ai laissés',
      icon: IconStar,
      color: 'yellow',
      href: '/reviews/my-reviews',
    },
    {
      title: 'Notifications',
      description: 'Mes notifications',
      icon: IconBell,
      color: 'green',
      href: '/notifications',
    },
    {
      title: 'Paramètres',
      description: 'Gérer mon profil',
      icon: IconSettings,
      color: 'gray',
      href: '/profile',
    },
  ];

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Welcome Section */}
        <div>
          <Group justify="space-between" mb="md">
            <div>
              <Title order={1}>
                Bonjour, {user.name}! 👋
              </Title>
              <Text c="dimmed" size="lg">
                Bienvenue sur votre tableau de bord client
              </Text>
            </div>
            <Badge size="lg" variant="light" color="blue">
              {user.role}
            </Badge>
          </Group>
        </div>

        {/* Quick Stats */}
        {loading ? (
          <Group justify="center" py="xl">
            <Loader />
            <Text>Chargement des statistiques...</Text>
          </Group>
        ) : error ? (
          <Card shadow="sm" padding="lg" radius="md" bg="red.0">
            <Text c="red" fw={500}>
              {error}
            </Text>
          </Card>
        ) : (
          <Grid>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card shadow="sm" padding="lg" radius="md">
                <Group justify="space-between">
                  <div>
                    <Text size="sm" c="dimmed" tt="uppercase" fw={700}>
                      Commandes
                    </Text>
                    <Text size="xl" fw={700}>
                      {new Intl.NumberFormat('fr-FR').format(stats.orders)}
                    </Text>
                  </div>
                  <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                    <IconShoppingCart size={20} />
                  </ThemeIcon>
                </Group>
              </Card>
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card shadow="sm" padding="lg" radius="md">
                <Group justify="space-between">
                  <div>
                    <Text size="sm" c="dimmed" tt="uppercase" fw={700}>
                      Watchlist
                    </Text>
                    <Text size="xl" fw={700}>
                      {new Intl.NumberFormat('fr-FR').format(stats.watchlist)}
                    </Text>
                  </div>
                  <ThemeIcon size="lg" radius="md" variant="light" color="red">
                    <IconHeart size={20} />
                  </ThemeIcon>
                </Group>
              </Card>
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card shadow="sm" padding="lg" radius="md">
                <Group justify="space-between">
                  <div>
                    <Text size="sm" c="dimmed" tt="uppercase" fw={700}>
                      Enchères actives
                    </Text>
                    <Text size="xl" fw={700}>
                      {new Intl.NumberFormat('fr-FR').format(stats.activeAuctions)}
                    </Text>
                  </div>
                  <ThemeIcon size="lg" radius="md" variant="light" color="orange">
                    <IconHammer size={20} />
                  </ThemeIcon>
                </Group>
              </Card>
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card shadow="sm" padding="lg" radius="md">
                <Group justify="space-between">
                  <div>
                    <Text size="sm" c="dimmed" tt="uppercase" fw={700}>
                      Avis donnés
                    </Text>
                    <Text size="xl" fw={700}>
                      {new Intl.NumberFormat('fr-FR').format(stats.reviews)}
                    </Text>
                  </div>
                  <ThemeIcon size="lg" radius="md" variant="light" color="yellow">
                    <IconStar size={20} />
                  </ThemeIcon>
                </Group>
              </Card>
            </Grid.Col>
          </Grid>
        )}

        {/* Quick Actions */}
        <div>
          <Title order={2} mb="md">
            Actions rapides
          </Title>
          <Grid>
            {quickActions.map((action) => (
              <Grid.Col key={action.title} span={{ base: 12, sm: 6, md: 4 }}>
                <Card
                  shadow="sm"
                  padding="lg"
                  radius="md"
                  style={{ cursor: 'pointer', height: '100%' }}
                  onClick={() => router.push(action.href)}
                >
                  <Group gap="md">
                    <ThemeIcon size="xl" radius="md" variant="light" color={action.color}>
                      <action.icon size={24} />
                    </ThemeIcon>
                    <div style={{ flex: 1 }}>
                      <Text fw={600} size="sm">
                        {action.title}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {action.description}
                      </Text>
                    </div>
                  </Group>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        </div>

        {/* Become Vendor CTA */}
        <Card shadow="sm" padding="xl" radius="md" style={{ background: 'linear-gradient(45deg, #228be6, #339af0)' }}>
          <Group justify="space-between" align="center">
            <div>
              <Title order={3} c="white" mb="xs">
                Envie de vendre sur Bidinsouk ?
              </Title>
              <Text c="white" opacity={0.9}>
                Rejoignez notre communauté de vendeurs et commencez à vendre vos produits dès aujourd'hui.
              </Text>
            </div>
            <Button
              size="lg"
              variant="white"
              color="blue"
              onClick={() => router.push('/vendors/apply')}
            >
              Devenir Vendeur
            </Button>
          </Group>
        </Card>
      </Stack>
    </Container>
  );
}