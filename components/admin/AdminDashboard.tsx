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
} from '@mantine/core';
import {
  IconUsers,
  IconBuilding,
  IconPackage,
  IconHammer,
  IconShoppingCart,
  IconStar,
  IconFlag,
  IconChartBar,
  IconSettings,
  IconShield,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'CLIENT' | 'VENDOR' | 'ADMIN';
  avatarUrl?: string;
}

interface AdminDashboardProps {
  user: User;
}

export function AdminDashboard({ user }: AdminDashboardProps) {
  const router = useRouter();

  const adminActions = [
    {
      title: 'Gestion des Utilisateurs',
      description: 'Gérer tous les utilisateurs',
      icon: IconUsers,
      color: 'blue',
      href: '/admin/users',
    },
    {
      title: 'Gestion des Vendeurs',
      description: 'Approuver/gérer les vendeurs',
      icon: IconBuilding,
      color: 'green',
      href: '/admin/vendors',
    },
    {
      title: 'Modération Produits',
      description: 'Modérer les produits',
      icon: IconPackage,
      color: 'orange',
      href: '/admin/products',
    },
    {
      title: 'Modération Enchères',
      description: 'Gérer les enchères',
      icon: IconHammer,
      color: 'red',
      href: '/admin/auctions',
    },
    {
      title: 'Commandes',
      description: 'Voir toutes les commandes',
      icon: IconShoppingCart,
      color: 'purple',
      href: '/admin/orders',
    },
    {
      title: 'Avis & Commentaires',
      description: 'Modérer les avis',
      icon: IconStar,
      color: 'yellow',
      href: '/admin/reviews',
    },
    {
      title: 'Signalements',
      description: 'Gérer les signalements',
      icon: IconFlag,
      color: 'red',
      href: '/admin/reports',
    },
    {
      title: 'Statistiques',
      description: 'Voir les statistiques',
      icon: IconChartBar,
      color: 'teal',
      href: '/admin/stats',
    },
    {
      title: 'Paramètres Système',
      description: 'Configuration système',
      icon: IconSettings,
      color: 'gray',
      href: '/admin/settings',
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
                <Group gap="sm">
                  <IconShield size={32} color="var(--mantine-color-red-6)" />
                  Administration - {user.name}
                </Group>
              </Title>
              <Text c="dimmed" size="lg">
                Tableau de bord administrateur de Bidinsouk
              </Text>
            </div>
            <Badge size="lg" variant="light" color="red">
              {user.role}
            </Badge>
          </Group>
        </div>

        {/* Platform Stats */}
        <div>
          <Title order={2} mb="md">
            Statistiques de la plateforme
          </Title>
          <Grid>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card shadow="sm" padding="lg" radius="md">
                <Group justify="space-between">
                  <div>
                    <Text size="sm" c="dimmed" tt="uppercase" fw={700}>
                      Utilisateurs totaux
                    </Text>
                    <Text size="xl" fw={700}>
                      1,234
                    </Text>
                  </div>
                  <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                    <IconUsers size={20} />
                  </ThemeIcon>
                </Group>
              </Card>
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card shadow="sm" padding="lg" radius="md">
                <Group justify="space-between">
                  <div>
                    <Text size="sm" c="dimmed" tt="uppercase" fw={700}>
                      Vendeurs actifs
                    </Text>
                    <Text size="xl" fw={700}>
                      89
                    </Text>
                  </div>
                  <ThemeIcon size="lg" radius="md" variant="light" color="green">
                    <IconBuilding size={20} />
                  </ThemeIcon>
                </Group>
              </Card>
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card shadow="sm" padding="lg" radius="md">
                <Group justify="space-between">
                  <div>
                    <Text size="sm" c="dimmed" tt="uppercase" fw={700}>
                      Produits actifs
                    </Text>
                    <Text size="xl" fw={700}>
                      2,567
                    </Text>
                  </div>
                  <ThemeIcon size="lg" radius="md" variant="light" color="orange">
                    <IconPackage size={20} />
                  </ThemeIcon>
                </Group>
              </Card>
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card shadow="sm" padding="lg" radius="md">
                <Group justify="space-between">
                  <div>
                    <Text size="sm" c="dimmed" tt="uppercase" fw={700}>
                      Enchères en cours
                    </Text>
                    <Text size="xl" fw={700}>
                      156
                    </Text>
                  </div>
                  <ThemeIcon size="lg" radius="md" variant="light" color="red">
                    <IconHammer size={20} />
                  </ThemeIcon>
                </Group>
              </Card>
            </Grid.Col>
          </Grid>
        </div>

        {/* Admin Actions */}
        <div>
          <Title order={2} mb="md">
            Actions d'administration
          </Title>
          <Grid>
            {adminActions.map((action) => (
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

        {/* Quick Access to Vendor Dashboard */}
        <Card shadow="sm" padding="xl" radius="md" style={{ background: 'linear-gradient(45deg, #228be6, #339af0)' }}>
          <Group justify="space-between" align="center">
            <div>
              <Title order={3} c="white" mb="xs">
                Accès Vendeur
              </Title>
              <Text c="white" opacity={0.9}>
                En tant qu'admin, vous pouvez aussi accéder au tableau de bord vendeur pour tester les fonctionnalités.
              </Text>
            </div>
            <Button
              size="lg"
              variant="white"
              color="blue"
              onClick={() => router.push('/vendor-dashboard')}
            >
              Tableau de Bord Vendeur
            </Button>
          </Group>
        </Card>
      </Stack>
    </Container>
  );
}