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
  ShoppingBag,
  Heart,
  Clock,
  AlertCircle,
  Users,
  Star,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'CLIENT' | 'VENDOR' | 'ADMIN';
}

interface Client {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'NEW';
  segment: 'NEW' | 'ACTIVE' | 'VIP' | 'RISK';
  totalOrders: number;
  totalSpent: number;
  lastActivity: string;
  joinedAt: string;
  stats: {
    orders: number;
    auctions: number;
    reviews: number;
    disputes: number;
  };
}

interface ClientsContentProps {
  user: User;
}

// Mock data
const mockClients: Client[] = [
  {
    id: '1',
    name: 'Ahmed Benali',
    email: 'ahmed@example.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&auto=format',
    status: 'ACTIVE',
    segment: 'VIP',
    totalOrders: 15,
    totalSpent: 125000,
    lastActivity: '2024-01-15T10:00:00Z',
    joinedAt: '2023-06-15T10:00:00Z',
    stats: {
      orders: 15,
      auctions: 8,
      reviews: 12,
      disputes: 0,
    },
  },
  {
    id: '2',
    name: 'Fatima Zahra',
    email: 'fatima@example.com',
    status: 'ACTIVE',
    segment: 'ACTIVE',
    totalOrders: 7,
    totalSpent: 45000,
    lastActivity: '2024-01-14T15:30:00Z',
    joinedAt: '2023-09-20T14:00:00Z',
    stats: {
      orders: 7,
      auctions: 12,
      reviews: 5,
      disputes: 1,
    },
  },
  {
    id: '3',
    name: 'Omar Alami',
    email: 'omar@example.com',
    status: 'NEW',
    segment: 'NEW',
    totalOrders: 1,
    totalSpent: 8500,
    lastActivity: '2024-01-10T09:00:00Z',
    joinedAt: '2024-01-05T16:30:00Z',
    stats: {
      orders: 1,
      auctions: 3,
      reviews: 0,
      disputes: 0,
    },
  },
  {
    id: '4',
    name: 'Youssef Tazi',
    email: 'youssef@example.com',
    status: 'SUSPENDED',
    segment: 'RISK',
    totalOrders: 3,
    totalSpent: 12000,
    lastActivity: '2024-01-08T11:20:00Z',
    joinedAt: '2023-11-10T09:15:00Z',
    stats: {
      orders: 3,
      auctions: 2,
      reviews: 1,
      disputes: 3,
    },
  },
];

const segments = ['Tous', 'NEW', 'ACTIVE', 'VIP', 'RISK'];
const statuses = ['Tous', 'ACTIVE', 'SUSPENDED', 'NEW'];

