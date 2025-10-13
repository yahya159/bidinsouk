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

// Mock data - replace with real API calls
const mockKPIs: KPIData = {
  revenue: 45280,
  revenueChange: 12.5,
  orders: 156,
  ordersChange: -3.2,
  activeAuctions: 23,
  auctionsChange: 8.7,
  conversionRate: 3.4,
  conversionChange: 1.2,
};

const mockSalesData = [
  { name: '1 Jan', value: 1200 },
  { name: '5 Jan', value: 1800 },
  { name: '10 Jan', value: 1600 },
  { name: '15 Jan', value: 2200 },
  { name: '20 Jan', value: 1900 },
  { name: '25 Jan', value: 2400 },
  { name: '30 Jan', value: 2100 },
];

const mockConversionData = [
  { name: 'Sem 1', value: 2.8 },
  { name: 'Sem 2', value: 3.1 },
  { name: 'Sem 3', value: 2.9 },
  { name: 'Sem 4', value: 3.4 },
];

const mockCategoryData = [
  { name: 'Électronique', value: 35, color: '#228be6' },
  { name: 'Mode', value: 25, color: '#40c057' },
  { name: 'Maison', value: 20, color: '#fab005' },
  { name: 'Sport', value: 12, color: '#fd7e14' },
  { name: 'Autres', value: 8, color: '#e64980' },
];

const mockActivity: ActivityItem[] = [
  {
    id: '1',
    type: 'order',
    title: 'Nouvelle commande #12345',
    description: 'iPhone 14 Pro - 850 MAD',
    time: 'Il y a 5 min',
    icon: <ShoppingBag size={16} />,
    color: 'blue',
  },
  {
    id: '2',
    type: 'bid',
    title: 'Nouvelle enchère',
    description: 'MacBook Air M2 - 1200 MAD',
    time: 'Il y a 12 min',
    icon: <Gavel size={16} />,
    color: 'orange',
  },
  {
    id: '3',
    type: 'review',
    title: 'Nouvel avis ⭐⭐⭐⭐⭐',
    description: 'Samsung Galaxy S23 - "Excellent produit"',
    time: 'Il y a 1h',
    icon: <MessageSquare size={16} />,
    color: 'green',
  },
  {
    id: '4',
    type: 'stock',
    title: 'Stock faible',
    description: 'iPad Pro - 2 unités restantes',
    time: 'Il y a 2h',
    icon: <Clock size={16} />,
    color: 'red',
  },
];

export function DashboardContent({ user }: DashboardProps) {
  const router = useRouter();
  const [kpis, setKpis] = useState<KPIData>(mockKPIs);
  const [loading, setLoading] = useState(false);
  const [hasStores, setHasStores] = useState(true); // New state to track if vendor has stores

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/vendors/dashboard');
        if (response.ok) {
          const data = await response.json();
          setKpis(data.metrics);
          
          // Check if vendor has stores (all metrics are zero)
          const allMetricsZero = Object.values(data.metrics).every(value => value === 0);
          setHasStores(!allMetricsZero);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
  if (!hasStores) {
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
                  <AreaChart data={mockSalesData}>
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
                      data={mockCategoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {mockCategoryData.map((entry, index) => (
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
                {mockActivity.map((item, index) => (
                  <div key={item.id}>
                    <ActivityItem item={item} />
                    {index < mockActivity.length - 1 && <Divider />}
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
              <LineChart data={mockConversionData}>
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