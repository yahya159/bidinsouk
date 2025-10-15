'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  Badge,
  TextInput,
  Select,
  Group,
  Stack,
  Button,
  Pagination,
  Text,
  Paper,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconSearch, IconEye, IconFilter, IconX } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

interface Order {
  id: string;
  number: string;
  total: number;
  status: string;
  fulfillStatus: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  store: {
    id: string;
    name: string;
    seller: {
      id: string;
      name: string;
      email: string;
    };
  };
}

interface OrdersTableProps {
  initialOrders?: Order[];
  initialTotal?: number;
}

const ORDER_STATUSES = [
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'REFUSED', label: 'Refused' },
  { value: 'CANCELED_AFTER_CONFIRM', label: 'Canceled' },
];

const FULFILL_STATUSES = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'PREPARING', label: 'Preparing' },
  { value: 'READY_FOR_PICKUP', label: 'Ready for Pickup' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELED', label: 'Canceled' },
];

export function OrdersTable({ initialOrders = [], initialTotal = 0 }: OrdersTableProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [fulfillStatus, setFulfillStatus] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (search) params.append('search', search);
      if (status) params.append('status', status);
      if (fulfillStatus) params.append('fulfillStatus', fulfillStatus);
      if (dateFrom) params.append('dateFrom', dateFrom.toISOString());
      if (dateTo) params.append('dateTo', dateTo.toISOString());
      if (amountMin) params.append('amountMin', amountMin);
      if (amountMax) params.append('amountMax', amountMax);

      const response = await fetch(`/api/admin/orders?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data.orders);
      setTotal(data.total);
    } catch (error) {
      console.error('Error fetching orders:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to fetch orders',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchOrders();
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatus(null);
    setFulfillStatus(null);
    setDateFrom(null);
    setDateTo(null);
    setAmountMin('');
    setAmountMax('');
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'green';
      case 'REFUSED':
        return 'red';
      case 'CANCELED_AFTER_CONFIRM':
        return 'gray';
      default:
        return 'blue';
    }
  };

  const getFulfillStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'yellow';
      case 'PREPARING':
        return 'blue';
      case 'READY_FOR_PICKUP':
        return 'cyan';
      case 'SHIPPED':
        return 'indigo';
      case 'DELIVERED':
        return 'green';
      case 'CANCELED':
        return 'red';
      default:
        return 'gray';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Stack gap="md">
      <Paper p="md" withBorder>
        <Stack gap="md">
          <Group justify="space-between">
            <TextInput
              placeholder="Search by order number..."
              leftSection={<IconSearch size={16} />}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              style={{ flex: 1, maxWidth: 400 }}
            />
            <Group>
              <Button
                variant={showFilters ? 'filled' : 'light'}
                leftSection={<IconFilter size={16} />}
                onClick={() => setShowFilters(!showFilters)}
              >
                Filters
              </Button>
              <Button onClick={handleSearch} loading={loading}>
                Search
              </Button>
            </Group>
          </Group>

          {showFilters && (
            <Stack gap="sm">
              <Group grow>
                <Select
                  label="Order Status"
                  placeholder="All statuses"
                  data={ORDER_STATUSES}
                  value={status}
                  onChange={setStatus}
                  clearable
                />
                <Select
                  label="Fulfillment Status"
                  placeholder="All statuses"
                  data={FULFILL_STATUSES}
                  value={fulfillStatus}
                  onChange={setFulfillStatus}
                  clearable
                />
              </Group>
              <Group grow>
                <DatePickerInput
                  label="Date From"
                  placeholder="Select date"
                  value={dateFrom}
                  onChange={setDateFrom}
                  clearable
                />
                <DatePickerInput
                  label="Date To"
                  placeholder="Select date"
                  value={dateTo}
                  onChange={setDateTo}
                  clearable
                />
              </Group>
              <Group grow>
                <TextInput
                  label="Min Amount"
                  placeholder="0.00"
                  value={amountMin}
                  onChange={(e) => setAmountMin(e.currentTarget.value)}
                  type="number"
                  min="0"
                  step="0.01"
                />
                <TextInput
                  label="Max Amount"
                  placeholder="0.00"
                  value={amountMax}
                  onChange={(e) => setAmountMax(e.currentTarget.value)}
                  type="number"
                  min="0"
                  step="0.01"
                />
              </Group>
              <Group justify="flex-end">
                <Button
                  variant="subtle"
                  leftSection={<IconX size={16} />}
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </Button>
              </Group>
            </Stack>
          )}
        </Stack>
      </Paper>

      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Order Number</Table.Th>
              <Table.Th>Buyer</Table.Th>
              <Table.Th>Seller</Table.Th>
              <Table.Th>Amount</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Fulfillment</Table.Th>
              <Table.Th>Date</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {loading ? (
              <Table.Tr>
                <Table.Td colSpan={8}>
                  <Text ta="center" py="xl">Loading...</Text>
                </Table.Td>
              </Table.Tr>
            ) : orders.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={8}>
                  <Text ta="center" py="xl">No orders found</Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              orders.map((order) => (
                <Table.Tr
                  key={order.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => router.push(`/admin-dashboard/orders/${order.id}`)}
                >
                  <Table.Td>
                    <Text fw={500}>{order.number}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Stack gap={0}>
                      <Text size="sm">{order.user.name}</Text>
                      <Text size="xs" c="dimmed">{order.user.email}</Text>
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Stack gap={0}>
                      <Text size="sm">{order.store.name}</Text>
                      <Text size="xs" c="dimmed">{order.store.seller.name}</Text>
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Text fw={500}>{formatCurrency(order.total)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={getStatusColor(order.status)} variant="light">
                      {order.status.replace(/_/g, ' ')}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={getFulfillStatusColor(order.fulfillStatus)} variant="light">
                      {order.fulfillStatus.replace(/_/g, ' ')}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{formatDate(order.createdAt)}</Text>
                  </Table.Td>
                  <Table.Td onClick={(e) => e.stopPropagation()}>
                    <Tooltip label="View Details">
                      <ActionIcon
                        variant="subtle"
                        onClick={() => router.push(`/admin-dashboard/orders/${order.id}`)}
                      >
                        <IconEye size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      {total > pageSize && (
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} orders
          </Text>
          <Pagination
            value={page}
            onChange={handlePageChange}
            total={Math.ceil(total / pageSize)}
          />
        </Group>
      )}
    </Stack>
  );
}
