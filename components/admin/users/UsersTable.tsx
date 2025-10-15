'use client';

import { useState } from 'react';
import {
  Table,
  TextInput,
  Select,
  SegmentedControl,
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
import { IconSearch, IconUser } from '@tabler/icons-react';
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

interface UsersTableProps {
  users: User[];
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSearch: (search: string) => void;
  onRoleFilter: (role: string | null) => void;
  loading?: boolean;
}

export function UsersTable({
  users,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onSearch,
  onRoleFilter,
  loading = false,
}: UsersTableProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | null>(null);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    onSearch(value);
  };

  const handleRoleFilterChange = (value: string | null) => {
    setRoleFilter(value);
    onRoleFilter(value);
  };

  const handleRowClick = (userId: string) => {
    router.push(`/admin-dashboard/users/${userId}`);
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
        <Group gap="md">
          <TextInput
            placeholder="Search by name or email..."
            leftSection={<IconSearch size={16} />}
            value={searchValue}
            onChange={(e) => handleSearchChange(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="Filter by role"
            data={[
              { value: '', label: 'All Roles' },
              { value: 'CLIENT', label: 'Client' },
              { value: 'VENDOR', label: 'Vendor' },
              { value: 'ADMIN', label: 'Admin' },
            ]}
            value={roleFilter}
            onChange={handleRoleFilterChange}
            clearable
            style={{ minWidth: 150 }}
          />
        </Group>
      </Paper>

      {/* Table */}
      <Paper withBorder>
        {loading ? (
          <Center p="xl">
            <Loader size="lg" />
          </Center>
        ) : users.length === 0 ? (
          <Center p="xl">
            <Stack align="center" gap="xs">
              <IconUser size={48} stroke={1.5} color="gray" />
              <Text c="dimmed">No users found</Text>
            </Stack>
          </Center>
        ) : (
          <Box style={{ overflowX: 'auto' }}>
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Phone</Table.Th>
                  <Table.Th>Role</Table.Th>
                  <Table.Th>Locale</Table.Th>
                  <Table.Th>Registration Date</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {users.map((user) => (
                  <Table.Tr
                    key={user.id}
                    onClick={() => handleRowClick(user.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Table.Td>
                      <Text fw={500}>{user.name}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {user.email}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{user.phone || '-'}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={getRoleBadgeColor(user.role)} variant="light">
                        {user.role}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{user.locale?.toUpperCase() || '-'}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {formatDate(user.createdAt)}
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
            {Math.min(page * pageSize, totalCount)} of {totalCount} users
          </Text>
          <Pagination
            total={totalPages}
            value={page}
            onChange={onPageChange}
          />
        </Group>
      )}
    </Stack>
  );
}
