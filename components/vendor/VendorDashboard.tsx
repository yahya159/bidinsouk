'use client';

import { useState, useEffect } from 'react';
import {
  AppShell,
  Container,
  Grid,
  Card,
  Text,
  Title,
  Group,
  Stack,
  Button,
  Badge,
  Avatar,
  Menu,
  TextInput,
  ActionIcon,
  Paper,
  Progress,
  Divider,
  Modal,
  Alert,
  Loader,
  Box,
  Flex,
  ThemeIcon,
  UnstyledButton,
  rem,
} from '@mantine/core';
import {
  IconSearch,
  IconBell,
  IconUser,
  IconLogout,
  IconSettings,
  IconTrash,
  IconDashboard,
  IconPackage,
  IconHammer,
  IconShoppingCart,
  IconUsers,
  IconStar,
  IconChartBar,
  IconBuilding,
  IconTrendingUp,
  IconTrendingDown,
  IconCurrencyDollar,
  IconEye,
  IconPlus,
  IconMessage,
  IconClock,
  IconCheck,
  IconAlertCircle,
  IconChevronDown,
  IconGlobe,
} from '@tabler/icons-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'CLIENT' | 'VENDOR' | 'ADMIN';
  avatarUrl?: string;
}

interface VendorDashboardProps {
  user: User;
}

interface DashboardMetrics {
  revenue: number;
  revenueChange: number;
  orders: number;
  ordersChange: number;
  activeAuctions: number;
  auctionsChange: number;
  conversionRate: number;
  conversionChange: number;
}

interface ChartData {
  name: string;
  value: number;
  color?: string;
  [key: string]: any; // Allow additional properties for Recharts compatibility
}

interface RecentActivity {
  id: string;
  type: 'order' | 'review' | 'auction_end' | 'bid';
  title: string;
  description: string;
  timeAgo: string;
  icon: React.ReactNode;
}

const SIDEBAR_ITEMS = [
  { label: 'Dashboard', icon: IconDashboard, href: '/vendor-dashboard', active: true },
  { label: 'Produits', icon: IconPackage, href: '/vendor/products' },
  { label: 'Enchères', icon: IconHammer, href: '/vendor/auctions' },
  { label: 'Commandes', icon: IconShoppingCart, href: '/vendor/orders' },
  { label: 'Clients', icon: IconUsers, href: '/vendor/clients' },
  { label: 'Avis', icon: IconStar, href: '/vendor/reviews' },
  { label: 'Rapports', icon: IconChartBar, href: '/vendor/reports' },
  { label: 'Magasin vendeur', icon: IconBuilding, href: '/vendor/store' },
  { label: 'Réglages', icon: IconSettings, href: '/vendor/settings' },
];

const ADMIN_ITEMS = [
  { label: 'Tous les vendeurs', icon: IconUsers, href: '/admin/vendors' },
  { label: 'Fichiers & Archives', icon: IconPackage, href: '/admin/archive' },
  { label: 'Logs système', icon: IconChartBar, href: '/admin/logs' },
];

// Mock data - replace with real API calls
const mockMetrics: DashboardMetrics = {
  revenue: 45280,
  revenueChange: 12.5,
  orders: 156,
  ordersChange: -3.2,
  activeAuctions: 23,
  auctionsChange: 8.7,
  conversionRate: 3.4,
  conversionChange: 1.2,
};

const mockSalesData: ChartData[] = [
  { name: '1 Jan', value: 1200 },
  { name: '5 Jan', value: 1800 },
  { name: '10 Jan', value: 1600 },
  { name: '15 Jan', value: 2200 },
  { name: '20 Jan', value: 1900 },
  { name: '25 Jan', value: 2400 },
  { name: '30 Jan', value: 2100 },
];

const mockCategoryData: ChartData[] = [
  { name: 'Électronique', value: 35, color: '#228be6' },
  { name: 'Mode', value: 25, color: '#40c057' },
  { name: 'Maison', value: 20, color: '#fab005' },
  { name: 'Sport', value: 12, color: '#fd7e14' },
  { name: 'Autres', value: 8, color: '#e64980' },
];

