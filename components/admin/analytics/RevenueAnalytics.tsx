'use client';

import { Grid, Title, Text, Group, ThemeIcon } from '@mantine/core';
import { IconCurrencyDollar, IconShoppingCart, IconTrendingUp, IconReceipt } from '@tabler/icons-react';
import { LineChartComponent } from './LineChartComponent';
import { BarChartComponent } from './BarChartComponent';
import { StatsCard } from '../shared/StatsCard';
import { format } from 'date-fns';

interface RevenueAnalyticsData {
  totalRevenue: number;
  transactionCount: number;
  commissionEarnings: number;
  averageOrderValue: number;
  revenueTrend: number;
  transactionTrend: number;
  commissionTrend: number;
  dailyRevenue: Array<{
    date: Date;
    revenue: number;
    count: number;
  }>;
  revenueByStore: Array<{
    storeId: string;
    storeName: string;
    revenue: number;
    orderCount: number;
  }>;
  comparison: {
    previousRevenue: number;
    previousTransactionCount: number;
    previousAverageOrderValue: number;
  };
}

interface RevenueAnalyticsProps {
  data: RevenueAnalyticsData;
}

export function RevenueAnalytics({ data }: RevenueAnalyticsProps) {
  // Prepare data for revenue trends chart
  const revenueChartData = data.dailyRevenue.map(item => ({
    date: format(new Date(item.date), 'MMM dd'),
    revenue: item.revenue,
    orders: item.count,
  }));

  // Prepare data for top stores bar chart (top 10)
  const topStoresData = data.revenueByStore.slice(0, 10).map(store => ({
    store: store.storeName.length > 20 
      ? store.storeName.substring(0, 20) + '...' 
      : store.storeName,
    revenue: store.revenue,
  }));

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div>
      <Title order={3} mb="md">Revenue Analytics</Title>

      {/* Stats Cards */}
      <Grid mb="xl">
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Total Revenue"
            value={formatCurrency(data.totalRevenue)}
            icon={<IconCurrencyDollar size={20} />}
            color="green"
            trend={{
              value: data.revenueTrend,
              label: 'vs previous period',
            }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Transactions"
            value={data.transactionCount.toLocaleString()}
            icon={<IconShoppingCart size={20} />}
            color="blue"
            trend={{
              value: data.transactionTrend,
              label: 'vs previous period',
            }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Commission Earnings"
            value={formatCurrency(data.commissionEarnings)}
            icon={<IconReceipt size={20} />}
            color="violet"
            trend={{
              value: data.commissionTrend,
              label: 'vs previous period',
            }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Avg Order Value"
            value={formatCurrency(data.averageOrderValue)}
            icon={<IconTrendingUp size={20} />}
            color="orange"
          />
        </Grid.Col>
      </Grid>

      {/* Charts */}
      <Grid mb="xl">
        <Grid.Col span={12}>
          <Title order={4} mb="sm">Revenue Trends</Title>
          <LineChartComponent
            data={revenueChartData}
            xKey="date"
            lines={[
              { key: 'revenue', name: 'Revenue', color: '#22c55e' },
            ]}
            height={350}
            formatYAxis={(value) => formatCurrency(value)}
            formatTooltip={(value) => formatCurrency(value)}
          />
        </Grid.Col>
      </Grid>

      <Grid mb="xl">
        <Grid.Col span={12}>
          <Title order={4} mb="sm">Transaction Volume</Title>
          <BarChartComponent
            data={revenueChartData}
            xKey="date"
            bars={[
              { key: 'orders', name: 'Orders', color: '#3b82f6' },
            ]}
            height={300}
            formatTooltip={(value) => `${value} orders`}
          />
        </Grid.Col>
      </Grid>

      <Grid>
        <Grid.Col span={12}>
          <Title order={4} mb="sm">Top Performing Stores</Title>
          <BarChartComponent
            data={topStoresData}
            xKey="store"
            bars={[
              { key: 'revenue', name: 'Revenue', color: '#22c55e' },
            ]}
            height={400}
            layout="vertical"
            formatTooltip={(value) => formatCurrency(value)}
          />
        </Grid.Col>
      </Grid>

      {/* Comparison with Previous Period */}
      <Grid mt="xl">
        <Grid.Col span={12}>
          <Title order={4} mb="md">Period Comparison</Title>
          <Grid>
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Group>
                <ThemeIcon size="lg" variant="light" color="green">
                  <IconCurrencyDollar size={20} />
                </ThemeIcon>
                <div>
                  <Text size="xs" c="dimmed">Current Revenue</Text>
                  <Text size="lg" fw={600}>{formatCurrency(data.totalRevenue)}</Text>
                  <Text size="xs" c="dimmed">
                    Previous: {formatCurrency(data.comparison.previousRevenue)}
                  </Text>
                  <Text 
                    size="sm" 
                    c={data.revenueTrend >= 0 ? 'green' : 'red'}
                    fw={500}
                  >
                    {data.revenueTrend >= 0 ? '+' : ''}{data.revenueTrend.toFixed(1)}%
                  </Text>
                </div>
              </Group>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Group>
                <ThemeIcon size="lg" variant="light" color="blue">
                  <IconShoppingCart size={20} />
                </ThemeIcon>
                <div>
                  <Text size="xs" c="dimmed">Current Transactions</Text>
                  <Text size="lg" fw={600}>{data.transactionCount.toLocaleString()}</Text>
                  <Text size="xs" c="dimmed">
                    Previous: {data.comparison.previousTransactionCount.toLocaleString()}
                  </Text>
                  <Text 
                    size="sm" 
                    c={data.transactionTrend >= 0 ? 'green' : 'red'}
                    fw={500}
                  >
                    {data.transactionTrend >= 0 ? '+' : ''}{data.transactionTrend.toFixed(1)}%
                  </Text>
                </div>
              </Group>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Group>
                <ThemeIcon size="lg" variant="light" color="orange">
                  <IconTrendingUp size={20} />
                </ThemeIcon>
                <div>
                  <Text size="xs" c="dimmed">Current Avg Order</Text>
                  <Text size="lg" fw={600}>{formatCurrency(data.averageOrderValue)}</Text>
                  <Text size="xs" c="dimmed">
                    Previous: {formatCurrency(data.comparison.previousAverageOrderValue)}
                  </Text>
                  {data.comparison.previousAverageOrderValue > 0 && (
                    <Text 
                      size="sm" 
                      c={data.averageOrderValue >= data.comparison.previousAverageOrderValue ? 'green' : 'red'}
                      fw={500}
                    >
                      {data.averageOrderValue >= data.comparison.previousAverageOrderValue ? '+' : ''}
                      {(((data.averageOrderValue - data.comparison.previousAverageOrderValue) / data.comparison.previousAverageOrderValue) * 100).toFixed(1)}%
                    </Text>
                  )}
                </div>
              </Group>
            </Grid.Col>
          </Grid>
        </Grid.Col>
      </Grid>
    </div>
  );
}
