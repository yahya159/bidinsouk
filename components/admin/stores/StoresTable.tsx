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
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { IconSearch, IconEye, IconEdit, IconTrash } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

type StoreStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';

interface Store {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: StoreStatus;
  createdAt: string;
  seller: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  _count?: {
    products: number;
    auctions: number;
    orders: number;
  };
}

interface StoresTableProps {
  stores: Store[];
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSearch: (search: string) => void;
  onStatusFilter: (status: string | null) => void;
  loading?: boolean;
  onDelete?: (storeId: string) => void;
}

export function StoresTable({
  stores,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onSearch,
  onStatusFilter,
  loading = false,
  onDelete,
}: StoresTableProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    onSearch(value);
  };

  const handleStatusFilterChange = (value: string | null) => {
    setStatusFilter(value);
    onStatusFilter(value);
  };

  const handleRowClick = (storeId: string) => {
    router.push(`/admin-dashboard/stores/${storeId}`);
  };

  const getStatusBadgeColor = (status: StoreStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'green';
      case 'SUSPENDED':
        return 'red';
      case 'PENDING':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Stack gap="md">
      {/* Filters */}
      <Paper p="md" withBorder>
        <Group gap="md">
          <TextInput
            placeholder="Search stores by name, email, or seller..."
            leftSection={<IconSearch size={16} />}
            value={searchValue}
            onChange={(e) => handleSearchChange(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="Filter by status"
            data={[
              { value: '', label: 'All Statuses' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'PENDING', label: 'Pending' },
              { value: 'SUSPENDED', label: 'Suspended' },
            ]}
            value={statusFilter}
            onChange={handleStatusFilterChange}
            clearable
            style={{ minWidth: 200 }}
          />
        </Group>
      </Paper>

      {/* Table */}
      <Paper withBorder>
        {loading ? (
          <Center p="xl">
            <Loader />
          </Center>
        ) : stores.length === 0 ? (
          <Center p="xl">
            <Text c="dimmed">No stores found</Text>
          </Center>
        ) : (
          <Box style={{ overflowX: 'auto' }}>
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Store Name</Table.Th>
                  <Table.Th>Seller</Table.Th>
                  <Table.Th>Contact</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Stats</Table.Th>
                  <Table.Th>Created</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {stores.map((store) => (
                  <Table.Tr
                    key={store.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleRowClick(store.id)}
                  >
                    <Table.Td>
                      <Text fw={500}>{store.name}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Stack gap={0}>
                        <Text size="sm">{store.seller.user.name}</Text>
                        <Text size="xs" c="dimmed">
                          {store.seller.user.email}
                        </Text>
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      <Stack gap={0}>
                        <Text size="sm">{store.email}</Text>
                        {store.phone && (
                          <Text size="xs" c="dimmed">
                            {store.phone}
                          </Text>
                        )}
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={getStatusBadgeColor(store.status)} variant="light">
                        {store.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {store._count && (
                        <Stack gap={0}>
                          <Text size="xs">
                            Products: {store._count.products}
                          </Text>
                          <Text size="xs">
                            Auctions: {store._count.auctions}
                          </Text>
                          <Text size="xs">
                            Orders: {store._count.orders}
                          </Text>
                        </Stack>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{formatDate(store.createdAt)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs" onClick={(e) => e.stopPropagation()}>
                        <Tooltip label="View Details">
                          <ActionIcon
                            variant="subtle"
                            color="blue"
                            onClick={() => handleRowClick(store.id)}
                          >
                            <IconEye size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Edit">
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            onClick={() => router.push(`/admin-dashboard/stores/${store.id}/edit`)}
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                        </Tooltip>
                        {onDelete && (
                          <Tooltip label="Delete">
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              onClick={() => onDelete(store.id)}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Tooltip>
                        )}
                      </Group>
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

      {/* Results info */}
      <Text size="sm" c="dimmed" ta="center">
        Showing {stores.length} of {totalCount} stores
      </Text>
    </Stack>
  );
}
