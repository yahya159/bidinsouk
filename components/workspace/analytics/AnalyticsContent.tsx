'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Stack,
  Card,
  Grid,
  Select,
  Center,
  Loader,
  Table,
  Badge,
  Image,
  Progress,
  ActionIcon,
  Menu,
} from '@mantine/core';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Users,
  Eye,
  Download,
  Calendar,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { notifications } from '@mantine/notifications';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'CLIENT' | 'VENDOR' | 'ADMIN';
}

interface AnalyticsData {
  kpis: {
    totalRevenue: number;
    totalOrders: number;
    conversionRate: number;
    averageOrderValue: number;
  };
  salesChart: {
    date: string;
    revenue: number;
    orders: number;
  }[];
  trafficChart: {
    date: string;
    visitors: number;
    pageViews: number;
  }[];
  topProducts: {
    id: string;
    name: string;
    revenue: number;
    orders: number;
    views: number;
    image: string;
  }[];
  categoryPerformance: {
    category: string;
    revenue: number;
    orders: number;
    growth: number;
  }[];
}

interface AnalyticsContentProps {
  user: User;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function AnalyticsContent({ user }: AnalyticsContentProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Use different API endpoints based on user role
      let apiUrl;
      let headers: HeadersInit = {
        'x-user-id': user.id,
        'x-user-role': user.role,
      };
      
      if (user.role === 'ADMIN') {
        const params = new URLSearchParams({
          range: dateRange,
          category: selectedCategory,
        });
        apiUrl = `/api/admin/analytics?${params}`;
      } else if (user.role === 'VENDOR') {
        const params = new URLSearchParams({
          range: dateRange,
          category: selectedCategory,
        });
        apiUrl = `/api/vendor/analytics?${params}`;
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
      if (!response.ok) throw new Error('Failed to fetch analytics');

      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (error) {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de charger les données analytiques',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, selectedCategory]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const exportData = async (type: 'csv' | 'pdf') => {
    try {
      // In a real implementation, this would call an export API
      notifications.show({
        title: 'Export en cours',
        message: `Export ${type.toUpperCase()} en cours de génération...`,
        color: 'blue',
      });
    } catch (error) {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible d\'exporter les données',
        color: 'red',
      });
    }
  };

  if (loading) {
    return (
      <Center style={{ height: 400 }}>
        <Loader size="lg" />
      </Center>
    );
  }

  if (!data) {
    return (
      <Center style={{ height: 400 }}>
        <Text>Aucune donnée disponible</Text>
      </Center>
    );
  }

