'use client';

import { useState } from 'react';
import {
  Table,
  TextInput,
  Select,
  Pagination,
  Badge,
  Group,
  Text,
  Box,
  Stack,
  Paper,
  Loader,
  Center,
  Avatar,
} from '@mantine/core';
import { IconSearch, IconAlertTriangle } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
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

interface ReportsTableProps {
  reports: Report[];
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSearch: (search: string) => void;
  onStatusFilter: (status: string | null) => void;
  onTypeFilter: (type: string | null) => void;
  loading?: boolean;
}

export function ReportsTable({
  reports,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onSearch,
  onStatusFilter,
  onTypeFilter,
  loading = false,
}: ReportsTableProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    onSearch(value);
  };

  const handleStatusFilterChange = (value: string | null) => {
    setStatusFilter(value);
    onStatusFilter(value);
  };

  const handleTypeFilterChange = (value: string | null) => {
    setTypeFilter(value);
    onTypeFilter(value);
  };

  const handleRowClick = (reportId: string) => {
    router.push(`/admin-dashboard/reports/${reportId}`);
  };

  const getStatusBadgeColor = (status: AbuseStatus) => {
    switch (status) {
      case 'OPEN':
        return 'red';
      case 'REVIEWING':
        return 'yellow';
      case 'RESOLVED':
        return 'green';
      case 'REJECTED':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const getPriorityBadge = (status: AbuseStatus) => {
    if (status === 'OPEN') {
      return (
        <Badge color="red" variant="filled" size="sm">
          High Priority
        </Badge>
      );
    }
    return null;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTargetDisplay = (report: Report) => {
    if (report.targetInfo) {
      return report.targetInfo.title || report.targetInfo.name || `${report.targetType} #${report.targetId}`;
    }
    return `${report.targetType} #${report.targetId}`;
  };

  return (
    <Stack gap="md">
      {/* Filters */}
      <Paper p="md" withBorder>
        <Group gap="md">
          <TextInput
            placeholder="Search by reason or details..."
            leftSection={<IconSearch size={16} />}
            value={searchValue}
            onChange={(e) => handleSearchChange(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="Filter by status"
            clearable
            value={statusFilter}
            onChange={handleStatusFilterChange}
            data={[
              { value: 'OPEN', label: 'Open' },
              { value: 'REVIEWING', label: 'Reviewing' },
              { value: 'RESOLVED', label: 'Resolved' },
              { value: 'REJECTED', label: 'Rejected' },
            ]}
            style={{ width: 200 }}
          />
          <Select
            placeholder="Filter by type"
            clearable
            value={typeFilter}
            onChange={handleTypeFilterChange}
            data={[
              { value: 'Product', label: 'Product' },
              { value: 'Auction', label: 'Auction' },
              { value: 'User', label: 'User' },
            ]}
            style={{ width: 200 }}
          />
        </Group>
      </Paper>

      {/* Table */}
      <Paper withBorder>
        {loading ? (
          <Center p="xl">
            <Loader />
          </Center>
        ) : reports.length === 0 ? (
          <Center p="xl">
            <Stack align="center" gap="xs">
              <IconAlertTriangle size={48} stroke={1.5} color="gray" />
              <Text c="dimmed">No reports found</Text>
            </Stack>
          </Center>
        ) : (
          <Box style={{ overflowX: 'auto' }}>
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Reporter</Table.Th>
                  <Table.Th>Reported Item</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Reason</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Priority</Table.Th>
                  <Table.Th>Date</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {reports.map((report) => (
                  <Table.Tr
                    key={report.id}
                    onClick={() => handleRowClick(report.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Table.Td>
                      <Group gap="sm">
                        <Avatar
                          src={report.reporter.avatarUrl}
                          size="sm"
                          radius="xl"
                        >
                          {report.reporter.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <div>
                          <Text size="sm" fw={500}>
                            {report.reporter.name}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {report.reporter.email}
                          </Text>
                        </div>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{getTargetDisplay(report)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" color="blue">
                        {report.targetType}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" lineClamp={2}>
                        {report.reason}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={getStatusBadgeColor(report.status)} variant="filled">
                        {report.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{getPriorityBadge(report.status)}</Table.Td>
                    <Table.Td>
                      <Text size="sm">{formatDate(report.createdAt)}</Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Box>
        )}
      </Paper>

      {/* Pagination */}
      {totalPages > 1 && (
        <Group justify="center">
          <Pagination
            value={page}
            onChange={onPageChange}
            total={totalPages}
          />
        </Group>
      )}

      {/* Summary */}
      <Group justify="space-between">
        <Text size="sm" c="dimmed">
          Showing {reports.length} of {totalCount} reports
        </Text>
        <Text size="sm" c="dimmed">
          Page {page} of {totalPages}
        </Text>
      </Group>
    </Stack>
  );
}
