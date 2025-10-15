'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Button,
  Group,
  Stack,
  Text,
  Badge,
  Paper,
} from '@mantine/core';
import { IconAlertTriangle, IconCheck, IconX } from '@tabler/icons-react';
import { ReportsTable } from '@/components/admin/reports/ReportsTable';
import { notifications } from '@mantine/notifications';
import { AbuseStatus } from '@prisma/client';

interface Reporter {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

interface TargetInfo {
  id: string;
  title?: string;
  name?: string;
  status?: string;
}

interface Report {
  id: string;
  reporter: Reporter;
  targetType: string;
  targetId: string;
  reason: string;
  details: string | null;
  status: AbuseStatus;
  createdAt: string;
  targetInfo?: TargetInfo | null;
}

export default function ReportsListPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    open: 0,
    reviewing: 0,
    resolved: 0,
    rejected: 0,
  });

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (search) {
        params.append('search', search);
      }

      if (statusFilter) {
        params.append('status', statusFilter);
      }

      if (typeFilter) {
        params.append('targetType', typeFilter);
      }

      const response = await fetch(`/api/admin/reports?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const data = await response.json();
      setReports(data.reports);
      setTotalCount(data.pagination.totalCount);
    } catch (error) {
      console.error('Error fetching reports:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load reports',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch counts for each status
      const [openRes, reviewingRes, resolvedRes, rejectedRes] = await Promise.all([
        fetch('/api/admin/reports?status=OPEN&pageSize=1'),
        fetch('/api/admin/reports?status=REVIEWING&pageSize=1'),
        fetch('/api/admin/reports?status=RESOLVED&pageSize=1'),
        fetch('/api/admin/reports?status=REJECTED&pageSize=1'),
      ]);

      const [openData, reviewingData, resolvedData, rejectedData] = await Promise.all([
        openRes.json(),
        reviewingRes.json(),
        resolvedRes.json(),
        rejectedRes.json(),
      ]);

      setStats({
        open: openData.pagination.totalCount,
        reviewing: reviewingData.pagination.totalCount,
        resolved: resolvedData.pagination.totalCount,
        rejected: rejectedData.pagination.totalCount,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [page, search, statusFilter, typeFilter]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSearch = (searchValue: string) => {
    setSearch(searchValue);
    setPage(1);
  };

  const handleStatusFilter = (status: string | null) => {
    setStatusFilter(status);
    setPage(1);
  };

  const handleTypeFilter = (type: string | null) => {
    setTypeFilter(type);
    setPage(1);
  };

  const handleQuickAction = async (action: 'resolve-all-open' | 'dismiss-all-rejected') => {
    // This would require a bulk action API endpoint
    notifications.show({
      title: 'Info',
      message: 'Bulk actions coming soon',
      color: 'blue',
    });
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between">
          <div>
            <Title order={2}>Abuse Reports</Title>
            <Text c="dimmed" size="sm">
              Manage and review abuse reports from users
            </Text>
          </div>
        </Group>

        {/* Stats Cards */}
        <Group grow>
          <Paper
            p="md"
            withBorder
            style={{ cursor: 'pointer' }}
            onClick={() => handleStatusFilter('OPEN')}
          >
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  Open Reports
                </Text>
                <Text size="xl" fw={700} mt={4}>
                  {stats.open}
                </Text>
              </div>
              <Badge color="red" variant="filled" size="lg">
                High Priority
              </Badge>
            </Group>
          </Paper>

          <Paper
            p="md"
            withBorder
            style={{ cursor: 'pointer' }}
            onClick={() => handleStatusFilter('REVIEWING')}
          >
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  Under Review
                </Text>
                <Text size="xl" fw={700} mt={4}>
                  {stats.reviewing}
                </Text>
              </div>
              <IconAlertTriangle size={32} color="orange" />
            </Group>
          </Paper>

          <Paper
            p="md"
            withBorder
            style={{ cursor: 'pointer' }}
            onClick={() => handleStatusFilter('RESOLVED')}
          >
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  Resolved
                </Text>
                <Text size="xl" fw={700} mt={4}>
                  {stats.resolved}
                </Text>
              </div>
              <IconCheck size={32} color="green" />
            </Group>
          </Paper>

          <Paper
            p="md"
            withBorder
            style={{ cursor: 'pointer' }}
            onClick={() => handleStatusFilter('REJECTED')}
          >
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  Dismissed
                </Text>
                <Text size="xl" fw={700} mt={4}>
                  {stats.rejected}
                </Text>
              </div>
              <IconX size={32} color="gray" />
            </Group>
          </Paper>
        </Group>

        {/* Quick Actions */}
        {stats.open > 0 && (
          <Paper p="md" withBorder bg="red.0">
            <Group justify="space-between">
              <div>
                <Text fw={500} c="red">
                  {stats.open} reports require attention
                </Text>
                <Text size="sm" c="dimmed">
                  Review open reports to maintain platform quality
                </Text>
              </div>
              <Button
                color="red"
                variant="light"
                onClick={() => handleStatusFilter('OPEN')}
              >
                View Open Reports
              </Button>
            </Group>
          </Paper>
        )}

        {/* Reports Table */}
        <ReportsTable
          reports={reports}
          totalCount={totalCount}
          page={page}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onSearch={handleSearch}
          onStatusFilter={handleStatusFilter}
          onTypeFilter={handleTypeFilter}
          loading={loading}
        />
      </Stack>
    </Container>
  );
}
