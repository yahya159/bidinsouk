'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Stack,
  Tabs,
  Alert,
  Loader,
  Center,
  Paper,
} from '@mantine/core';
import { IconPlus, IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { StoresTable } from '@/components/admin/stores/StoresTable';
import { ConfirmDialog } from '@/components/admin/shared/ConfirmDialog';
import { notifications } from '@mantine/notifications';

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

export default function StoresPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string | null>('all');
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<string | null>(null);

  const fetchStores = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await fetch(`/api/admin/stores?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setStores(data.stores || []);
        setTotalCount(data.pagination?.totalCount || 0);
      } else {
        const errorData = await response.json();
        notifications.show({
          title: 'Error',
          message: errorData.error || 'Failed to fetch stores',
          color: 'red',
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to connect to server',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, [page, search, statusFilter]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSearch = (searchValue: string) => {
    setSearch(searchValue);
    setPage(1); // Reset to first page on search
  };

  const handleStatusFilter = (status: string | null) => {
    setStatusFilter(status);
    setPage(1); // Reset to first page on filter
  };

  const handleDelete = (storeId: string) => {
    setStoreToDelete(storeId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!storeToDelete) return;

    try {
      const response = await fetch(`/api/admin/stores/${storeToDelete}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: 'Store deleted successfully',
          color: 'green',
          icon: <IconCheck size={16} />,
        });
        fetchStores(); // Refresh the list
      } else {
        const errorData = await response.json();
        notifications.show({
          title: 'Error',
          message: errorData.error || 'Failed to delete store',
          color: 'red',
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to connect to server',
        color: 'red',
      });
    } finally {
      setDeleteDialogOpen(false);
      setStoreToDelete(null);
    }
  };

  const handleBulkApprove = async () => {
    // TODO: Implement bulk approve functionality
    notifications.show({
      title: 'Info',
      message: 'Bulk approve functionality coming soon',
      color: 'blue',
    });
  };

  const handleBulkReject = async () => {
    // TODO: Implement bulk reject functionality
    notifications.show({
      title: 'Info',
      message: 'Bulk reject functionality coming soon',
      color: 'blue',
    });
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between">
          <div>
            <Title order={1}>Store Management</Title>
            <Text c="dimmed" size="sm">
              Manage all stores on the platform
            </Text>
          </div>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => router.push('/admin-dashboard/stores/new')}
          >
            Create Store
          </Button>
        </Group>

        {/* Tabs */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="all">All Stores</Tabs.Tab>
            <Tabs.Tab value="pending">Pending Approval</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="all" pt="lg">
            <StoresTable
              stores={stores}
              totalCount={totalCount}
              page={page}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onSearch={handleSearch}
              onStatusFilter={handleStatusFilter}
              loading={loading}
              onDelete={handleDelete}
            />
          </Tabs.Panel>

          <Tabs.Panel value="pending" pt="lg">
            <Paper p="md" withBorder>
              <Stack gap="md">
                <Group justify="space-between">
                  <Text fw={500}>Pending Stores</Text>
                  <Group gap="xs">
                    <Button
                      size="sm"
                      color="green"
                      onClick={handleBulkApprove}
                      disabled={loading}
                    >
                      Bulk Approve
                    </Button>
                    <Button
                      size="sm"
                      color="red"
                      variant="outline"
                      onClick={handleBulkReject}
                      disabled={loading}
                    >
                      Bulk Reject
                    </Button>
                  </Group>
                </Group>

                {loading ? (
                  <Center p="xl">
                    <Loader />
                  </Center>
                ) : (
                  <StoresTable
                    stores={stores.filter((s) => s.status === 'PENDING')}
                    totalCount={stores.filter((s) => s.status === 'PENDING').length}
                    page={1}
                    pageSize={100}
                    onPageChange={() => {}}
                    onSearch={handleSearch}
                    onStatusFilter={() => {}}
                    loading={loading}
                  />
                )}
              </Stack>
            </Paper>
          </Tabs.Panel>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          opened={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={confirmDelete}
          title="Delete Store"
          message="Are you sure you want to delete this store? This action cannot be undone and will affect all associated products and auctions."
          confirmLabel="Delete"
          confirmColor="red"
        />
      </Stack>
    </Container>
  );
}
