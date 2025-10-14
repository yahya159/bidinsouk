'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Title,
  Text,
  Card,
  Group,
  Stack,
  Button,
  SimpleGrid,
  Box,
  ActionIcon,
  Badge,
  Avatar,
  Divider,
  Loader,
  Center,
  Alert,
} from '@mantine/core';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Gavel,
  Target,
  Plus,
  Store,
  MessageSquare,
  Clock,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'CLIENT' | 'VENDOR' | 'ADMIN';
}

interface DashboardProps {
  user: User;
}

interface KPIData {
  revenue: number;
  revenueChange: number;
  orders: number;
  ordersChange: number;
  activeAuctions: number;
  auctionsChange: number;
  conversionRate: number;
  conversionChange: number;
}

interface ActivityItem {
  id: string;
  type: 'order' | 'bid' | 'review' | 'stock';
  title: string;
  description: string;
  time: string;
  icon: React.ReactNode;
  color: string;
}

interface DashboardData {
  metrics: KPIData;
  charts: {
    salesData: { name: string; value: number }[];
    categoryData: { name: string; value: number; color: string }[];
  };
  recentActivity: {
    orders: ActivityItem[];
    auctions: ActivityItem[];
  };
}

export function DashboardContent({ user }: DashboardProps) {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasStores, setHasStores] = useState(true); // New state to track if vendor has stores

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Use different API endpoints based on user role
        let apiUrl;
        let headers: HeadersInit = {
          'x-user-id': user.id,
          'x-user-role': user.role,
        };
        
        if (user.role === 'ADMIN') {
          apiUrl = '/api/admin/dashboard';
        } else if (user.role === 'VENDOR') {
          apiUrl = '/api/vendor/dashboard';
        } else {
          // If user is not admin or vendor, they don't have permission
          notifications.show({
            title: 'Accès refusé',
            message: 'Vous n\'avez pas les permissions nécessaires pour accéder à cette page.',
            color: 'red',
          });
          setLoading(false);
          return;
        }

        const response = await fetch(apiUrl, { headers });
        
        if (response.ok) {
          const data: DashboardData = await response.json();
          setDashboardData(data);
          
          // Check if vendor has stores (all metrics are zero)
          const allMetricsZero = Object.values(data.metrics).every(value => value === 0);
          setHasStores(!allMetricsZero);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.details || errorData.error || 'Erreur lors du chargement des données du tableau de bord');
        }
      } catch (error: any) {
        notifications.show({
          title: 'Erreur',
          message: `Impossible de charger les données du tableau de bord: ${error.message}`,
          color: 'red',
        });
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user.role, user.id]);

  const KPICard = ({ 
    title, 
    value, 
    change, 
    icon, 
    format = 'number' 
  }: { 
    title: string; 
    value: number; 
    change: number; 
    icon: React.ReactNode; 
    format?: 'number' | 'currency' | 'percentage';
  }) => {
    const isPositive = change >= 0;
    const formattedValue = format === 'currency' 
      ? `${new Intl.NumberFormat('fr-FR').format(value)} MAD`
      : format === 'percentage'
      ? `${value}%`
      : new Intl.NumberFormat('fr-FR').format(value);

    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group justify="space-between" mb="xs">
          <Box style={{ 
            padding: 8, 
            borderRadius: 8, 
            backgroundColor: 'var(--mantine-color-blue-light)' 
          }}>
            {icon}
          </Box>
          <Group gap={4}>
            {isPositive ? (
              <TrendingUp size={16} color="green" />
            ) : (
              <TrendingDown size={16} color="red" />
            )}
            <Text size="sm" c={isPositive ? 'green' : 'red'} fw={500}>
              {isPositive ? '+' : ''}{change}%
            </Text>
          </Group>
        </Group>
        <Text size="xl" fw={700} mb={4}>
          {formattedValue}
        </Text>
        <Text size="sm" c="dimmed">
          {title}
        </Text>
        <Text size="xs" c="dimmed" mt={4}>
          vs mois dernier
        </Text>
      </Card>
    );
  };

  const ActivityItem = ({ item }: { item: ActivityItem }) => (
    <Group gap="sm" p="sm">
      <Box
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          backgroundColor: `var(--mantine-color-${item.color}-light)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {item.icon}
      </Box>
      <Box style={{ flex: 1 }}>
        <Text size="sm" fw={500}>
          {item.title}
        </Text>
        <Text size="xs" c="dimmed">
          {item.description}
        </Text>
      </Box>
      <Text size="xs" c="dimmed">
        {item.time}
      </Text>
    </Group>
  );

  const QuickActionCard = ({ 
    title, 
    description, 
    icon, 
    color, 
    onClick 
  }: { 
    title: string; 
    description: string; 
    icon: React.ReactNode; 
    color: string; 
    onClick: () => void;
  }) => (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      style={{ cursor: 'pointer', height: '100%' }}
      onClick={onClick}
    >
      <Group gap="md">
        <Box
          style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            backgroundColor: `var(--mantine-color-${color}-light)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
        <Box style={{ flex: 1 }}>
          <Text fw={600} size="sm">
            {title}
          </Text>
          <Text size="xs" c="dimmed">
            {description}
          </Text>
        </Box>
      </Group>
    </Card>
  );

  if (loading) {
    return (
      <Center style={{ height: 400 }}>
        <Loader size="lg" />
      </Center>
    );
  }

  // If vendor has no stores, show a special message
  if (!hasStores && user.role === 'VENDOR') {
    return (
      <Stack gap="xl">
        <Title order={1} size="2rem">
          Bienvenue, {user.name}!
        </Title>
        
        <Alert
          icon={<AlertCircle size={16} />}
          title="Boutique requise"
          color="blue"
        >
          <Text mb="md">
            Pour commencer à vendre des produits et créer des enchères, vous devez d'abord créer une boutique.
          </Text>
          <Button
            leftSection={<Store size={16} />}
            onClick={() => router.push('/stores/create')}
          >
            Créer ma boutique
          </Button>
        </Alert>
      </Stack>
    );
  }

  // Use mock data if dashboardData is not loaded
  const kpis = dashboardData?.metrics || {
    revenue: 0,
    revenueChange: 0,
    orders: 0,
    ordersChange: 0,
    activeAuctions: 0,
    auctionsChange: 0,
    conversionRate: 0,
    conversionChange: 0,
  };

  const salesData = dashboardData?.charts?.salesData || [];
  const categoryData = dashboardData?.charts?.categoryData || [];
  const recentActivity = dashboardData?.recentActivity ? 
    [...dashboardData.recentActivity.orders, ...dashboardData.recentActivity.auctions]
      .sort((a, b) => a.time.localeCompare(b.time))
      .slice(0, 5) : [];

  return (
    <Stack gap="xl">
      {/* Header */}
      <Group justify="space-between">
        <div>
          <Title order={1} size="2rem" mb="xs">
            Dashboard
          </Title>
          <Text c="dimmed" size="lg">
            Bonjour {user.name}, voici un aperçu de votre activité
          </Text>
        </div>
        <Button
          leftSection={<Eye size={16} />}
          variant="light"
          onClick={() => router.push('/workspace/reports')}
        >
          Voir les rapports
        </Button>
      </Group>

        {/* KPI Cards */}
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
          <KPICard
            title="Chiffre d'affaires"
            value={kpis.revenue}
            change={kpis.revenueChange}
            icon={<DollarSign size={20} color="var(--mantine-color-blue-6)" />}
            format="currency"
          />
          <KPICard
            title="Commandes"
            value={kpis.orders}
            change={kpis.ordersChange}
            icon={<ShoppingBag size={20} color="var(--mantine-color-blue-6)" />}
          />
          <KPICard
            title="Enchères actives"
            value={kpis.activeAuctions}
            change={kpis.auctionsChange}
            icon={<Gavel size={20} color="var(--mantine-color-blue-6)" />}
          />
          <KPICard
            title="Taux de conversion"
            value={kpis.conversionRate}
            change={kpis.conversionChange}
            icon={<Target size={20} color="var(--mantine-color-blue-6)" />}
            format="percentage"
          />
        </SimpleGrid>

        {/* Charts */}
        <Grid>
          <Grid.Col span={{ base: 12, lg: 8 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Title order={3} mb="md">
                Ventes (30 derniers jours)
              </Title>
              <Box h={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#228be6" 
                      fill="#228be6" 
                      fillOpacity={0.1}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, lg: 4 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Title order={3} mb="md">
                Répartition par catégorie
              </Title>
              <Box h={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Activity & Quick Actions */}
        <Grid>
          <Grid.Col span={{ base: 12, lg: 8 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Title order={3} mb="md">
                Activité récente
              </Title>
              <Stack gap={0}>
                {recentActivity.map((item, index) => (
                  <div key={item.id}>
                    <ActivityItem item={item} />
                    {index < recentActivity.length - 1 && <Divider />}
                  </div>
                ))}
              </Stack>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, lg: 4 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Title order={3} mb="md">
                Actions rapides
              </Title>
              <Stack gap="sm">
                <QuickActionCard
                  title="Nouveau Produit"
                  description="Ajouter un produit à votre catalogue"
                  icon={<Plus size={20} />}
                  color="blue"
                  onClick={() => router.push('/workspace/products/new')}
                />
                <QuickActionCard
                  title="Nouvelle Enchère"
                  description="Créer une nouvelle enchère"
                  icon={<Gavel size={20} />}
                  color="orange"
                  onClick={() => router.push('/workspace/my-auctions/new')}
                />
                <QuickActionCard
                  title="Bannière boutique"
                  description="Personnaliser votre boutique"
                  icon={<Store size={20} />}
                  color="green"
                  onClick={() => router.push('/workspace/settings?tab=store')}
                />
                <QuickActionCard
                  title="Répondre aux avis"
                  description="Gérer les avis clients"
                  icon={<MessageSquare size={20} />}
                  color="teal"
                  onClick={() => router.push('/workspace/reviews')}
                />
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Conversion Chart */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Title order={3} mb="md">
            Taux de conversion (4 dernières semaines)
          </Title>
          <Box h={200}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData.slice(-4)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#40c057" 
                  strokeWidth={3}
                  dot={{ fill: '#40c057', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Card>
    </Stack>
  );
}