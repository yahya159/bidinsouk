'use client';

import { 
  Container, 
  Title, 
  Text, 
  Stack, 
  SimpleGrid, 
  Grid,
  Loader,
  Center,
  Alert
} from '@mantine/core';
import { 
  IconUsers, 
  IconShoppingBag, 
  IconGavel, 
  IconShoppingCart,
  IconCurrencyDollar,
  IconTrendingUp,
  IconAlertCircle
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { StatsCard } from '@/components/admin/shared/StatsCard';
import { RecentActivity } from '@/components/admin/dashboard/RecentActivity';
import { QuickActions } from '@/components/admin/dashboard/QuickActions';
import { AlertsWidget } from '@/components/admin/dashboard/AlertsWidget';

interface DashboardStats {
  users: {
    total: number;
    newToday: number;
    active: number;
    byRole: {
      CLIENT: number;
      VENDOR: number;
      ADMIN: number;
    };
  };
  products: {
    total: number;
    active: number;
    draft: number;
    archived: number;
  };
  auctions: {
    total: number;
    running: number;
    endingSoon: number;
    endedToday: number;
  };
  orders: {
    total: number;
    pending: number;
    todayCount: number;
    todayRevenue: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    today: number;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/analytics/overview');
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard statistics');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Failed to load dashboard statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Center h={400}>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  if (error || !stats) {
    return (
      <Container size="xl" py="xl">
        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
          {error || 'Failed to load dashboard data'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1}>Admin Dashboard</Title>
          <Text c="dimmed" mt="xs">
            Welcome back! Here&rsquo;s what&rsquo;s happening with your platform today.
          </Text>
        </div>

        {/* Statistics Cards */}
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
          <StatsCard
            title="Total Users"
            value={stats.users.total.toLocaleString()}
            icon={<IconUsers size={22} />}
            color="blue"
            description={`${stats.users.newToday} new today • ${stats.users.active} active`}
          />
          
          <StatsCard
            title="Products"
            value={stats.products.total.toLocaleString()}
            icon={<IconShoppingBag size={22} />}
            color="green"
            description={`${stats.products.active} active • ${stats.products.draft} draft`}
          />
          
          <StatsCard
            title="Auctions"
            value={stats.auctions.total.toLocaleString()}
            icon={<IconGavel size={22} />}
            color="violet"
            description={`${stats.auctions.running} running • ${stats.auctions.endingSoon} ending soon`}
          />
          
          <StatsCard
            title="Orders"
            value={stats.orders.total.toLocaleString()}
            icon={<IconShoppingCart size={22} />}
            color="orange"
            description={`${stats.orders.todayCount} today • ${stats.orders.pending} pending`}
          />
        </SimpleGrid>

        {/* Revenue Cards */}
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
          <StatsCard
            title="Total Revenue"
            value={formatCurrency(stats.revenue.total)}
            icon={<IconCurrencyDollar size={22} />}
            color="teal"
            description="All time"
          />
          
          <StatsCard
            title="This Month"
            value={formatCurrency(stats.revenue.thisMonth)}
            icon={<IconTrendingUp size={22} />}
            color="cyan"
            description="Current month revenue"
          />
          
          <StatsCard
            title="Today"
            value={formatCurrency(stats.revenue.today)}
            icon={<IconCurrencyDollar size={22} />}
            color="indigo"
            description="Today&rsquo;s revenue"
          />
        </SimpleGrid>

        {/* Widgets Grid */}
        <Grid gutter="lg">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <RecentActivity />
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="lg" h="100%">
              <QuickActions />
              <AlertsWidget />
            </Stack>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
}
