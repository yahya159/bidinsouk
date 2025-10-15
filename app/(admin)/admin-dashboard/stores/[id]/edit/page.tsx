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
import { IconArrowLeft, IconCheck } from '@tabler/icons-react';
import { useRouter, useParams } from 'next/navigation';
import { StoreForm } from '@/components/admin/stores/StoreForm';
import { notifications } from '@mantine/notifications';

type StoreStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';

interface Store {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: StoreStatus;
  sellerId: string;
  address: any;
  socials: any;
  seo: any;
}

export default function EditStorePage() {
  const router = useRouter();
  const params = useParams();
  const storeId = params.id as string;

  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingStore, setFetchingStore] = useState(true);

  const fetchStore = async () => {
    try {
      setFetchingStore(true);
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
      setFetchingStore(false);
    }
  };

  useEffect(() => {
    if (storeId) {
      fetchStore();
    }
  }, [storeId]);

  const handleSubmit = async (data: any) => {
    try {
      setLoading(true);

      // Parse JSON fields if they are strings
      let parsedData = { ...data };
      
      if (typeof data.address === 'string' && data.address.trim()) {
        try {
          parsedData.address = JSON.parse(data.address);
        } catch (e) {
          notifications.show({
            title: 'Validation Error',
            message: 'Invalid JSON format for address',
            color: 'red',
          });
          setLoading(false);
          return;
        }
      }

      if (typeof data.socials === 'string' && data.socials.trim()) {
        try {
          parsedData.socials = JSON.parse(data.socials);
        } catch (e) {
          notifications.show({
            title: 'Validation Error',
            message: 'Invalid JSON format for social links',
            color: 'red',
          });
          setLoading(false);
          return;
        }
      }

      if (typeof data.seo === 'string' && data.seo.trim()) {
        try {
          parsedData.seo = JSON.parse(data.seo);
        } catch (e) {
          notifications.show({
            title: 'Validation Error',
            message: 'Invalid JSON format for SEO data',
            color: 'red',
          });
          setLoading(false);
          return;
        }
      }

      const response = await fetch(`/api/admin/stores/${storeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parsedData),
      });

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: 'Store updated successfully',
          color: 'green',
          icon: <IconCheck size={16} />,
        });
        router.push(`/admin-dashboard/stores/${storeId}`);
      } else {
        const errorData = await response.json();
        notifications.show({
          title: 'Error',
          message: errorData.error || 'Failed to update store',
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

  const handleCancel = () => {
    router.push(`/admin-dashboard/stores/${storeId}`);
  };

  if (fetchingStore) {
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

  // Prepare initial data for the form
  const initialData = {
    name: store.name,
    email: store.email,
    phone: store.phone || '',
    sellerId: store.sellerId,
    status: store.status,
    address: store.address ? JSON.stringify(store.address, null, 2) : '',
    socials: store.socials ? JSON.stringify(store.socials, null, 2) : '',
    seo: store.seo ? JSON.stringify(store.seo, null, 2) : '',
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Group>
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => router.push(`/admin-dashboard/stores/${storeId}`)}
          >
            Back
          </Button>
          <Title order={1}>Edit Store</Title>
        </Group>

        {/* Form */}
        <StoreForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isEdit={true}
          loading={loading}
        />
      </Stack>
    </Container>
  );
}
