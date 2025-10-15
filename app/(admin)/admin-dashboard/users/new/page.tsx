'use client';

import { useState } from 'react';
import {
  Container,
  Title,
  Button,
  Group,
  Stack,
  Text,
} from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { UserForm } from '@/components/admin/users/UserForm';
import { Role } from '@prisma/client';

interface UserFormData {
  name: string;
  email: string;
  phone?: string;
  role: Role;
  password?: string;
  locale?: string;
}

export default function CreateUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: UserFormData) => {
    try {
      setLoading(true);

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create user');
      }

      const result = await response.json();

      notifications.show({
        title: 'Success',
        message: 'User created successfully',
        color: 'green',
      });

      router.push(`/admin-dashboard/users/${result.user.id}`);
    } catch (error: any) {
      console.error('Error creating user:', error);
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to create user',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin-dashboard/users');
  };

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Group>
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={handleCancel}
          >
            Back to Users
          </Button>
        </Group>

        <div>
          <Title order={2}>Create New User</Title>
          <Text c="dimmed" size="sm">
            Add a new user to the platform
          </Text>
        </div>

        <UserForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      </Stack>
    </Container>
  );
}
