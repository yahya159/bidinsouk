'use client';

import { Grid, Title, Text, Table, Badge } from '@mantine/core';
import { IconPackage, IconEye, IconTrendingUp, IconShoppingBag } from '@tabler/icons-react';
import { PieChartComponent } from './PieChartComponent';
import { BarChartComponent } from './BarChartComponent';
import { LineChartComponent } from './LineChartComponent';
import { StatsCard } from '../shared/StatsCard';
import { format } from 'date-fns';

interface ProductAnalyticsData {
  totalProducts: number;
  newProducts: number;
  statusDistribution: {
    DRAFT: number;
    ACTIVE: number;
    ARCHIVED: number;
  };
  newProductsTrend: number;
  totalViews: number;
  averageViews: number;
  productsByCategory: Array<{
    category: string;
    count: number;
  }>;
  productsByCondition: {
    NEW: number;
    USED: number;
  };
  mostViewedProducts: Array<{
    id: string;
    title: string;
    views: number;
    status: string;
    storeName: string;
  }>;
  topSellingProducts: Array<{
    productId: string;
    title: string;
    bidCount: number;
    totalBidAmount: number;
  }>;
  dailyProductCreation: Array<{
    date: Date;
    count: number;
  }>;
}

interface ProductAnalyticsProps {
  data: ProductAnalyticsData;
}

export function ProductAnalytics({ data }: ProductAnalyticsProps) {
  // Prepare data for category distribution pie chart
  const categoryChartData = data.productsByCategory.map(item => ({
    name: item.category,
    value: item.count,
  }));

  // Prepare data for condition distribution
  const conditionChartData = [
    { name: 'New', value: data.productsByCondition.NEW },
    { name: 'Used', value: data.productsByCondition.USED },
  ];

  // Prepare data for daily product creation
  const dailyCreationData = data.dailyProductCreation.map(item => ({
    date: format(new Date(item.date), 'MMM dd'),
    products: item.count,
  }));

  // Prepare data for top categories bar chart (top 10)
  const topCategoriesData = data.productsByCategory.slice(0, 10).map(cat => ({
    category: cat.category.length > 20 
      ? cat.category.substring(0, 20) + '...' 
      : cat.category,
    count: cat.count,
  }));

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'green';
      case 'DRAFT':
        return 'yellow';
      case 'ARCHIVED':
        return 'gray';
      default:
        return 'blue';
    }
  };

  return (
    <div>
      <Title order={3} mb="md">Product Analytics</Title>

      {/* Stats Cards */}
      <Grid mb="xl">
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Total Products"
            value={data.totalProducts.toLocaleString()}
            icon={<IconPackage size={20} />}
            color="blue"
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="New Products"
            value={data.newProducts.toLocaleString()}
            icon={<IconShoppingBag size={20} />}
            color="green"
            trend={{
              value: data.newProductsTrend,
              label: 'vs previous period',
            }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Total Views"
            value={data.totalViews.toLocaleString()}
            icon={<IconEye size={20} />}
            color="violet"
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Avg Views/Product"
            value={data.averageViews.toFixed(1)}
            icon={<IconTrendingUp size={20} />}
            color="orange"
          />
        </Grid.Col>
      </Grid>

      {/* Charts */}
      <Grid mb="xl">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Title order={4} mb="sm">Product Creation Trends</Title>
          <LineChartComponent
            data={dailyCreationData}
            xKey="date"
            lines={[
              { key: 'products', name: 'New Products' },
            ]}
            height={300}
            formatTooltip={(value) => `${value} products`}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Title order={4} mb="sm">Product Condition</Title>
          <PieChartComponent
            data={conditionChartData}
            height={300}
            formatTooltip={(value) => `${value} products`}
          />
        </Grid.Col>
      </Grid>

      <Grid mb="xl">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Title order={4} mb="sm">Popular Categories</Title>
          <BarChartComponent
            data={topCategoriesData}
            xKey="category"
            bars={[
              { key: 'count', name: 'Products' },
            ]}
            height={350}
            layout="vertical"
            formatTooltip={(value) => `${value} products`}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Title order={4} mb="sm">Category Distribution</Title>
          <PieChartComponent
            data={categoryChartData}
            height={350}
            formatTooltip={(value) => `${value} products`}
          />
        </Grid.Col>
      </Grid>

      {/* Most Viewed Products Table */}
      <Grid mb="xl">
        <Grid.Col span={12}>
          <Title order={4} mb="sm">Most Viewed Products</Title>
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Product</Table.Th>
                <Table.Th>Store</Table.Th>
                <Table.Th>Views</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.mostViewedProducts.map((product) => (
                <Table.Tr key={product.id}>
                  <Table.Td>
                    <Text size="sm" fw={500}>
                      {product.title}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {product.storeName}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={600}>
                      {product.views.toLocaleString()}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={getStatusColor(product.status)} variant="light">
                      {product.status}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Grid.Col>
      </Grid>

      {/* Top Selling Products Table */}
      <Grid>
        <Grid.Col span={12}>
          <Title order={4} mb="sm">Top Selling Products (by Bids)</Title>
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Product</Table.Th>
                <Table.Th>Total Bids</Table.Th>
                <Table.Th>Total Bid Amount</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.topSellingProducts.map((product) => (
                <Table.Tr key={product.productId}>
                  <Table.Td>
                    <Text size="sm" fw={500}>
                      {product.title}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={600}>
                      {product.bidCount.toLocaleString()}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={600} c="green">
                      ${product.totalBidAmount.toLocaleString()}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Grid.Col>
      </Grid>
    </div>
  );
}
