'use client';

import { useState } from 'react';
import {
  Table,
  TextInput,
  Select,
  Pagination,
  Badge,
  Text,
  Group,
  Stack,
  Accordion,
  Code,
  Box,
  Paper,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconSearch, IconFilter, IconChevronDown } from '@tabler/icons-react';
import { formatDistanceToNow } from 'date-fns';

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

interface ActivityLogsTableProps {
  logs: ActivityLog[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSearch: (search: string) => void;
  onFilterAction: (action: string | null) => void;
  onFilterEntity: (entity: string | null) => void;
  onFilterIpAddress: (ip: string | null) => void;
  onDateRangeChange: (dateFrom: Date | null, dateTo: Date | null) => void;
  loading?: boolean;
}

// Action type options for filtering
const ACTION_TYPES = [
  { value: 'USER_CREATED', label: 'User Created' },
  { value: 'USER_UPDATED', label: 'User Updated' },
  { value: 'USER_DELETED', label: 'User Deleted' },
  { value: 'USER_ROLE_CHANGED', label: 'User Role Changed' },
  { value: 'USER_SUSPENDED', label: 'User Suspended' },
  { value: 'USER_ACTIVATED', label: 'User Activated' },
  { value: 'PRODUCT_CREATED', label: 'Product Created' },
  { value: 'PRODUCT_UPDATED', label: 'Product Updated' },
  { value: 'PRODUCT_DELETED', label: 'Product Deleted' },
  { value: 'PRODUCT_STATUS_CHANGED', label: 'Product Status Changed' },
  { value: 'AUCTION_CREATED', label: 'Auction Created' },
  { value: 'AUCTION_UPDATED', label: 'Auction Updated' },
  { value: 'AUCTION_DELETED', label: 'Auction Deleted' },
  { value: 'AUCTION_EXTENDED', label: 'Auction Extended' },
  { value: 'AUCTION_ENDED_EARLY', label: 'Auction Ended Early' },
  { value: 'ORDER_STATUS_UPDATED', label: 'Order Status Updated' },
  { value: 'ORDER_REFUNDED', label: 'Order Refunded' },
  { value: 'STORE_CREATED', label: 'Store Created' },
  { value: 'STORE_UPDATED', label: 'Store Updated' },
  { value: 'STORE_DELETED', label: 'Store Deleted' },
  { value: 'STORE_APPROVED', label: 'Store Approved' },
  { value: 'STORE_REJECTED', label: 'Store Rejected' },
  { value: 'ADMIN_LOGIN', label: 'Admin Login' },
  { value: 'ADMIN_LOGOUT', label: 'Admin Logout' },
  { value: 'SETTINGS_UPDATED', label: 'Settings Updated' },
];

// Entity type options for filtering
const ENTITY_TYPES = [
  { value: 'User', label: 'User' },
  { value: 'Product', label: 'Product' },
  { value: 'Auction', label: 'Auction' },
  { value: 'Order', label: 'Order' },
  { value: 'Store', label: 'Store' },
  { value: 'Settings', label: 'Settings' },
];

// Get badge color based on action type
function getActionColor(action: string): string {
  if (action.includes('CREATED')) return 'green';
  if (action.includes('UPDATED')) return 'blue';
  if (action.includes('DELETED')) return 'red';
  if (action.includes('APPROVED')) return 'teal';
  if (action.includes('REJECTED')) return 'orange';
  if (action.includes('SUSPENDED')) return 'red';
  if (action.includes('ACTIVATED')) return 'green';
  if (action.includes('LOGIN')) return 'cyan';
  if (action.includes('LOGOUT')) return 'gray';
  return 'gray';
}

// Format action name for display
function formatActionName(action: string): string {
  return action
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

export function ActivityLogsTable({
  logs,
  total,
  page,
  pageSize,
  onPageChange,
  onSearch,
  onFilterAction,
  onFilterEntity,
  onFilterIpAddress,
  onDateRangeChange,
  loading = false,
}: ActivityLogsTableProps) {
  const [searchValue, setSearchValue] = useState('');
  const [actionFilter, setActionFilter] = useState<string | null>(null);
  const [entityFilter, setEntityFilter] = useState<string | null>(null);
  const [ipFilter, setIpFilter] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  const totalPages = Math.ceil(total / pageSize);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    onSearch(value);
  };

  const handleActionFilterChange = (value: string | null) => {
    setActionFilter(value);
    onFilterAction(value);
  };

  const handleEntityFilterChange = (value: string | null) => {
    setEntityFilter(value);
    onFilterEntity(value);
  };

  const handleIpFilterChange = (value: string) => {
    setIpFilter(value);
    onFilterIpAddress(value || null);
  };

  const handleDateFromChange = (value: Date | null) => {
    setDateFrom(value);
    onDateRangeChange(value, dateTo);
  };

  const handleDateToChange = (value: Date | null) => {
    setDateTo(value);
    onDateRangeChange(dateFrom, value);
  };

  const toggleRowExpansion = (logId: string) => {
    setExpandedRows((prev) =>
      prev.includes(logId)
        ? prev.filter((id) => id !== logId)
        : [...prev, logId]
    );
  };

  return (
    <Stack gap="md">
      {/* Filters */}
      <Paper p="md" withBorder>
        <Stack gap="md">
          <Group grow>
            <TextInput
              placeholder="Search by actor name or email..."
              leftSection={<IconSearch size={16} />}
              value={searchValue}
              onChange={(e) => handleSearchChange(e.currentTarget.value)}
            />
            <Select
              placeholder="Filter by action"
              data={ACTION_TYPES}
              value={actionFilter}
              onChange={handleActionFilterChange}
              clearable
              searchable
              leftSection={<IconFilter size={16} />}
            />
          </Group>

          <Group grow>
            <Select
              placeholder="Filter by entity type"
              data={ENTITY_TYPES}
              value={entityFilter}
              onChange={handleEntityFilterChange}
              clearable
              searchable
              leftSection={<IconFilter size={16} />}
            />
            <TextInput
              placeholder="Filter by IP address"
              value={ipFilter}
              onChange={(e) => handleIpFilterChange(e.currentTarget.value)}
              leftSection={<IconFilter size={16} />}
            />
          </Group>

          <Group grow>
            <DatePickerInput
              placeholder="From date"
              value={dateFrom}
              onChange={handleDateFromChange}
              clearable
            />
            <DatePickerInput
              placeholder="To date"
              value={dateTo}
              onChange={handleDateToChange}
              clearable
            />
          </Group>
        </Stack>
      </Paper>

      {/* Table */}
      <Paper withBorder>
        <Table.ScrollContainer minWidth={800}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Timestamp</Table.Th>
                <Table.Th>Actor</Table.Th>
                <Table.Th>Action</Table.Th>
                <Table.Th>Entity</Table.Th>
                <Table.Th>IP Address</Table.Th>
                <Table.Th>Details</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loading ? (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text ta="center" c="dimmed">
                      Loading...
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : logs.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text ta="center" c="dimmed">
                      No activity logs found
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                logs.map((log) => (
                  <>
                    <Table.Tr key={log.id}>
                      <Table.Td>
                        <Stack gap={4}>
                          <Text size="sm">
                            {new Date(log.timestamp).toLocaleString()}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {formatDistanceToNow(new Date(log.timestamp), {
                              addSuffix: true,
                            })}
                          </Text>
                        </Stack>
                      </Table.Td>
                      <Table.Td>
                        <Stack gap={4}>
                          <Text size="sm" fw={500}>
                            {log.actorName}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {log.actorEmail}
                          </Text>
                          <Badge size="xs" variant="light">
                            {log.actorRole}
                          </Badge>
                        </Stack>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={getActionColor(log.action)} variant="light">
                          {formatActionName(log.action)}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Stack gap={4}>
                          <Text size="sm" fw={500}>
                            {log.entity}
                          </Text>
                          <Text size="xs" c="dimmed">
                            ID: {log.entityId}
                          </Text>
                        </Stack>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" ff="monospace">
                          {log.ipAddress || 'N/A'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Tooltip label="View details">
                          <ActionIcon
                            variant="subtle"
                            onClick={() => toggleRowExpansion(log.id)}
                          >
                            <IconChevronDown
                              size={16}
                              style={{
                                transform: expandedRows.includes(log.id)
                                  ? 'rotate(180deg)'
                                  : 'rotate(0deg)',
                                transition: 'transform 0.2s',
                              }}
                            />
                          </ActionIcon>
                        </Tooltip>
                      </Table.Td>
                    </Table.Tr>
                    {expandedRows.includes(log.id) && (
                      <Table.Tr>
                        <Table.Td colSpan={6}>
                          <Box p="md" bg="gray.0">
                            <Stack gap="sm">
                              {log.userAgent && (
                                <div>
                                  <Text size="sm" fw={500} mb={4}>
                                    User Agent:
                                  </Text>
                                  <Code block>{log.userAgent}</Code>
                                </div>
                              )}
                              {log.metadata && Object.keys(log.metadata).length > 0 && (
                                <div>
                                  <Text size="sm" fw={500} mb={4}>
                                    Metadata:
                                  </Text>
                                  <Code block>
                                    {JSON.stringify(log.metadata, null, 2)}
                                  </Code>
                                </div>
                              )}
                              {log.diff && Object.keys(log.diff).length > 0 && (
                                <div>
                                  <Text size="sm" fw={500} mb={4}>
                                    Changes:
                                  </Text>
                                  <Code block>
                                    {JSON.stringify(log.diff, null, 2)}
                                  </Code>
                                </div>
                              )}
                            </Stack>
                          </Box>
                        </Table.Td>
                      </Table.Tr>
                    )}
                  </>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>

      {/* Pagination */}
      {totalPages > 1 && (
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Showing {(page - 1) * pageSize + 1} to{' '}
            {Math.min(page * pageSize, total)} of {total} logs
          </Text>
          <Pagination
            total={totalPages}
            value={page}
            onChange={onPageChange}
          />
        </Group>
      )}
    </Stack>
  );
}
