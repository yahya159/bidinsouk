'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Tabs,
  Group,
  Button,
  Loader,
  Center,
  Alert,
  Paper,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import {
  IconChartBar,
  IconUsers,
  IconCurrencyDollar,
  IconPackage,
  IconDownload,
  IconAlertCircle,
} from '@tabler/icons-react';
import { UserAnalytics } from '@/components/admin/analytics/UserAnalytics';
import { RevenueAnalytics } from '@/components/admin/analytics/RevenueAnalytics';
import { ProductAnalytics } from '@/components/admin/analytics/ProductAnalytics';
import { notifications } from '@mantine/notifications';

export function AnalyticsPageClient() {
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    new Date(), // today
  ]);
  const [activeTab, setActiveTab] = useState<string | null>('users');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [userAnalytics, setUserAnalytics] = useState<any>(null);
  const [revenueAnalytics, setRevenueAnalytics] = useState<any>(null);
  const [productAnalytics, setProductAnalytics] = useState<any>(null);

  // Fetch analytics data
  const fetchAnalytics = async () => {
    if (!dateRange[0] || !dateRange[1]) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        startDate: dateRange[0].toISOString(),
        endDate: dateRange[1].toISOString(),
      });

      // Fetch all analytics in parallel
      const [usersRes, revenueRes, productsRes] = await Promise.all([
        fetch(`/api/admin/analytics/users?${params}`),
        fetch(`/api/admin/analytics/revenue?${params}`),
        fetch(`/api/admin/analytics/products?${params}`),
      ]);

      if (!usersRes.ok || !revenueRes.ok || !productsRes.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const [usersData, revenueData, productsData] = await Promise.all([
        usersRes.json(),
        revenueRes.json(),
        productsRes.json(),
      ]);

      setUserAnalytics(usersData);
      setRevenueAnalytics(revenueData);
      setProductAnalytics(productsData);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data. Please try again.');
      notifications.show({
        title: 'Error',
        message: 'Failed to load analytics data',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch analytics on mount and when date range changes
  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  // Export report
  const handleExportReport = async () => {
    try {
      notifications.show({
        title: 'Exporting Report',
        message: 'Preparing your analytics report...',
        color: 'blue',
        loading: true,
        autoClose: false,
        id: 'export-report',
      });

      // Create a comprehensive report object
      const report = {
        dateRange: {
          start: dateRange[0]?.toISOString(),
          end: dateRange[1]?.toISOString(),
        },
        userAnalytics,
        revenueAnalytics,
        productAnalytics,
        generatedAt: new Date().toISOString(),
      };

      // Convert to JSON and download
      const blob = new Blob([JSON.stringify(report, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${dateRange[0]?.toISOString().split('T')[0]}-to-${dateRange[1]?.toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      notifications.update({
        id: 'export-report',
        title: 'Success',
        message: 'Report exported successfully',
        color: 'green',
        loading: false,
        autoClose: 3000,
      });
    } catch (err) {
      console.error('Error exporting report:', err);
      notifications.update({
        id: 'export-report',
        title: 'Error',
        message: 'Failed to export report',
        color: 'red',
        loading: false,
        autoClose: 3000,
      });
    }
  };

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <Title order={1}>Analytics & Reports</Title>
        <Group>
          <DatePickerInput
            type="range"
            placeholder="Select date range"
            value={dateRange}
            onChange={setDateRange}
            maxDate={new Date()}
            clearable
            style={{ width: 300 }}
          />
          <Button
            leftSection={<IconDownload size={16} />}
            onClick={handleExportReport}
            disabled={!userAnalytics || !revenueAnalytics || !productAnalytics}
          >
            Export Report
          </Button>
        </Group>
      </Group>

      {error && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Error"
          color="red"
          mb="xl"
          withCloseButton
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {loading ? (
        <Center h={400}>
          <Loader size="lg" />
        </Center>
      ) : (
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="users" leftSection={<IconUsers size={16} />}>
              User Analytics
            </Tabs.Tab>
            <Tabs.Tab value="revenue" leftSection={<IconCurrencyDollar size={16} />}>
              Revenue Analytics
            </Tabs.Tab>
            <Tabs.Tab value="products" leftSection={<IconPackage size={16} />}>
              Product Analytics
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="users" pt="xl">
            {userAnalytics ? (
              <UserAnalytics data={userAnalytics} />
            ) : (
              <Center h={200}>
                <Loader />
              </Center>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="revenue" pt="xl">
            {revenueAnalytics ? (
              <RevenueAnalytics data={revenueAnalytics} />
            ) : (
              <Center h={200}>
                <Loader />
              </Center>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="products" pt="xl">
            {productAnalytics ? (
              <ProductAnalytics data={productAnalytics} />
            ) : (
              <Center h={200}>
                <Loader />
              </Center>
            )}
          </Tabs.Panel>
        </Tabs>
      )}
    </Container>
  );
}
