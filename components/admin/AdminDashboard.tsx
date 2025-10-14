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
  Alert,
  Divider,
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
  IconTrendingUp,
  IconReceipt,
  IconAlertTriangle,
  IconRefresh,
  IconClock,
  IconShoppingBag,
  IconUserPlus,
} from '@tabler/icons-react';
import { LineChart } from '@mantine/charts';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'CLIENT' | 'VENDOR' | 'ADMIN';
  avatarUrl?: string;
}

interface PlatformStats {
  totalUsers: number;
  totalVendors: number;
  totalProducts: number;
  activeAuctions: number;
  endedAuctions: number; // Ajouté pour le calcul du taux de conversion
  totalOrders: number;
  totalRevenue: number;
  pendingReports: number;
}

// Interface pour les données historiques des graphiques
interface HistoricalDataPoint {
  date: string;
  revenue: number;
  orders: number;
  auctions: number;
  users: number;
}

// Interface pour l'activité récente
interface RecentActivityItem {
  id: string;
  type: 'order' | 'auction' | 'user';
  title: string;
  description: string;
  timeAgo: string;
  createdAt: Date;
}

interface AdminDashboardProps {
  user: User;
}

export function AdminDashboard({ user }: AdminDashboardProps) {
  const router = useRouter();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Récupérer les statistiques dynamiquement
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/stats?days=30', {
        headers: {
          'x-user-role': 'ADMIN',
          'x-user-id': user.id,
        },
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des statistiques');
      }
      
      const data = await response.json();
      setStats(data.stats);
      setLastUpdated(new Date());
      
      // Utiliser les données historiques de l'API
      if (data.historical && Array.isArray(data.historical)) {
        setHistoricalData(data.historical);
      }
      
      // Utiliser les données d'activité récente de l'API
      if (data.recentActivity && Array.isArray(data.recentActivity)) {
        setRecentActivity(data.recentActivity);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  // Rafraîchissement automatique toutes les 30 secondes
  useEffect(() => {
    // Charger les données initiales
    fetchStats();
    
    // Configurer le rafraîchissement automatique
    const interval = setInterval(() => {
      fetchStats();
    }, 30000); // 30 secondes
    
    // Nettoyer l'intervalle lors du démontage du composant
    return () => clearInterval(interval);
  }, [fetchStats]);

  // Calculer le taux de conversion (commandes / enchères terminées)
  const calculateConversionRate = () => {
    if (!stats) return 0;
    
    // Utiliser le nombre exact d'enchères terminées pour un calcul plus précis
    const totalAuctions = stats.endedAuctions > 0 ? stats.endedAuctions : 1;
    return Math.round((stats.totalOrders / totalAuctions) * 100);
  };

  // Vérifier s'il y a des alertes critiques
  const hasCriticalAlerts = () => {
    if (!stats) return false;
    
    // Alertes : taux de conversion bas, beaucoup de signalements en attente
    const conversionRate = calculateConversionRate();
    return conversionRate < 5 || stats.pendingReports > 10;
  };

  // Obtenir l'icône appropriée pour chaque type d'activité
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <IconShoppingBag size={16} />;
      case 'auction':
        return <IconHammer size={16} />;
      case 'user':
        return <IconUserPlus size={16} />;
      default:
        return <IconClock size={16} />;
    }
  };

  // Obtenir la couleur appropriée pour chaque type d'activité
  const getActivityColor = (type: string) => {
    switch (type) {
      case 'order':
        return 'blue';
      case 'auction':
        return 'orange';
      case 'user':
        return 'green';
      default:
        return 'gray';
    }
  };

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
          
          {/* Dernière mise à jour et bouton de rafraîchissement */}
          <Group justify="space-between" mb="md">
            <Text size="sm" c="dimmed">
              Dernière mise à jour : {lastUpdated ? lastUpdated.toLocaleTimeString('fr-FR') : 'Jamais'}
            </Text>
            <Button 
              leftSection={<IconRefresh size={16} />} 
              variant="outline" 
              size="xs"
              onClick={fetchStats}
              disabled={loading}
            >
              Rafraîchir
            </Button>
          </Group>
        </div>

        {/* Alertes critiques */}
        {hasCriticalAlerts() && stats && (
          <Alert 
            icon={<IconAlertTriangle size={16} />} 
            title="Alertes système" 
            color="red"
          >
            {calculateConversionRate() < 5 && (
              <Text size="sm">
                ⚠️ Taux de conversion bas : {calculateConversionRate()}% (objectif: {'>'}5%)
              </Text>
            )}
            {stats.pendingReports > 10 && (
              <Text size="sm">
                ⚠️ {stats.pendingReports} signalements en attente de traitement
              </Text>
            )}
          </Alert>
        )}

        {/* Platform Stats - Focus sur les indicateurs clés */}
        <div>
          <Title order={2} mb="md">
            Indicateurs Clés de Performance
          </Title>
          
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
          ) : stats ? (
            <>
              <Grid>
                {/* Chiffre d'affaires */}
                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                  <Card shadow="sm" padding="lg" radius="md" style={{ borderLeft: '4px solid #228be6' }}>
                    <Group justify="space-between">
                      <div>
                        <Text size="sm" c="dimmed" tt="uppercase" fw={700}>
                          Chiffre d'affaires
                        </Text>
                        <Text size="xl" fw={700} c="blue">
                          {new Intl.NumberFormat('fr-FR', { 
                            style: 'currency', 
                            currency: 'MAD' 
                          }).format(stats.totalRevenue)}
                        </Text>
                      </div>
                      <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                        <IconReceipt size={20} />
                      </ThemeIcon>
                    </Group>
                  </Card>
                </Grid.Col>
                
                {/* Commandes */}
                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                  <Card shadow="sm" padding="lg" radius="md" style={{ borderLeft: '4px solid #40c057' }}>
                    <Group justify="space-between">
                      <div>
                        <Text size="sm" c="dimmed" tt="uppercase" fw={700}>
                          Commandes
                        </Text>
                        <Text size="xl" fw={700} c="green">
                          {new Intl.NumberFormat('fr-FR').format(stats.totalOrders)}
                        </Text>
                      </div>
                      <ThemeIcon size="lg" radius="md" variant="light" color="green">
                        <IconShoppingCart size={20} />
                      </ThemeIcon>
                    </Group>
                  </Card>
                </Grid.Col>
                
                {/* Enchères actives */}
                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                  <Card shadow="sm" padding="lg" radius="md" style={{ borderLeft: '4px solid #fa5252' }}>
                    <Group justify="space-between">
                      <div>
                        <Text size="sm" c="dimmed" tt="uppercase" fw={700}>
                          Enchères actives
                        </Text>
                        <Text size="xl" fw={700} c="red">
                          {new Intl.NumberFormat('fr-FR').format(stats.activeAuctions)}
                        </Text>
                      </div>
                      <ThemeIcon size="lg" radius="md" variant="light" color="red">
                        <IconHammer size={20} />
                      </ThemeIcon>
                    </Group>
                  </Card>
                </Grid.Col>
                
                {/* Taux de conversion */}
                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                  <Card shadow="sm" padding="lg" radius="md" style={{ borderLeft: '4px solid #f783ac' }}>
                    <Group justify="space-between">
                      <div>
                        <Text size="sm" c="dimmed" tt="uppercase" fw={700}>
                          Taux de conversion
                        </Text>
                        <Text size="xl" fw={700} c="pink">
                          {calculateConversionRate()}%
                        </Text>
                      </div>
                      <ThemeIcon size="lg" radius="md" variant="light" color="pink">
                        <IconTrendingUp size={20} />
                      </ThemeIcon>
                    </Group>
                  </Card>
                </Grid.Col>
                
                {/* Statistiques supplémentaires */}
                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                  <Card shadow="sm" padding="lg" radius="md">
                    <Group justify="space-between">
                      <div>
                        <Text size="sm" c="dimmed" tt="uppercase" fw={700}>
                          Utilisateurs totaux
                        </Text>
                        <Text size="xl" fw={700}>
                          {new Intl.NumberFormat('fr-FR').format(stats.totalUsers)}
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
                          {new Intl.NumberFormat('fr-FR').format(stats.totalVendors)}
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
                          {new Intl.NumberFormat('fr-FR').format(stats.totalProducts)}
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
                          Signalements en attente
                        </Text>
                        <Text size="xl" fw={700}>
                          {new Intl.NumberFormat('fr-FR').format(stats.pendingReports)}
                        </Text>
                      </div>
                      <ThemeIcon size="lg" radius="md" variant="light" color="red">
                        <IconFlag size={20} />
                      </ThemeIcon>
                    </Group>
                  </Card>
                </Grid.Col>
              </Grid>
              
              {/* Graphiques */}
              {historicalData.length > 1 && (
                <Card shadow="sm" padding="lg" radius="md" mt="xl">
                  <Title order={3} mb="md">
                    Évolution des indicateurs (30 derniers jours)
                  </Title>
                  <LineChart
                    h={300}
                    data={historicalData}
                    dataKey="date"
                    series={[
                      { name: 'revenue', label: 'Chiffre d\'affaires (MAD)', color: 'blue.6' },
                      { name: 'orders', label: 'Commandes', color: 'green.6' },
                      { name: 'auctions', label: 'Enchères', color: 'red.6' },
                      { name: 'users', label: 'Utilisateurs', color: 'orange.6' },
                    ]}
                    curveType="linear"
                    withLegend
                    tickLine="y"
                  />
                </Card>
              )}
              
              {/* Graphique des utilisateurs */}
              {historicalData.length > 1 && (
                <Card shadow="sm" padding="lg" radius="md" mt="xl">
                  <Title order={3} mb="md">
                    Croissance des utilisateurs (30 derniers jours)
                  </Title>
                  <LineChart
                    h={300}
                    data={historicalData}
                    dataKey="date"
                    series={[
                      { name: 'users', label: 'Nouveaux utilisateurs', color: 'indigo.6' },
                    ]}
                    curveType="linear"
                    withLegend
                    tickLine="y"
                  />
                </Card>
              )}
            </>
          ) : null}
        </div>

        {/* Activité récente */}
        <div>
          <Title order={2} mb="md">
            Activité récente
          </Title>
          <Card shadow="sm" padding="lg" radius="md">
            {loading ? (
              <Group justify="center" py="xl">
                <Loader />
                <Text>Chargement de l'activité récente...</Text>
              </Group>
            ) : error ? (
              <Text c="red">Erreur lors du chargement de l'activité récente</Text>
            ) : recentActivity.length > 0 ? (
              <Stack gap={0}>
                {recentActivity.map((activity, index) => (
                  <div key={activity.id}>
                    <Group justify="space-between" py="sm">
                      <Group gap="sm">
                        <ThemeIcon size="md" radius="md" variant="light" color={getActivityColor(activity.type)}>
                          {getActivityIcon(activity.type)}
                        </ThemeIcon>
                        <div>
                          <Text fw={500}>{activity.title}</Text>
                          <Text size="sm" c="dimmed">{activity.description}</Text>
                        </div>
                      </Group>
                      <Text size="sm" c="dimmed">{activity.timeAgo}</Text>
                    </Group>
                    {index < recentActivity.length - 1 && <Divider />}
                  </div>
                ))}
              </Stack>
            ) : (
              <Text c="dimmed" ta="center" py="xl">
                Aucune activité récente
              </Text>
            )}
          </Card>
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