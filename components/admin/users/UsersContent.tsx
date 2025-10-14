'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Stack,
  Card,
  Avatar,
  Badge,
  ActionIcon,
  Menu,
  TextInput,
  Select,
  Pagination,
  Modal,
  Tabs,
  Box,
  Center,
  Loader,
  Grid,
  Divider,
} from '@mantine/core';
import {
  Search,
  MoreHorizontal,
  Eye,
  MessageCircle,
  Ban,
  CheckCircle,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'CLIENT' | 'VENDOR' | 'ADMIN';
  phone?: string;
  createdAt: string;
  client?: {
    id: string;
  };
  vendor?: {
    id: string;
    stores: Array<{
      id: string;
      name: string;
      status: string;
    }>;
  };
}

interface UsersContentProps {
  user: User;
}

export function UsersContent({ user }: UsersContentProps) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('Tous');
  const [activeTab, setActiveTab] = useState<string | null>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailModalOpened, { open: openDetailModal, close: closeDetailModal }] = useDisclosure(false);
  const [totalUsers, setTotalUsers] = useState(0);

  const itemsPerPage = 12;

  // Fetch users from API
  const fetchUsers = async (page = 1, role?: string) => {
    try {
      setLoading(true);
      const roleParam = role && role !== 'Tous' ? `&role=${role}` : '';
      const response = await fetch(`/api/admin/users?limit=${itemsPerPage}&offset=${(page - 1) * itemsPerPage}${roleParam}`, {
        headers: {
          'x-user-role': 'ADMIN',
          'x-user-id': user.id,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setTotalUsers(data.total);
      } else {
        throw new Error('Erreur lors du chargement des utilisateurs');
      }
    } catch (error) {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de charger les utilisateurs',
        color: 'red',
      });
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchUsers(1);
  }, []);

  // Filter users
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'Tous' || u.role === selectedRole;
    const matchesTab = activeTab === 'all' || (activeTab && u.role.toLowerCase() === activeTab);
    
    return matchesSearch && matchesRole && matchesTab;
  });

  const totalPages = Math.ceil(totalUsers / itemsPerPage);

  const handleRoleChange = async (role: string) => {
    setSelectedRole(role);
    setCurrentPage(1);
    await fetchUsers(1, role);
  };

  const handleStatusChange = async (userId: string, newRole: string) => {
    try {
      setLoading(true);
      // API call would go here to update user role
      notifications.show({
        title: 'Rôle mis à jour',
        message: 'Le rôle de l\'utilisateur a été mis à jour',
        color: 'green',
      });
      // Refresh the user list
      await fetchUsers(currentPage, selectedRole);
    } catch (error) {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de mettre à jour le rôle',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    openDetailModal();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'red';
      case 'VENDOR': return 'green';
      case 'CLIENT': return 'blue';
      default: return 'gray';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Administrateur';
      case 'VENDOR': return 'Vendeur';
      case 'CLIENT': return 'Client';
      default: return role;
    }
  };

  if (initialLoading) {
    return (
      <Center style={{ height: 400 }}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <>
      <Container size="xl" py="md">
        <Stack gap="xl">
          {/* Stats Cards */}
          <Grid>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Group justify="space-between">
                  <div>
                    <Text c="dimmed" size="sm">Total Utilisateurs</Text>
                    <Text fw={700} size="xl">{totalUsers}</Text>
                  </div>
                  <Users size={24} color="var(--mantine-color-blue-6)" />
                </Group>
              </Card>
            </Grid.Col>
          </Grid>

          {/* Tabs */}
          <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'all')}>
            <Tabs.List>
              <Tabs.Tab value="all">Tous</Tabs.Tab>
              <Tabs.Tab value="client">Clients</Tabs.Tab>
              <Tabs.Tab value="vendor">Vendeurs</Tabs.Tab>
              <Tabs.Tab value="admin">Administrateurs</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value={activeTab || 'all'} pt="md">
              {/* Filters */}
              <Card shadow="sm" padding="lg" radius="md" withBorder mb="md">
                <Group gap="md">
                  <TextInput
                    placeholder="Rechercher par nom ou email..."
                    leftSection={<Search size={16} />}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <Select
                    placeholder="Rôle"
                    data={['Tous', 'CLIENT', 'VENDOR', 'ADMIN']}
                    value={selectedRole}
                    onChange={(value) => handleRoleChange(value || 'Tous')}
                    clearable={false}
                  />
                </Group>
              </Card>

              {/* Users Grid */}
              {filteredUsers.length === 0 ? (
                <Center py="xl">
                  <Stack align="center" gap="md">
                    <Users size={48} color="gray" />
                    <Text size="lg" c="dimmed">
                      Aucun utilisateur trouvé
                    </Text>
                  </Stack>
                </Center>
              ) : (
                <>
                  <Grid>
                    {filteredUsers.map((u) => (
                      <Grid.Col key={u.id} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
                        <Card shadow="sm" padding="lg" radius="md" withBorder style={{ height: '100%' }}>
                          <Stack gap="md">
                            {/* User Info */}
                            <Group>
                              <Avatar size="lg" radius="xl">
                                {u.name.charAt(0)}
                              </Avatar>
                              <div style={{ flex: 1 }}>
                                <Text fw={500} size="sm" lineClamp={1}>
                                  {u.name}
                                </Text>
                                <Text size="xs" c="dimmed" lineClamp={1}>
                                  {u.email}
                                </Text>
                                <Group gap="xs" mt={4}>
                                  <Badge size="xs" color={getRoleColor(u.role)} variant="light">
                                    {getRoleLabel(u.role)}
                                  </Badge>
                                </Group>
                              </div>
                            </Group>

                            {/* User Details */}
                            <Box>
                              <Text size="xs" c="dimmed">Inscrit le</Text>
                              <Text size="sm">
                                {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                              </Text>
                            </Box>

                            {/* Actions */}
                            <Group gap="xs">
                              <Button
                                size="xs"
                                variant="light"
                                leftSection={<Eye size={14} />}
                                onClick={() => handleViewUser(u)}
                                style={{ flex: 1 }}
                              >
                                Voir
                              </Button>
                              <Menu shadow="md" width={200}>
                                <Menu.Target>
                                  <ActionIcon variant="light" size="sm">
                                    <MoreHorizontal size={16} />
                                  </ActionIcon>
                                </Menu.Target>
                                <Menu.Dropdown>
                                  <Menu.Item leftSection={<MessageCircle size={16} />}>
                                    Contacter
                                  </Menu.Item>
                                  {user.role === 'ADMIN' && u.role !== 'ADMIN' && (
                                    <>
                                      {u.role === 'CLIENT' && (
                                        <Menu.Item
                                          leftSection={<CheckCircle size={16} />}
                                          onClick={() => handleStatusChange(u.id, 'VENDOR')}
                                        >
                                          Promouvoir en vendeur
                                        </Menu.Item>
                                      )}
                                      {u.role === 'VENDOR' && (
                                        <Menu.Item
                                          leftSection={<CheckCircle size={16} />}
                                          onClick={() => handleStatusChange(u.id, 'CLIENT')}
                                        >
                                          Révoquer les droits vendeur
                                        </Menu.Item>
                                      )}
                                    </>
                                  )}
                                </Menu.Dropdown>
                              </Menu>
                            </Group>
                          </Stack>
                        </Card>
                      </Grid.Col>
                    ))}
                  </Grid>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <Group justify="center" mt="md">
                      <Pagination
                        value={currentPage}
                        onChange={async (page) => {
                          setCurrentPage(page);
                          await fetchUsers(page, selectedRole);
                        }}
                        total={totalPages}
                      />
                    </Group>
                  )}
                </>
              )}
            </Tabs.Panel>
          </Tabs>
        </Stack>
      </Container>

      {/* User Detail Modal */}
      <Modal
        opened={detailModalOpened}
        onClose={closeDetailModal}
        title={`Utilisateur: ${selectedUser?.name}`}
        size="lg"
        centered
      >
        {selectedUser && (
          <Stack gap="md">
            {/* User Header */}
            <Group>
              <Avatar size="xl" radius="xl">
                {selectedUser.name.charAt(0)}
              </Avatar>
              <div style={{ flex: 1 }}>
                <Text fw={500} size="lg">{selectedUser.name}</Text>
                <Text c="dimmed">{selectedUser.email}</Text>
                {selectedUser.phone && (
                  <Text c="dimmed" mt="xs">{selectedUser.phone}</Text>
                )}
                <Group gap="xs" mt="xs">
                  <Badge color={getRoleColor(selectedUser.role)} variant="light">
                    {getRoleLabel(selectedUser.role)}
                  </Badge>
                </Group>
              </div>
            </Group>

            <Divider />

            {/* User Info */}
            <Card padding="md" withBorder>
              <Text fw={500} mb="sm">Informations</Text>
              <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed">Inscrit le</Text>
                <Text size="sm">{new Date(selectedUser.createdAt).toLocaleDateString('fr-FR')}</Text>
              </Group>
              
              {selectedUser.client && (
                <Group justify="space-between" mb="xs">
                  <Text size="sm" c="dimmed">ID Client</Text>
                  <Text size="sm">{selectedUser.client.id}</Text>
                </Group>
              )}
              
              {selectedUser.vendor && (
                <>
                  <Group justify="space-between" mb="xs">
                    <Text size="sm" c="dimmed">ID Vendeur</Text>
                    <Text size="sm">{selectedUser.vendor.id}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Boutiques</Text>
                    <Text size="sm">{selectedUser.vendor.stores.length}</Text>
                  </Group>
                </>
              )}
            </Card>

            {/* Actions */}
            <Group>
              <Button leftSection={<MessageCircle size={16} />} style={{ flex: 1 }}>
                Contacter l'utilisateur
              </Button>
              {user.role === 'ADMIN' && selectedUser.role !== 'ADMIN' && (
                <Button
                  variant="outline"
                  color="green"
                  leftSection={<CheckCircle size={16} />}
                  onClick={() => {
                    const newRole = selectedUser.role === 'CLIENT' ? 'VENDOR' : 'CLIENT';
                    handleStatusChange(selectedUser.id, newRole);
                    closeDetailModal();
                  }}
                >
                  {selectedUser.role === 'CLIENT' ? 'Promouvoir en vendeur' : 'Révoquer les droits vendeur'}
                </Button>
              )}
            </Group>
          </Stack>
        )}
      </Modal>
    </>
  );
}