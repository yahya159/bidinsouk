'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Button,
  Group,
  Stack,
  Text,
  Card,
  Grid,
  Badge,
  Avatar,
  Divider,
  Modal,
  Tabs,
} from '@mantine/core';
import {
  IconEdit,
  IconTrash,
  IconUserOff,
  IconUserCheck,
  IconArrowLeft,
  IconUser,
  IconActivity,
} from '@tabler/icons-react';
import { useRouter, useParams } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { UserActivityLogs } from '@/components/admin/users/UserActivityLogs';
import { ConfirmDialog } from '@/components/admin/shared/ConfirmDialog';
import { Role } from '@prisma/client';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  avatarUrl: string | null;
  locale: string | null;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: string;
    _count: {
      orders: number;
      bids: number;
      watchlist: number;
      reviews: number;
    };
  } | null;
  vendor?: {
    id: string;
    _count: {
      stores: number;
    };
  } | null;
  admin?: {
    id: string;
  } | null;
}

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const handleEdit = () => {
    router.push(`/admin-dashboard/users/${userId}/edit`);
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }

      notifications.show({
        title: 'Success',
        message: 'User deleted successfully',
        color: 'green',
      });

      router.push('/admin-dashboard/users');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to delete user',
        color: 'red',
      });
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  const getRoleBadgeColor = (role: Role) => {
    switch (role) {
      case 'ADMIN':
        return 'red';
      case 'VENDOR':
        return 'blue';
      case 'CLIENT':
        return 'green';
      default:
        return 'gray';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Text>Loading...</Text>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container size="xl" py="xl">
        <Text>User not found</Text>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Group justify="space-between">
          <Group>
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => router.push('/admin-dashboard/users')}
            >
              Back to Users
            </Button>
          </Group>
          <Group>
            <Button
              leftSection={<IconEdit size={16} />}
              onClick={handleEdit}
            >
              Edit
            </Button>
            <Button
              color="red"
              leftSection={<IconTrash size={16} />}
              onClick={() => setDeleteModalOpen(true)}
            >
              Delete
            </Button>
          </Group>
        </Group>

        <Card withBorder>
          <Group>
            <Avatar
              src={user.avatarUrl}
              size="xl"
              radius="md"
              alt={user.name}
            />
            <div style={{ flex: 1 }}>
              <Group gap="xs" mb="xs">
                <Title order={2}>{user.name}</Title>
                <Badge color={getRoleBadgeColor(user.role)} size="lg">
                  {user.role}
                </Badge>
              </Group>
              <Text c="dimmed" size="sm">
                {user.email}
              </Text>
            </div>
          </Group>

          <Divider my="md" />

          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="xs">
                <Text size="sm" fw={500}>
                  Phone
                </Text>
                <Text size="sm" c="dimmed">
                  {user.phone || 'Not provided'}
                </Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="xs">
                <Text size="sm" fw={500}>
                  Locale
                </Text>
                <Text size="sm" c="dimmed">
                  {user.locale?.toUpperCase() || 'Not set'}
                </Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="xs">
                <Text size="sm" fw={500}>
                  Registered
                </Text>
                <Text size="sm" c="dimmed">
                  {formatDate(user.createdAt)}
                </Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="xs">
                <Text size="sm" fw={500}>
                  Last Updated
                </Text>
                <Text size="sm" c="dimmed">
                  {formatDate(user.updatedAt)}
                </Text>
              </Stack>
            </Grid.Col>
          </Grid>

          {user.client && (
            <>
              <Divider my="md" />
              <Title order={4} mb="md">
                Client Statistics
              </Title>
              <Grid>
                <Grid.Col span={{ base: 6, md: 3 }}>
                  <Stack gap="xs">
                    <Text size="sm" fw={500}>
                      Orders
                    </Text>
                    <Text size="xl" fw={700}>
                      {user.client._count.orders}
                    </Text>
                  </Stack>
                </Grid.Col>
                <Grid.Col span={{ base: 6, md: 3 }}>
                  <Stack gap="xs">
                    <Text size="sm" fw={500}>
                      Bids
                    </Text>
                    <Text size="xl" fw={700}>
                      {user.client._count.bids}
                    </Text>
                  </Stack>
                </Grid.Col>
                <Grid.Col span={{ base: 6, md: 3 }}>
                  <Stack gap="xs">
                    <Text size="sm" fw={500}>
                      Watchlist
                    </Text>
                    <Text size="xl" fw={700}>
                      {user.client._count.watchlist}
                    </Text>
                  </Stack>
                </Grid.Col>
                <Grid.Col span={{ base: 6, md: 3 }}>
                  <Stack gap="xs">
                    <Text size="sm" fw={500}>
                      Reviews
                    </Text>
                    <Text size="xl" fw={700}>
                      {user.client._count.reviews}
                    </Text>
                  </Stack>
                </Grid.Col>
              </Grid>
            </>
          )}

          {user.vendor && (
            <>
              <Divider my="md" />
              <Title order={4} mb="md">
                Vendor Statistics
              </Title>
              <Grid>
                <Grid.Col span={{ base: 6, md: 3 }}>
                  <Stack gap="xs">
                    <Text size="sm" fw={500}>
                      Stores
                    </Text>
                    <Text size="xl" fw={700}>
                      {user.vendor._count.stores}
                    </Text>
                  </Stack>
                </Grid.Col>
              </Grid>
            </>
          )}
        </Card>

        <Tabs defaultValue="activity">
          <Tabs.List>
            <Tabs.Tab value="activity" leftSection={<IconActivity size={16} />}>
              Activity History
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="activity" pt="md">
            <UserActivityLogs userId={userId} />
          </Tabs.Panel>
        </Tabs>
      </Stack>

      <ConfirmDialog
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to delete ${user.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmColor="red"
        loading={deleting}
      />
    </Container>
  );
}
