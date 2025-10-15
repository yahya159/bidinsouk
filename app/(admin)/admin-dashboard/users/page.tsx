'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Button,
  Group,
  Stack,
  Text,
  Modal,
  Checkbox,
  Menu,
  ActionIcon,
} from '@mantine/core';
import { IconPlus, IconDots } from '@tabler/icons-react';
import { UsersTable } from '@/components/admin/users/UsersTable';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
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
}

export default function UsersListPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (search) {
        params.append('search', search);
      }

      if (roleFilter) {
        params.append('role', roleFilter);
      }

      const response = await fetch(`/api/admin/users?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users);
      setTotalCount(data.pagination.totalCount);
    } catch (error) {
      console.error('Error fetching users:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load users',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search, roleFilter]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSearch = (searchValue: string) => {
    setSearch(searchValue);
    setPage(1); // Reset to first page on search
  };

  const handleRoleFilter = (role: string | null) => {
    setRoleFilter(role);
    setPage(1); // Reset to first page on filter
  };

  const handleCreateUser = () => {
    router.push('/admin-dashboard/users/new');
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Group justify="space-between">
          <div>
            <Title order={2}>User Management</Title>
            <Text c="dimmed" size="sm">
              Manage all platform users
            </Text>
          </div>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={handleCreateUser}
          >
            Create User
          </Button>
        </Group>

        <UsersTable
          users={users}
          totalCount={totalCount}
          page={page}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onSearch={handleSearch}
          onRoleFilter={handleRoleFilter}
          loading={loading}
        />
      </Stack>
    </Container>
  );
}
