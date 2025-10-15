'use client';

import { useState } from 'react';
import {
  Table,
  Badge,
  TextInput,
  Select,
  Group,
  Text,
  Pagination,
  Stack,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconSearch, IconEye, IconEdit, IconTrash } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { AuctionStatus } from '@prisma/client';

interface Auction {
  id: string;
  title: string;
  currentBid: string;
  startPrice: string;
  status: AuctionStatus;
  endAt: Date;
  category: string | null;
  product: {
    id: string;
    title: string;
  } | null;
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
  bidCount: number;
  createdAt: Date;
}

interface AuctionsTableProps {
  initialAuctions: Auction[];
  initialTotalCount: number;
  initialPage: number;
  initialPageSize: number;
}

export function AuctionsTable({
  initialAuctions,
  initialTotalCount,
  initialPage,
  initialPageSize,
}: AuctionsTableProps) {
  const router = useRouter();
  const [auctions, setAuctions] = useState<Auction[]>(initialAuctions);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [page, setPage] = useState(initialPage);
  const [pageSize] = useState(initialPageSize);
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [storeId, setStoreId] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);

  const fetchAuctions = async (newPage?: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: (newPage || page).toString(),
        pageSize: pageSize.toString(),
      });

      if (search) params.append('search', search);
      if (storeId) params.append('storeId', storeId);
      if (status) params.append('status', status);
      if (category) params.append('category', category);
      if (dateRange[0]) params.append('dateFrom', dateRange[0].toISOString());
      if (dateRange[1]) params.append('dateTo', dateRange[1].toISOString());

      const response = await fetch(`/api/admin/auctions?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAuctions(data.auctions);
        setTotalCount(data.totalCount);
        setPage(data.page);
      }
    } catch (error) {
      console.error('Error fetching auctions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    fetchAuctions(newPage);
  };

  const handleSearch = () => {
    fetchAuctions(1);
  };

  const getStatusColor = (status: AuctionStatus) => {
    switch (status) {
      case 'SCHEDULED':
        return 'blue';
      case 'RUNNING':
        return 'green';
      case 'ENDING_SOON':
        return 'orange';
      case 'ENDED':
        return 'gray';
      case 'ARCHIVED':
        return 'dark';
      default:
        return 'gray';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <Stack gap="md">
      {/* Filters */}
      <Group>
        <TextInput
          placeholder="Search by product name..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          style={{ flex: 1 }}
        />
        <Select
          placeholder="Status"
          clearable
          value={status}
          onChange={(value) => setStatus(value || '')}
          data={[
            { value: 'SCHEDULED', label: 'Scheduled' },
            { value: 'RUNNING', label: 'Running' },
            { value: 'ENDING_SOON', label: 'Ending Soon' },
            { value: 'ENDED', label: 'Ended' },
            { value: 'ARCHIVED', label: 'Archived' },
          ]}
          style={{ width: 150 }}
        />
        <DatePickerInput
          type="range"
          placeholder="Date range"
          value={dateRange}
          onChange={setDateRange}
          clearable
          style={{ width: 250 }}
        />
      </Group>

      {/* Table */}
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Product</Table.Th>
            <Table.Th>Vendor</Table.Th>
            <Table.Th>Current Bid</Table.Th>
            <Table.Th>Start Price</Table.Th>
            <Table.Th>Bids</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>End Time</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {loading ? (
            <Table.Tr>
              <Table.Td colSpan={8}>
                <Text ta="center">Loading...</Text>
              </Table.Td>
            </Table.Tr>
          ) : auctions.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={8}>
                <Text ta="center">No auctions found</Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            auctions.map((auction) => (
              <Table.Tr
                key={auction.id}
                style={{ cursor: 'pointer' }}
                onClick={() => router.push(`/admin-dashboard/auctions/${auction.id}`)}
              >
                <Table.Td>
                  <Text size="sm" fw={500}>
                    {auction.product?.title || auction.title}
                  </Text>
                  {auction.category && (
                    <Text size="xs" c="dimmed">
                      {auction.category}
                    </Text>
                  )}
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{auction.store.name}</Text>
                  <Text size="xs" c="dimmed">
                    {auction.store.seller.user.name}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" fw={500}>
                    {formatCurrency(auction.currentBid)}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{formatCurrency(auction.startPrice)}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge variant="light">{auction.bidCount}</Badge>
                </Table.Td>
                <Table.Td>
                  <Badge color={getStatusColor(auction.status)}>
                    {auction.status.replace('_', ' ')}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{formatDate(auction.endAt)}</Text>
                </Table.Td>
                <Table.Td onClick={(e) => e.stopPropagation()}>
                  <Group gap="xs">
                    <Tooltip label="View">
                      <ActionIcon
                        variant="subtle"
                        onClick={() => router.push(`/admin-dashboard/auctions/${auction.id}`)}
                      >
                        <IconEye size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Edit">
                      <ActionIcon
                        variant="subtle"
                        onClick={() => router.push(`/admin-dashboard/auctions/${auction.id}/edit`)}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <Group justify="center">
          <Pagination
            total={totalPages}
            value={page}
            onChange={handlePageChange}
          />
        </Group>
      )}
    </Stack>
  );
}