const mockRecentActivity: RecentActivity[] = [
  {
    id: '1',
    type: 'order',
    title: 'Nouvelle commande #12345',
    description: 'iPhone 14 Pro - 850 MAD',
    timeAgo: 'Il y a 5 min',
    icon: <IconShoppingCart size={16} />,
  },
  {
    id: '2',
    type: 'review',
    title: 'Nouvel avis ⭐⭐⭐⭐⭐',
    description: 'MacBook Air M2 - "Excellent produit"',
    timeAgo: 'Il y a 12 min',
    icon: <IconStar size={16} />,
  },
  {
    id: '3',
    type: 'auction_end',
    title: 'Enchère terminée',
    description: 'Samsung Galaxy S23 - Vendu 720 MAD',
    timeAgo: 'Il y a 1h',
    icon: <IconHammer size={16} />,
  },
  {
    id: '4',
    type: 'bid',
    title: 'Nouvelle mise',
    description: 'iPad Pro - 1200 MAD par @user123',
    timeAgo: 'Il y a 2h',
    icon: <IconTrendingUp size={16} />,
  },
];

export function VendorDashboard({ user }: VendorDashboardProps) {
  const router = useRouter();
  const [opened, { open, close }] = useDisclosure(false);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>(mockMetrics);
  const [salesData, setSalesData] = useState<ChartData[]>(mockSalesData);
  const [categoryData, setCategoryData] = useState<ChartData[]>(mockCategoryData);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>(mockRecentActivity);
  const [language, setLanguage] = useState('FR');

  // Check if user should have access
  useEffect(() => {
    if (user.role === 'CLIENT') {
      open();
    }
  }, [user.role, open]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (user.role === 'CLIENT') return;
      
      try {
        setLoading(true);
        const response = await fetch('/api/vendors/dashboard');
        
        if (response.ok) {
          const data = await response.json();
          setMetrics(data.metrics);
          setSalesData(data.salesData.length > 0 ? data.salesData : mockSalesData);
          setCategoryData(data.categoryData);
          
          // Format recent activity with icons
          const formattedActivity = data.recentActivity.map((item: any) => ({
            ...item,
            icon: item.type === 'order' ? <IconShoppingCart size={16} /> :
                  item.type === 'review' ? <IconStar size={16} /> :
                  item.type === 'auction_end' ? <IconHammer size={16} /> :
                  <IconTrendingUp size={16} />
          }));
          
          setRecentActivity(formattedActivity.length > 0 ? formattedActivity : mockRecentActivity);
        } else {
          // Use mock data on error
          console.error('Failed to fetch dashboard data');
          notifications.show({
            title: 'Erreur',
            message: 'Impossible de charger les données du tableau de bord',
            color: 'red',
          });
        }
      } catch (error) {
        console.error('Dashboard fetch error:', error);
        notifications.show({
          title: 'Erreur',
          message: 'Erreur de connexion au serveur',
          color: 'red',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user.role]);

  // Auto-refresh data every 60 seconds
  useEffect(() => {
    if (user.role === 'CLIENT') return;
    
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/vendors/dashboard');
        if (response.ok) {
          const data = await response.json();
          setMetrics(data.metrics);
          setSalesData(data.salesData.length > 0 ? data.salesData : mockSalesData);
        }
      } catch (error) {
        console.error('Auto-refresh error:', error);
      }
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [user.role]);

  const handleBecomeVendor = () => {
    router.push('/vendors/apply');
  };

  const handleLogout = () => {
    // Implement logout logic
    router.push('/api/auth/signout');
  };

  const MetricCard = ({ 
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
      <Card shadow="sm" padding="lg" radius="lg">
        <Group justify="space-between" mb="xs">
          <ThemeIcon size="lg" radius="lg" variant="light" color="blue">
            {icon}
          </ThemeIcon>
          <Group gap={4}>
            {isPositive ? (
              <IconTrendingUp size={16} color="green" />
            ) : (
              <IconTrendingDown size={16} color="red" />
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

  const ActivityItem = ({ activity }: { activity: RecentActivity }) => (
    <Group gap="sm" p="sm">
      <ThemeIcon size="sm" radius="xl" variant="light" color="green">
        {activity.icon}
      </ThemeIcon>
      <Box flex={1}>
        <Text size="sm" fw={500}>
          {activity.title}
        </Text>
        <Text size="xs" c="dimmed">
          {activity.description}
        </Text>
      </Box>
      <Text size="xs" c="dimmed">
        {activity.timeAgo}
      </Text>
      <Box
        w={8}
        h={8}
        style={{
          borderRadius: '50%',
          backgroundColor: 'var(--mantine-color-green-5)',
        }}
      />
    </Group>
  );

  const QuickActionButton = ({ 
    label, 
    icon, 
    color, 
    onClick 
  }: { 
    label: string; 
    icon: React.ReactNode; 
    color: string; 
    onClick: () => void;
  }) => (
    <Button
      variant="light"
      color={color}
      size="lg"
      leftSection={icon}
      onClick={onClick}
      fullWidth
    >
      {label}
    </Button>
  );

  // Access denied modal for clients
  if (user.role === 'CLIENT') {
    return (
      <Modal
        opened={opened}
        onClose={() => router.push('/')}
        title="Accès restreint"
        centered
        closeOnClickOutside={false}
        closeOnEscape={false}
      >
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Accès vendeur requis"
          color="blue"
          mb="md"
        >
          Vous devez devenir vendeur pour accéder à l'administration de boutique.
        </Alert>
        <Group justify="flex-end" gap="sm">
          <Button variant="outline" onClick={() => router.push('/')}>
            Retour
          </Button>
          <Button onClick={handleBecomeVendor}>
            Devenir Vendeur
          </Button>
        </Group>
      </Modal>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 140px)' }}>
      {/* Sidebar */}
      <div style={{ 
        width: '280px', 
        backgroundColor: 'white', 
        borderRight: '1px solid #e9ecef',
        padding: '1rem',
        position: 'fixed',
        height: 'calc(100vh - 140px)',
        overflowY: 'auto'
      }}>
        <Stack gap="xs">
          {SIDEBAR_ITEMS.map((item) => (
            <UnstyledButton
              key={item.href}
              p="sm"
              style={{
                borderRadius: 'var(--mantine-radius-md)',
                backgroundColor: item.active ? 'var(--mantine-color-blue-light)' : 'transparent',
                color: item.active ? 'var(--mantine-color-blue-7)' : 'inherit',
              }}
              onClick={() => router.push(item.href)}
            >
              <Group gap="sm">
                <item.icon size={20} />
                <Text size="sm" fw={item.active ? 600 : 400}>
                  {item.label}
                </Text>
              </Group>
            </UnstyledButton>
          ))}

          {user.role === 'ADMIN' && (
            <>
              <Divider my="md" />
              <Text size="xs" fw={600} c="dimmed" tt="uppercase" px="sm">
                Administration
              </Text>
              {ADMIN_ITEMS.map((item) => (
                <UnstyledButton
                  key={item.href}
                  p="sm"
                  style={{ borderRadius: 'var(--mantine-radius-md)' }}
                  onClick={() => router.push(item.href)}
                >
                  <Group gap="sm">
                    <item.icon size={20} />
                    <Text size="sm">
                      {item.label}
                    </Text>
                  </Group>
                </UnstyledButton>
              ))}
            </>
          )}

          <Divider my="md" />
          <UnstyledButton
            p="sm"
            style={{ 
              borderRadius: 'var(--mantine-radius-md)',
              color: 'var(--mantine-color-red-6)',
            }}
          >
            <Group gap="sm">
              <IconTrash size={20} />
              <Text size="sm" fw={500}>
                Supprimer le compte
              </Text>
            </Group>
          </UnstyledButton>
        </Stack>
      </div>

      {/* Main Content */}
      <div style={{ 
        marginLeft: '280px', 
        padding: '1rem 2rem',
        width: 'calc(100% - 280px)',
        minHeight: 'calc(100vh - 140px)'
      }}>
        <Container size="xl" style={{ maxWidth: '100%', padding: 0 }}>
          <Stack gap="xl">
            {/* Page Header */}
            <Group justify="space-between">
              <div>
                <Title order={2} mb={4}>
                  Administration de Boutique
                </Title>
                <Text c="dimmed">
                  Gérez votre boutique et suivez vos performances
                </Text>
              </div>
              <Button leftSection={<IconBell size={16} />} variant="light">
                Notifications
              </Button>
            </Group>

            {/* Metrics Cards */}
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                <MetricCard
                  title="Chiffre d'affaires"
                  value={metrics.revenue}
                  change={metrics.revenueChange}
                  icon={<IconCurrencyDollar size={24} />}
                  format="currency"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                <MetricCard
                  title="Commandes"
                  value={metrics.orders}
                  change={metrics.ordersChange}
                  icon={<IconShoppingCart size={24} />}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                <MetricCard
                  title="Enchères actives"
                  value={metrics.activeAuctions}
                  change={metrics.auctionsChange}
                  icon={<IconHammer size={24} />}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                <MetricCard
                  title="Taux de conversion"
                  value={metrics.conversionRate}
                  change={metrics.conversionChange}
                  icon={<IconTrendingUp size={24} />}
                  format="percentage"
                />
              </Grid.Col>
            </Grid>

            {/* Charts */}
            <Grid>
              <Grid.Col span={{ base: 12, lg: 8 }}>
                <Card shadow="sm" padding="lg" radius="lg">
                  <Title order={4} mb="md">
                    Graphique des ventes (30 derniers jours)
                  </Title>
                  <Box h={300}>
                    {loading ? (
                      <Flex align="center" justify="center" h="100%">
                        <Loader />
                      </Flex>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={salesData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#228be6" radius={4} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </Box>
                </Card>
              </Grid.Col>
              <Grid.Col span={{ base: 12, lg: 4 }}>
                <Card shadow="sm" padding="lg" radius="lg">
                  <Title order={4} mb="md">
                    Répartition par catégorie
                  </Title>
                  <Box h={300}>
                    {loading ? (
                      <Flex align="center" justify="center" h="100%">
                        <Loader />
                      </Flex>
                    ) : (
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
                    )}
                  </Box>
                </Card>
              </Grid.Col>
            </Grid>

            {/* Recent Activity & Quick Actions */}
            <Grid>
              <Grid.Col span={{ base: 12, lg: 8 }}>
                <Card shadow="sm" padding="lg" radius="lg">
                  <Title order={4} mb="md">
                    Activité récente
                  </Title>
                  {loading ? (
                    <Flex align="center" justify="center" py="xl">
                      <Loader />
                    </Flex>
                  ) : (
                    <Stack gap={0}>
                      {recentActivity.map((activity, index) => (
                        <div key={activity.id}>
                          <ActivityItem activity={activity} />
                          {index < recentActivity.length - 1 && <Divider />}
                        </div>
                      ))}
                    </Stack>
                  )}
                </Card>
              </Grid.Col>
              <Grid.Col span={{ base: 12, lg: 4 }}>
                <Card shadow="sm" padding="lg" radius="lg">
                  <Title order={4} mb="md">
                    Actions rapides
                  </Title>
                  <Stack gap="sm">
                    <QuickActionButton
                      label="Nouveau Produit"
                      icon={<IconPlus size={16} />}
                      color="blue"
                      onClick={() => router.push('/vendor/products/create')}
                    />
                    <QuickActionButton
                      label="Nouvelle Enchère"
                      icon={<IconHammer size={16} />}
                      color="green"
                      onClick={() => router.push('/vendor/auctions/create')}
                    />
                    <QuickActionButton
                      label="Bannière boutique"
                      icon={<IconBuilding size={16} />}
                      color="orange"
                      onClick={() => router.push('/vendor/store/banners')}
                    />
                    <QuickActionButton
                      label="Répondre aux avis"
                      icon={<IconMessage size={16} />}
                      color="teal"
                      onClick={() => router.push('/vendor/reviews')}
                    />
                  </Stack>
                </Card>
              </Grid.Col>
            </Grid>
          </Stack>
        </Container>
      </div>
    </div>
  );
}