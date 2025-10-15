'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Group,
  Button,
  Menu,
  ActionIcon,
  Indicator,
  Text,
  Alert,
} from '@mantine/core';
import {
  IconDownload,
  IconFilter,
  IconRefresh,
  IconAlertCircle,
} from '@tabler/icons-react';
import { ActivityLogsTable } from '@/components/admin/activity-logs/ActivityLogsTable';
import { LogFilters, FilterValues } from '@/components/admin/activity-logs/LogFilters';
import { notifications } from '@mantine/notifications';

interface ActivityLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: any;
  diff: any;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  actorRole: string;
}

interface LogsResponse {
  logs: ActivityLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpened, setFiltersOpened] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string | null>(null);
  const [entityFilter, setEntityFilter] = useState<string | null>(null);
  const [ipFilter, setIpFilter] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [advancedFilters, setAdvancedFilters] = useState<FilterValues>({
    actions: [],
    entities: [],
    ipAddress: '',
    dateFrom: null,
    dateTo: null,
  });

  // Fetch logs
  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      // Add filters
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      // Use advanced filters if available, otherwise use simple filters
      if (advancedFilters.actions.length > 0) {
        advancedFilters.actions.forEach((action) => {
          params.append('action', action);
        });
      } else if (actionFilter) {
        params.append('action', actionFilter);
      }

      if (advancedFilters.entities.length > 0) {
        advancedFilters.entities.forEach((entity) => {
          params.append('entity', entity);
        });
      } else if (entityFilter) {
        params.append('entity', entityFilter);
      }

      if (advancedFilters.ipAddress) {
        params.append('ipAddress', advancedFilters.ipAddress);
      } else if (ipFilter) {
        params.append('ipAddress', ipFilter);
      }

      if (advancedFilters.dateFrom) {
        params.append('dateFrom', advancedFilters.dateFrom.toISOString());
      } else if (dateFrom) {
        params.append('dateFrom', dateFrom.toISOString());
      }

      if (advancedFilters.dateTo) {
        params.append('dateTo', advancedFilters.dateTo.toISOString());
      } else if (dateTo) {
        params.append('dateTo', dateTo.toISOString());
      }

      const response = await fetch(`/api/admin/activity-logs?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch activity logs');
      }

      const data: LogsResponse = await response.json();
      setLogs(data.logs);
      setTotal(data.total);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      notifications.show({
        title: 'Error',
        message: 'Failed to fetch activity logs',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch logs on mount and when filters change
  useEffect(() => {
    fetchLogs();
  }, [
    page,
    searchQuery,
    actionFilter,
    entityFilter,
    ipFilter,
    dateFrom,
    dateTo,
    advancedFilters,
  ]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Handle search
  const handleSearch = (search: string) => {
    setSearchQuery(search);
    setPage(1); // Reset to first page
  };

  // Handle simple filters
  const handleFilterAction = (action: string | null) => {
    setActionFilter(action);
    setPage(1);
  };

  const handleFilterEntity = (entity: string | null) => {
    setEntityFilter(entity);
    setPage(1);
  };

  const handleFilterIpAddress = (ip: string | null) => {
    setIpFilter(ip);
    setPage(1);
  };

  const handleDateRangeChange = (from: Date | null, to: Date | null) => {
    setDateFrom(from);
    setDateTo(to);
    setPage(1);
  };

  // Handle advanced filters
  const handleApplyAdvancedFilters = (filters: FilterValues) => {
    setAdvancedFilters(filters);
    // Clear simple filters when using advanced filters
    setActionFilter(null);
    setEntityFilter(null);
    setIpFilter(null);
    setDateFrom(null);
    setDateTo(null);
    setPage(1);
  };

  // Handle export
  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const params = new URLSearchParams();

      // Add current filters to export
      if (advancedFilters.actions.length > 0) {
        advancedFilters.actions.forEach((action) => {
          params.append('action', action);
        });
      } else if (actionFilter) {
        params.append('action', actionFilter);
      }

      if (advancedFilters.entities.length > 0) {
        advancedFilters.entities.forEach((entity) => {
          params.append('entity', entity);
        });
      } else if (entityFilter) {
        params.append('entity', entityFilter);
      }

      if (advancedFilters.ipAddress) {
        params.append('ipAddress', advancedFilters.ipAddress);
      } else if (ipFilter) {
        params.append('ipAddress', ipFilter);
      }

      if (advancedFilters.dateFrom) {
        params.append('dateFrom', advancedFilters.dateFrom.toISOString());
      } else if (dateFrom) {
        params.append('dateFrom', dateFrom.toISOString());
      }

      if (advancedFilters.dateTo) {
        params.append('dateTo', advancedFilters.dateTo.toISOString());
      } else if (dateTo) {
        params.append('dateTo', dateTo.toISOString());
      }

      params.append('format', format);

      const response = await fetch(`/api/admin/activity-logs/export?${params}`);

      if (!response.ok) {
        throw new Error('Failed to export logs');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity-logs-${new Date().toISOString()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      notifications.show({
        title: 'Success',
        message: `Logs exported as ${format.toUpperCase()}`,
        color: 'green',
      });
    } catch (err) {
      console.error('Error exporting logs:', err);
      notifications.show({
        title: 'Error',
        message: 'Failed to export logs',
        color: 'red',
      });
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchLogs();
    notifications.show({
      title: 'Refreshed',
      message: 'Activity logs refreshed',
      color: 'blue',
    });
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    actionFilter !== null ||
    entityFilter !== null ||
    ipFilter !== null ||
    dateFrom !== null ||
    dateTo !== null ||
    advancedFilters.actions.length > 0 ||
    advancedFilters.entities.length > 0 ||
    advancedFilters.ipAddress !== '';

  return (
    <Container size="xl" py="xl">
      {/* Header */}
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2}>Activity Logs</Title>
          <Text size="sm" c="dimmed" mt={4}>
            Monitor all system activities and user actions
          </Text>
        </div>

        <Group>
          {/* Real-time indicator */}
          <Indicator
            color="green"
            processing
            size={8}
            label={`Updated ${lastUpdated.toLocaleTimeString()}`}
          >
            <ActionIcon
              variant="light"
              size="lg"
              onClick={handleRefresh}
              loading={loading}
            >
              <IconRefresh size={18} />
            </ActionIcon>
          </Indicator>

          {/* Advanced Filters Button */}
          <Button
            leftSection={<IconFilter size={16} />}
            variant={hasActiveFilters ? 'filled' : 'light'}
            onClick={() => setFiltersOpened(true)}
          >
            {hasActiveFilters ? 'Filters Active' : 'Advanced Filters'}
          </Button>

          {/* Export Menu */}
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <Button leftSection={<IconDownload size={16} />} variant="light">
                Export
              </Button>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>Export Format</Menu.Label>
              <Menu.Item onClick={() => handleExport('csv')}>
                Export as CSV
              </Menu.Item>
              <Menu.Item onClick={() => handleExport('json')}>
                Export as JSON
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>

      {/* Error Alert */}
      {error && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Error"
          color="red"
          mb="md"
          withCloseButton
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Activity Logs Table */}
      <ActivityLogsTable
        logs={logs}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        onFilterAction={handleFilterAction}
        onFilterEntity={handleFilterEntity}
        onFilterIpAddress={handleFilterIpAddress}
        onDateRangeChange={handleDateRangeChange}
        loading={loading}
      />

      {/* Advanced Filters Drawer */}
      <LogFilters
        opened={filtersOpened}
        onClose={() => setFiltersOpened(false)}
        onApplyFilters={handleApplyAdvancedFilters}
        initialFilters={advancedFilters}
      />
    </Container>
  );
}