export function ClientsContent({ user }: ClientsContentProps) {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('Tous');
  const [selectedStatus, setSelectedStatus] = useState('Tous');
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [detailModalOpened, { open: openDetailModal, close: closeDetailModal }] = useDisclosure(false);

  const itemsPerPage = 12;

  // Filter clients
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSegment = selectedSegment === 'Tous' || client.segment === selectedSegment;
    const matchesStatus = selectedStatus === 'Tous' || client.status === selectedStatus;
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'new' && client.segment === 'NEW') ||
                      (activeTab === 'active' && client.segment === 'ACTIVE') ||
                      (activeTab === 'vip' && client.segment === 'VIP') ||
                      (activeTab === 'risk' && client.segment === 'RISK');
    
    return matchesSearch && matchesSegment && matchesStatus && matchesTab;
  });

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleStatusChange = async (clientId: string, newStatus: string) => {
    try {
      setLoading(true);
      // API call would go here
      setClients(prev => prev.map(client => 
        client.id === clientId ? { ...client, status: newStatus as any } : client
      ));
      notifications.show({
        title: 'Statut mis à jour',
        message: 'Le statut du client a été mis à jour',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de mettre à jour le statut',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    openDetailModal();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'green';
      case 'SUSPENDED': return 'red';
      case 'NEW': return 'blue';
      default: return 'gray';
    }
  };

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'VIP': return 'gold';
      case 'ACTIVE': return 'green';
      case 'NEW': return 'blue';
      case 'RISK': return 'red';
      default: return 'gray';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Actif';
      case 'SUSPENDED': return 'Suspendu';
      case 'NEW': return 'Nouveau';
      default: return status;
    }
  };

  const getSegmentLabel = (segment: string) => {
    switch (segment) {
      case 'VIP': return 'VIP';
      case 'ACTIVE': return 'Actif';
      case 'NEW': return 'Nouveau';
      case 'RISK': return 'Risque';
      default: return segment;
    }
  };

  if (loading && clients.length === 0) {
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
          {/* Header */}
          <Group justify="space-between">
            <div>
              <Title order={1} size="2rem" mb="xs">
                Clients
              </Title>
              <Text c="dimmed" size="lg">
                Gérez vos clients et leurs interactions
              </Text>
            </div>
          </Group>

          {/* Stats Cards */}
          <Grid>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Group justify="space-between">
                  <div>
                    <Text c="dimmed" size="sm">Total Clients</Text>
                    <Text fw={700} size="xl">{clients.length}</Text>
                  </div>
                  <Users size={24} color="var(--mantine-color-blue-6)" />
                </Group>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Group justify="space-between">
                  <div>
                    <Text c="dimmed" size="sm">Clients VIP</Text>
                    <Text fw={700} size="xl">{clients.filter(c => c.segment === 'VIP').length}</Text>
                  </div>
                  <Star size={24} color="var(--mantine-color-yellow-6)" />
                </Group>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Group justify="space-between">
                  <div>
                    <Text c="dimmed" size="sm">Nouveaux</Text>
                    <Text fw={700} size="xl">{clients.filter(c => c.segment === 'NEW').length}</Text>
                  </div>
                  <CheckCircle size={24} color="var(--mantine-color-green-6)" />
                </Group>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Group justify="space-between">
                  <div>
                    <Text c="dimmed" size="sm">À Risque</Text>
                    <Text fw={700} size="xl">{clients.filter(c => c.segment === 'RISK').length}</Text>
                  </div>
                  <AlertCircle size={24} color="var(--mantine-color-red-6)" />
                </Group>
              </Card>
            </Grid.Col>
          </Grid>

          {/* Tabs */}
          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Tab value="all">Tous</Tabs.Tab>
              <Tabs.Tab value="new">Nouveaux</Tabs.Tab>
              <Tabs.Tab value="active">Actifs</Tabs.Tab>
              <Tabs.Tab value="vip">VIP</Tabs.Tab>
              <Tabs.Tab value="risk">À Risque</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value={activeTab} pt="md">
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
                    placeholder="Segment"
                    data={segments}
                    value={selectedSegment}
                    onChange={(value) => setSelectedSegment(value || 'Tous')}
                    clearable={false}
                  />
                  <Select
                    placeholder="Statut"
                    data={statuses}
                    value={selectedStatus}
                    onChange={(value) => setSelectedStatus(value || 'Tous')}
                    clearable={false}
                  />
                </Group>
              </Card>

              {/* Clients Grid */}
              {paginatedClients.length === 0 ? (
                <Center py="xl">
                  <Stack align="center" gap="md">
                    <AlertCircle size={48} color="gray" />
                    <Text size="lg" c="dimmed">
                      Aucun client trouvé
                    </Text>
                  </Stack>
                </Center>
              ) : (
                <>
                  <Grid>
                    {paginatedClients.map((client) => (
                      <Grid.Col key={client.id} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
                        <Card shadow="sm" padding="lg" radius="md" withBorder style={{ height: '100%' }}>
                          <Stack gap="md">
                            {/* Client Info */}
                            <Group>
                              <Avatar src={client.avatar} size="lg" radius="xl">
                                {client.name.charAt(0)}
                              </Avatar>
                              <div style={{ flex: 1 }}>
                                <Text fw={500} size="sm" lineClamp={1}>
                                  {client.name}
                                </Text>
                                <Text size="xs" c="dimmed" lineClamp={1}>
                                  {client.email}
                                </Text>
                                <Group gap="xs" mt={4}>
                                  <Badge size="xs" color={getStatusColor(client.status)} variant="light">
                                    {getStatusLabel(client.status)}
                                  </Badge>
                                  <Badge size="xs" color={getSegmentColor(client.segment)} variant="light">
                                    {getSegmentLabel(client.segment)}
                                  </Badge>
                                </Group>
                              </div>
                            </Group>

                            {/* Stats */}
                            <Grid gutter="xs">
                              <Grid.Col span={6}>
                                <Text size="xs" c="dimmed">Commandes</Text>
                                <Text fw={500} size="sm">{client.stats.orders}</Text>
                              </Grid.Col>
                              <Grid.Col span={6}>
                                <Text size="xs" c="dimmed">Enchères</Text>
                                <Text fw={500} size="sm">{client.stats.auctions}</Text>
                              </Grid.Col>
                              <Grid.Col span={6}>
                                <Text size="xs" c="dimmed">Avis</Text>
                                <Text fw={500} size="sm">{client.stats.reviews}</Text>
                              </Grid.Col>
                              <Grid.Col span={6}>
                                <Text size="xs" c="dimmed">Litiges</Text>
                                <Text fw={500} size="sm" c={client.stats.disputes > 0 ? 'red' : 'inherit'}>
                                  {client.stats.disputes}
                                </Text>
                              </Grid.Col>
                            </Grid>

                            {/* Total Spent */}
                            <Box>
                              <Text size="xs" c="dimmed">Total dépensé</Text>
                              <Text fw={700} size="lg" c="blue">
                                {client.totalSpent.toLocaleString()} MAD
                              </Text>
                            </Box>

                            {/* Actions */}
                            <Group gap="xs">
                              <Button
                                size="xs"
                                variant="light"
                                leftSection={<Eye size={14} />}
                                onClick={() => handleViewClient(client)}
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
                                  {user.role === 'ADMIN' && (
                                    <>
                                      {client.status === 'ACTIVE' ? (
                                        <Menu.Item
                                          leftSection={<Ban size={16} />}
                                          color="red"
                                          onClick={() => handleStatusChange(client.id, 'SUSPENDED')}
                                        >
                                          Suspendre
                                        </Menu.Item>
                                      ) : (
                                        <Menu.Item
                                          leftSection={<CheckCircle size={16} />}
                                          color="green"
                                          onClick={() => handleStatusChange(client.id, 'ACTIVE')}
                                        >
                                          Réactiver
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
                        onChange={setCurrentPage}
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

      {/* Client Detail Modal */}
      <Modal
        opened={detailModalOpened}
        onClose={closeDetailModal}
        title={`Client: ${selectedClient?.name}`}
        size="lg"
        centered
      >
        {selectedClient && (
          <Stack gap="md">
            {/* Client Header */}
            <Group>
              <Avatar src={selectedClient.avatar} size="xl" radius="xl">
                {selectedClient.name.charAt(0)}
              </Avatar>
              <div style={{ flex: 1 }}>
                <Text fw={500} size="lg">{selectedClient.name}</Text>
                <Text c="dimmed">{selectedClient.email}</Text>
                <Group gap="xs" mt="xs">
                  <Badge color={getStatusColor(selectedClient.status)} variant="light">
                    {getStatusLabel(selectedClient.status)}
                  </Badge>
                  <Badge color={getSegmentColor(selectedClient.segment)} variant="light">
                    {getSegmentLabel(selectedClient.segment)}
                  </Badge>
                </Group>
              </div>
            </Group>

            <Divider />

            {/* Stats Grid */}
            <Grid>
              <Grid.Col span={6}>
                <Card padding="md" withBorder>
                  <Group justify="space-between">
                    <div>
                      <Text c="dimmed" size="sm">Commandes</Text>
                      <Text fw={700} size="xl">{selectedClient.stats.orders}</Text>
                    </div>
                    <ShoppingBag size={24} color="var(--mantine-color-blue-6)" />
                  </Group>
                </Card>
              </Grid.Col>
              <Grid.Col span={6}>
                <Card padding="md" withBorder>
                  <Group justify="space-between">
                    <div>
                      <Text c="dimmed" size="sm">Total dépensé</Text>
                      <Text fw={700} size="xl">{selectedClient.totalSpent.toLocaleString()} MAD</Text>
                    </div>
                    <Text fw={700} size="lg" c="green">💰</Text>
                  </Group>
                </Card>
              </Grid.Col>
              <Grid.Col span={6}>
                <Card padding="md" withBorder>
                  <Group justify="space-between">
                    <div>
                      <Text c="dimmed" size="sm">Enchères</Text>
                      <Text fw={700} size="xl">{selectedClient.stats.auctions}</Text>
                    </div>
                    <Text fw={700} size="lg">🔨</Text>
                  </Group>
                </Card>
              </Grid.Col>
              <Grid.Col span={6}>
                <Card padding="md" withBorder>
                  <Group justify="space-between">
                    <div>
                      <Text c="dimmed" size="sm">Avis</Text>
                      <Text fw={700} size="xl">{selectedClient.stats.reviews}</Text>
                    </div>
                    <Star size={24} color="var(--mantine-color-yellow-6)" />
                  </Group>
                </Card>
              </Grid.Col>
            </Grid>

            {/* Activity Info */}
            <Card padding="md" withBorder>
              <Text fw={500} mb="sm">Informations d'activité</Text>
              <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed">Membre depuis</Text>
                <Text size="sm">{new Date(selectedClient.joinedAt).toLocaleDateString('fr-FR')}</Text>
              </Group>
              <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed">Dernière activité</Text>
                <Text size="sm">{new Date(selectedClient.lastActivity).toLocaleDateString('fr-FR')}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Litiges</Text>
                <Text size="sm" c={selectedClient.stats.disputes > 0 ? 'red' : 'green'}>
                  {selectedClient.stats.disputes} litige(s)
                </Text>
              </Group>
            </Card>

            {/* Actions */}
            <Group>
              <Button leftSection={<MessageCircle size={16} />} style={{ flex: 1 }}>
                Contacter le client
              </Button>
              {user.role === 'ADMIN' && (
                <Button
                  variant="outline"
                  color={selectedClient.status === 'ACTIVE' ? 'red' : 'green'}
                  leftSection={selectedClient.status === 'ACTIVE' ? <Ban size={16} /> : <CheckCircle size={16} />}
                  onClick={() => {
                    handleStatusChange(
                      selectedClient.id, 
                      selectedClient.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
                    );
                    closeDetailModal();
                  }}
                >
                  {selectedClient.status === 'ACTIVE' ? 'Suspendre' : 'Réactiver'}
                </Button>
              )}
            </Group>
          </Stack>
        )}
      </Modal>
    </>
  );
}