  return (
    <Container size="xl" py="md">
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between">
          <div>
            <Title order={1} size="2rem" mb="xs">
              Analytiques
            </Title>
            <Text c="dimmed" size="lg">
              Analysez les performances de votre boutique
            </Text>
          </div>
          <Group gap="sm">
            <Select
              placeholder="Période"
              data={[
                { value: '7d', label: '7 derniers jours' },
                { value: '30d', label: '30 derniers jours' },
                { value: '90d', label: '90 derniers jours' },
                { value: '365d', label: '1 an' },
              ]}
              value={dateRange}
              onChange={(value) => setDateRange(value || '30d')}
            />
            <Select
              placeholder="Catégorie"
              data={[
                { value: 'all', label: 'Toutes les catégories' },
                { value: 'electronics', label: 'Électronique' },
                { value: 'fashion', label: 'Mode' },
                { value: 'home', label: 'Maison' },
                { value: 'sports', label: 'Sport' },
              ]}
              value={selectedCategory}
              onChange={(value) => setSelectedCategory(value || 'all')}
            />
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <ActionIcon variant="light">
                  <Download size={16} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item leftSection={<Download size={14} />} onClick={() => exportData('csv')}>
                  Exporter CSV
                </Menu.Item>
                <Menu.Item leftSection={<Download size={14} />} onClick={() => exportData('pdf')}>
                  Exporter PDF
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>

        {/* KPI Cards */}
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed">Chiffre d'affaires</Text>
                <DollarSign size={20} color="var(--mantine-color-blue-6)" />
              </Group>
              <Text fw={700} size="xl" mb="xs">
                {formatCurrency(data.kpis.totalRevenue)}
              </Text>
              <Group gap="xs">
                <ArrowUpRight size={14} color="green" />
                <Text size="xs" c="green">+12.5%</Text>
              </Group>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed">Commandes</Text>
                <ShoppingBag size={20} color="var(--mantine-color-green-6)" />
              </Group>
              <Text fw={700} size="xl" mb="xs">
                {new Intl.NumberFormat('fr-FR').format(data.kpis.totalOrders)}
              </Text>
              <Group gap="xs">
                <ArrowUpRight size={14} color="green" />
                <Text size="xs" c="green">+8.2%</Text>
              </Group>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed">Taux de conversion</Text>
                <TrendingUp size={20} color="var(--mantine-color-orange-6)" />
              </Group>
              <Text fw={700} size="xl" mb="xs">
                {data.kpis.conversionRate.toFixed(1)}%
              </Text>
              <Group gap="xs">
                <ArrowDownRight size={14} color="red" />
                <Text size="xs" c="red">-2.1%</Text>
              </Group>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed">Panier moyen</Text>
                <Users size={20} color="var(--mantine-color-purple-6)" />
              </Group>
              <Text fw={700} size="xl" mb="xs">
                {formatCurrency(data.kpis.averageOrderValue)}
              </Text>
              <Group gap="xs">
                <ArrowUpRight size={14} color="green" />
                <Text size="xs" c="green">+5.7%</Text>
              </Group>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Charts */}
        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Group justify="space-between" mb="md">
                <Text fw={600} size="lg">Évolution des ventes</Text>
                <Group gap="sm">
                  <Badge variant="light" color="blue">Revenus</Badge>
                  <Badge variant="light" color="green">Commandes</Badge>
                </Group>
              </Group>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.salesChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis yAxisId="revenue" orientation="left" />
                  <YAxis yAxisId="orders" orientation="right" />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString('fr-FR')}
                    formatter={(value, name) => [
                      name === 'revenue' ? formatCurrency(Number(value)) : value,
                      name === 'revenue' ? 'Revenus' : 'Commandes'
                    ]}
                  />
                  <Line 
                    yAxisId="revenue"
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    yAxisId="orders"
                    type="monotone" 
                    dataKey="orders" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Text fw={600} size="lg" mb="md">Performance par catégorie</Text>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.categoryPerformance}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="revenue"
                    label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.categoryPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Traffic Chart */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group justify="space-between" mb="md">
            <Text fw={600} size="lg">Trafic du site</Text>
            <Group gap="sm">
              <Badge variant="light" color="purple">Visiteurs</Badge>
              <Badge variant="light" color="orange">Pages vues</Badge>
            </Group>
          </Group>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.trafficChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString('fr-FR')}
                formatter={(value, name) => [value, name === 'visitors' ? 'Visiteurs' : 'Pages vues']}
              />
              <Bar dataKey="visitors" fill="#8b5cf6" />
              <Bar dataKey="pageViews" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Top Products */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Text fw={600} size="lg" mb="md">Produits les plus performants</Text>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Produit</Table.Th>
                <Table.Th>Revenus</Table.Th>
                <Table.Th>Commandes</Table.Th>
                <Table.Th>Vues</Table.Th>
                <Table.Th>Conversion</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.topProducts.map((product, index) => (
                <Table.Tr key={product.id}>
                  <Table.Td>
                    <Group gap="sm">
                      <Text fw={500} size="sm">#{index + 1}</Text>
                      <Image
                        src={product.image}
                        alt={product.name}
                        width={40}
                        height={40}
                        radius="md"
                      />
                      <Text fw={500}>{product.name}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text fw={600} c="blue">
                      {formatCurrency(product.revenue)}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" color="green">
                      {product.orders}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Eye size={14} />
                      <Text size="sm">{new Intl.NumberFormat('fr-FR').format(product.views)}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">
                      {((product.orders / product.views) * 100).toFixed(1)}%
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>

        {/* Category Performance */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Text fw={600} size="lg" mb="md">Performance par catégorie</Text>
          <Stack gap="md">
            {data.categoryPerformance.map((category) => (
              <div key={category.category}>
                <Group justify="space-between" mb="xs">
                  <Text fw={500}>{category.category}</Text>
                  <Group gap="md">
                    <Text size="sm" c="dimmed">
                      {category.orders} commandes
                    </Text>
                    <Text fw={600}>
                      {formatCurrency(category.revenue)}
                    </Text>
                    <Badge 
                      variant="light" 
                      color={category.growth >= 0 ? 'green' : 'red'}
                      leftSection={category.growth >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    >
                      {formatPercentage(category.growth)}
                    </Badge>
                  </Group>
                </Group>
                <Progress 
                  value={(category.revenue / Math.max(...data.categoryPerformance.map(c => c.revenue))) * 100}
                  color="blue"
                  size="sm"
                />
              </div>
            ))}
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}