'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Button,
  Group,
  Stack,
  Loader,
  Center,
  Text,
} from '@mantine/core';
import {
  IconEdit,
  IconTrash,
  IconCheck,
  IconX,
  IconArrowLeft,
} from '@tabler/icons-react';
import { useRouter, useParams } from 'next/navigation';
import { StoreDetailCard } from '@/components/admin/stores/StoreDetailCard';
import { ConfirmDialog } from '@/components/admin/shared/ConfirmDialog';
import { notifications } from '@mantine/notifications';

type StoreStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';

interface Store {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string | null;
  status: StoreStatus;
  createdAt: string;
  address: any;
  socials: any;
  seo: any;
  seller: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      phone: string | null;
      avatarUrl: string | null;
    };
  };
  products?: Array<{
    id: string;
    title: string;
    status: string;
    price: string | null;
    createdAt: string;
  }>;
  auctions?: Array<{
    id: string;
    title: string;
    status: string;
    currentBid: string;
    endAt: string;
  }>;
  _count?: {
    products: number;
    auctions: number;
    orders: number;
  };
}

export default function StoreDetailPage() {
  const router = useRouter();
  const params = useParams();
  const storeId = params.id as string;

  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  const fetchStore = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/stores/${storeId}`);

      if (response.ok) {
        const data = await response.json();
        setStore(data.store);
      } else {
        const errorData = await response.json();
        notifications.show({
          title: 'Error',
          message: errorData.error || 'Failed to fetch store',
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
    if (storeId) {
      fetchStore();
    }
  }, [storeId]);

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${storeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: 'Store deleted successfully',
          color: 'green',
          icon: <IconCheck size={16} />,
        });
        router.push('/admin-dashboard/stores');
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
    }
  };

  const handleApprove = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${storeId}/approve`, {
        method: 'POST',
      });

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: 'Store approved successfully',
          color: 'green',
          icon: <IconCheck size={16} />,
        });
        fetchStore(); // Refresh store data
      } else {
        const errorData = await response.json();
        notifications.show({
          title: 'Error',
          message: errorData.error || 'Failed to approve store',
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
      setApproveDialogOpen(false);
    }
  };

  const handleReject = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${storeId}/reject`, {
        method: 'POST',
      });

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: 'Store rejected successfully',
          color: 'green',
          icon: <IconCheck size={16} />,
        });
        fetchStore(); // Refresh store data
      } else {
        const errorData = await response.json();
        notifications.show({
          title: 'Error',
          message: errorData.error || 'Failed to reject store',
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
      setRejectDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Center style={{ height: '400px' }}>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  if (!store) {
    return (
      <Container size="xl" py="xl">
        <Center style={{ height: '400px' }}>
          <Stack align="center" gap="md">
            <Text size="xl" fw={500}>
              Store not found
            </Text>
            <Button
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => router.push('/admin-dashboard/stores')}
            >
              Back to Stores
            </Button>
          </Stack>
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between">
          <Group>
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => router.push('/admin-dashboard/stores')}
            >
              Back
            </Button>
            <Title order={1}>Store Details</Title>
          </Group>

          <Group gap="xs">
            {store.status === 'PENDING' && (
              <>
                <Button
                  color="green"
                  leftSection={<IconCheck size={16} />}
                  onClick={() => setApproveDialogOpen(true)}
                >
                  Approve
                </Button>
                <Button
                  color="red"
                  variant="outline"
                  leftSection={<IconX size={16} />}
                  onClick={() => setRejectDialogOpen(true)}
                >
                  Reject
                </Button>
              </>
            )}
            <Button
              variant="light"
              leftSection={<IconEdit size={16} />}
              onClick={() => router.push(`/admin-dashboard/stores/${storeId}/edit`)}
            >
              Edit
            </Button>
            <Button
              color="red"
              variant="outline"
              leftSection={<IconTrash size={16} />}
              onClick={() => setDeleteDialogOpen(true)}
            >
              Delete
            </Button>
          </Group>
        </Group>

        {/* Store Details */}
        <StoreDetailCard store={store} />

        {/* Confirmation Dialogs */}
        <ConfirmDialog
          opened={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={handleDelete}
          title="Delete Store"
          message="Are you sure you want to delete this store? This action cannot be undone and will affect all associated products and auctions."
          confirmLabel="Delete"
          confirmColor="red"
        />

        <ConfirmDialog
          opened={approveDialogOpen}
          onClose={() => setApproveDialogOpen(false)}
          onConfirm={handleApprove}
          title="Approve Store"
          message="Are you sure you want to approve this store? The store will become active and visible to users."
          confirmLabel="Approve"
          confirmColor="green"
        />

        <ConfirmDialog
          opened={rejectDialogOpen}
          onClose={() => setRejectDialogOpen(false)}
          onConfirm={handleReject}
          title="Reject Store"
          message="Are you sure you want to reject this store? The store will be suspended and not visible to users."
          confirmLabel="Reject"
          confirmColor="red"
        />
      </Stack>
    </Container>
  );
}
