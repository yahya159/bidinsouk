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
} from '@mantine/core';
import { IconArrowLeft, IconCheck } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { StoreForm } from '@/components/admin/stores/StoreForm';
import { notifications } from '@mantine/notifications';

interface Seller {
  id: string;
  user: {
    name: string;
    email: string;
  };
}

export default function NewStorePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [fetchingSellers, setFetchingSellers] = useState(true);

  const fetchSellers = async () => {
    try {
      setFetchingSellers(true);
      // Fetch all vendors to populate the seller dropdown
      const response = await fetch('/api/admin/users?role=VENDOR&pageSize=1000');

      if (response.ok) {
        const data = await response.json();
        // Transform users to sellers format
        const vendorSellers = data.users
          .filter((user: any) => user.role === 'VENDOR')
          .map((user: any) => ({
            id: user.id,
            user: {
              name: user.name,
              email: user.email,
            },
          }));
        setSellers(vendorSellers);
      } else {
        notifications.show({
          title: 'Warning',
          message: 'Failed to fetch sellers list',
          color: 'yellow',
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to connect to server',
        color: 'red',
      });
    } finally {
      setFetchingSellers(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, []);

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

      const response = await fetch('/api/admin/stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parsedData),
      });

      if (response.ok) {
        const result = await response.json();
        notifications.show({
          title: 'Success',
          message: 'Store created successfully',
          color: 'green',
          icon: <IconCheck size={16} />,
        });
        router.push(`/admin-dashboard/stores/${result.store.id}`);
      } else {
        const errorData = await response.json();
        notifications.show({
          title: 'Error',
          message: errorData.error || 'Failed to create store',
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
    router.push('/admin-dashboard/stores');
  };

  if (fetchingSellers) {
    return (
      <Container size="xl" py="xl">
        <Center style={{ height: '400px' }}>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Group>
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => router.push('/admin-dashboard/stores')}
          >
            Back
          </Button>
          <Title order={1}>Create New Store</Title>
        </Group>

        {/* Form */}
        <StoreForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
          sellers={sellers}
        />
      </Stack>
    </Container>
  );
}
