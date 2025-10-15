'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Button,
  Group,
  Stack,
  Text,
  Loader,
  Center,
} from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useRouter, useParams } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { UserForm } from '@/components/admin/users/UserForm';
import { Role } from '@prisma/client';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  locale: string | null;
}

interface UserFormData {
  name: string;
  email: string;
  phone?: string;
  role: Role;
  password?: string;
  locale?: string;
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${userId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }

      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      console.error('Error fetching user:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load user details',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: UserFormData) => {
    try {
      setSubmitting(true);

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }

      notifications.show({
        title: 'Success',
        message: 'User updated successfully',
        color: 'green',
      });

      router.push(`/admin-dashboard/users/${userId}`);
    } catch (error: any) {
      console.error('Error updating user:', error);
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to update user',
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/admin-dashboard/users/${userId}`);
  };

  if (loading) {
    return (
      <Container size="md" py="xl">
        <Center>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container size="md" py="xl">
        <Text>User not found</Text>
      </Container>
    );
  }

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Group>
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={handleCancel}
          >
            Back to User Details
          </Button>
        </Group>

        <div>
          <Title order={2}>Edit User</Title>
          <Text c="dimmed" size="sm">
            Update user information
          </Text>
        </div>

        <UserForm
          initialData={{
            name: user.name,
            email: user.email,
            phone: user.phone || undefined,
            role: user.role,
            locale: user.locale || undefined,
          }}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isEdit
          loading={submitting}
        />
      </Stack>
    </Container>
  );
}
