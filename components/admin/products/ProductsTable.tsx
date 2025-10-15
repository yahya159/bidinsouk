'use client';

import { useState } from 'react';
import {
  Table,
  TextInput,
  Select,
  NumberInput,
  Pagination,
  Badge,
  Group,
  Text,
  Box,
  Stack,
  Paper,
  Loader,
  Center,
} from '@mantine/core';
import { IconSearch, IconPackage } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { ProductCondition, ProductStatus } from '@prisma/client';

interface Product {
  id: string;
  title: string;
  brand: string | null;
  category: string | null;
  condition: ProductCondition;
  status: ProductStatus;
  price: number | null;
  views: number;
  createdAt: string;
  store: {
    id: string;
    name: string;
    seller: {
      user: {
        name: string;
        email: string;
      };
    };
  };
}

interface ProductsTableProps {
  products: Product[];
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSearch: (search: string) => void;
  onStoreFilter: (storeId: string | null) => void;
  onCategoryFilter: (category: string | null) => void;
  onStatusFilter: (status: string | null) => void;
  onPriceRangeFilter: (min: number | null, max: number | null) => void;
  loading?: boolean;
  stores?: Array<{ value: string; label: string }>;
  categories?: Array<{ value: string; label: string }>;
}

export function ProductsTable({
  products,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onSearch,
  onStoreFilter,
  onCategoryFilter,
  onStatusFilter,
  onPriceRangeFilter,
  loading = false,
  stores = [],
  categories = [],
}: ProductsTableProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');
  const [storeFilter, setStoreFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priceMin, setPriceMin] = useState<number | null>(null);
  const [priceMax, setPriceMax] = useState<number | null>(null);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    onSearch(value);
  };

  const handleStoreFilterChange = (value: string | null) => {
    setStoreFilter(value);
    onStoreFilter(value);
  };

  const handleCategoryFilterChange = (value: string | null) => {
    setCategoryFilter(value);
    onCategoryFilter(value);
  };

  const handleStatusFilterChange = (value: string | null) => {
    setStatusFilter(value);
    onStatusFilter(value);
  };

  const handlePriceMinChange = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    setPriceMin(numValue);
    onPriceRangeFilter(numValue, priceMax);
  };

  const handlePriceMaxChange = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    setPriceMax(numValue);
    onPriceRangeFilter(priceMin, numValue);
  };

  const handleRowClick = (productId: string) => {
    router.push(`/admin-dashboard/products/${productId}`);
  };

  const getStatusBadgeColor = (status: ProductStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'green';
      case 'DRAFT':
        return 'gray';
      case 'ARCHIVED':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getConditionBadgeColor = (condition: ProductCondition) => {
    return condition === 'NEW' ? 'blue' : 'orange';
  };

  const formatPrice = (price: number | null) => {
    if (price === null) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
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
        <Stack gap="md">
          <Group gap="md">
            <TextInput
              placeholder="Search by title or brand..."
              leftSection={<IconSearch size={16} />}
              value={searchValue}
              onChange={(e) => handleSearchChange(e.currentTarget.value)}
              style={{ flex: 1 }}
            />
          </Group>
          <Group gap="md">
            <Select
              placeholder="Filter by store"
              data={[{ value: '', label: 'All Stores' }, ...stores]}
              value={storeFilter}
              onChange={handleStoreFilterChange}
              clearable
              style={{ minWidth: 200 }}
            />
            <Select
              placeholder="Filter by category"
              data={[{ value: '', label: 'All Categories' }, ...categories]}
              value={categoryFilter}
              onChange={handleCategoryFilterChange}
              clearable
              style={{ minWidth: 200 }}
            />
            <Select
              placeholder="Filter by status"
              data={[
                { value: '', label: 'All Statuses' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'DRAFT', label: 'Draft' },
                { value: 'ARCHIVED', label: 'Archived' },
              ]}
              value={statusFilter}
              onChange={handleStatusFilterChange}
              clearable
              style={{ minWidth: 150 }}
            />
            <NumberInput
              placeholder="Min price"
              value={priceMin ?? ''}
              onChange={handlePriceMinChange}
              min={0}
              style={{ minWidth: 120 }}
            />
            <NumberInput
              placeholder="Max price"
              value={priceMax ?? ''}
              onChange={handlePriceMaxChange}
              min={0}
              style={{ minWidth: 120 }}
            />
          </Group>
        </Stack>
      </Paper>

      {/* Table */}
      <Paper withBorder>
        {loading ? (
          <Center p="xl">
            <Loader size="lg" />
          </Center>
        ) : products.length === 0 ? (
          <Center p="xl">
            <Stack align="center" gap="xs">
              <IconPackage size={48} stroke={1.5} color="gray" />
              <Text c="dimmed">No products found</Text>
            </Stack>
          </Center>
        ) : (
          <Box style={{ overflowX: 'auto' }}>
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Title</Table.Th>
                  <Table.Th>Vendor</Table.Th>
                  <Table.Th>Category</Table.Th>
                  <Table.Th>Condition</Table.Th>
                  <Table.Th>Price</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Views</Table.Th>
                  <Table.Th>Created</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {products.map((product) => (
                  <Table.Tr
                    key={product.id}
                    onClick={() => handleRowClick(product.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Table.Td>
                      <Text fw={500}>{product.title}</Text>
                      {product.brand && (
                        <Text size="xs" c="dimmed">
                          {product.brand}
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{product.store.name}</Text>
                      <Text size="xs" c="dimmed">
                        {product.store.seller.user.name}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{product.category || '-'}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={getConditionBadgeColor(product.condition)}
                        variant="light"
                        size="sm"
                      >
                        {product.condition}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={500}>
                        {formatPrice(product.price)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={getStatusBadgeColor(product.status)}
                        variant="light"
                      >
                        {product.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{product.views}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {formatDate(product.createdAt)}
                      </Text>
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
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Showing {(page - 1) * pageSize + 1} to{' '}
            {Math.min(page * pageSize, totalCount)} of {totalCount} products
          </Text>
          <Pagination total={totalPages} value={page} onChange={onPageChange} />
        </Group>
      )}
    </Stack>
  );
}
