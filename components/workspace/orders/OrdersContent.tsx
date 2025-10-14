'use client';

import { useState, useEffect } from 'react';
import {
  Title,
  Text,
  Button,
  Group,
  Stack,
  Card,
  Table,
  Badge,
  ActionIcon,
  Menu,
  TextInput,
  Select,
  Tabs,
  Pagination,
  Modal,
  Alert,
  Center,
  Loader,
  Avatar,
  Grid,
  NumberInput,
  Textarea,
} from '@mantine/core';
import {
  Search,
  MoreHorizontal,
  Eye,
  Check,
  X,
  Truck,
  Package,
  FileText,
  MessageCircle,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Calendar,
  Filter,
  Download,
  RefreshCw,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { OrderDetailDrawer } from './OrderDetailDrawer';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'CLIENT' | 'VENDOR' | 'ADMIN';
}

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Order {
  id: string;
  orderNumber: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientAvatar?: string;
  amount: number;
  mode: 'DIRECT_PURCHASE' | 'AUCTION_WIN';
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentMethod: string;
  shippingAddress: {
    fullName: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
  trackingNumber?: string;
  notes?: string;
  timeline: {
    status: string;
    timestamp: string;
    note?: string;
  }[];
}

interface OrdersContentProps {
  user: User;
}

// Mock data
const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'ORD-2024-001',
    clientId: 'client-1',
    clientName: 'Ahmed Benali',
    clientEmail: 'ahmed.benali@email.com',
    clientPhone: '+212 6XX XXX XXX',
    clientAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&auto=format',
    amount: 8500,
    mode: 'AUCTION_WIN',
    status: 'CONFIRMED',
    paymentStatus: 'PAID',
    paymentMethod: 'Carte bancaire',
    shippingAddress: {
      fullName: 'Ahmed Benali',
      address: '123 Rue Mohammed V',
      city: 'Casablanca',
      postalCode: '20000',
      country: 'Maroc',
      phone: '+212 6XX XXX XXX',
    },
    items: [
      {
        id: 'item-1',
        productId: 'product-1',
        productName: 'iPhone 14 Pro Max 256GB',
        productImage: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=40&h=40&fit=crop&auto=format',
        quantity: 1,
        unitPrice: 8500,
        totalPrice: 8500,
      },
    ],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z',
    timeline: [
      {
        status: 'PENDING',
        timestamp: '2024-01-15T10:00:00Z',
        note: 'Commande créée suite à une enchère gagnante',
      },
      {
        status: 'CONFIRMED',
        timestamp: '2024-01-15T14:30:00Z',
        note: 'Commande confirmée et paiement reçu',
      },
    ],
  },
  {
    id: '2',
    orderNumber: 'ORD-2024-002',
    clientId: 'client-2',
    clientName: 'Fatima Zahra',
    clientEmail: 'fatima.zahra@email.com',
    amount: 12000,
    mode: 'DIRECT_PURCHASE',
    status: 'PREPARING',
    paymentStatus: 'PAID',
    paymentMethod: 'Virement bancaire',
    shippingAddress: {
      fullName: 'Fatima Zahra',
      address: '456 Avenue Hassan II',
      city: 'Rabat',
      postalCode: '10000',
      country: 'Maroc',
    },
    items: [
      {
        id: 'item-2',
        productId: 'product-2',
        productName: 'MacBook Air M2 13"',
        productImage: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=40&h=40&fit=crop&auto=format',
        quantity: 1,
        unitPrice: 12000,
        totalPrice: 12000,
      },
    ],
    createdAt: '2024-01-16T09:00:00Z',
    updatedAt: '2024-01-16T15:00:00Z',
    timeline: [
      {
        status: 'PENDING',
        timestamp: '2024-01-16T09:00:00Z',
        note: 'Commande créée',
      },
      {
        status: 'CONFIRMED',
        timestamp: '2024-01-16T10:00:00Z',
        note: 'Paiement confirmé',
      },
      {
        status: 'PREPARING',
        timestamp: '2024-01-16T15:00:00Z',
        note: 'Commande en cours de préparation',
      },
    ],
  },
  {
    id: '3',
    orderNumber: 'ORD-2024-003',
    clientId: 'client-3',
    clientName: 'Youssef Alami',
    clientEmail: 'youssef.alami@email.com',
    amount: 45000,
    mode: 'AUCTION_WIN',
    status: 'DELIVERED',
    paymentStatus: 'PAID',
    paymentMethod: 'Carte bancaire',
    shippingAddress: {
      fullName: 'Youssef Alami',
      address: '789 Boulevard Zerktouni',
      city: 'Marrakech',
      postalCode: '40000',
      country: 'Maroc',
    },
    items: [
      {
        id: 'item-3',
        productId: 'product-3',
        productName: 'Montre Rolex Submariner',
        productImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=40&h=40&fit=crop&auto=format',
        quantity: 1,
        unitPrice: 45000,
        totalPrice: 45000,
      },
    ],
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-14T16:00:00Z',
    trackingNumber: 'TRK123456789',
    timeline: [
      {
        status: 'PENDING',
        timestamp: '2024-01-10T08:00:00Z',
        note: 'Commande créée suite à une enchère gagnante',
      },
      {
        status: 'CONFIRMED',
        timestamp: '2024-01-10T10:00:00Z',
        note: 'Paiement confirmé',
      },
      {
        status: 'PREPARING',
        timestamp: '2024-01-11T09:00:00Z',
        note: 'Commande en préparation',
      },
      {
        status: 'SHIPPED',
        timestamp: '2024-01-12T14:00:00Z',
        note: 'Colis expédié avec le transporteur',
      },
      {
        status: 'DELIVERED',
        timestamp: '2024-01-14T16:00:00Z',
        note: 'Colis livré et signé par le client',
      },
    ],
  },
];

const orderStatuses = [
  { value: 'ALL', label: 'Toutes' },
  { value: 'PENDING', label: 'Demandes' },
  { value: 'CONFIRMED', label: 'Confirmées' },
  { value: 'PREPARING', label: 'En cours' },
  { value: 'SHIPPED', label: 'Expédiées' },
  { value: 'DELIVERED', label: 'Terminées' },
  { value: 'CANCELLED', label: 'Annulées' },
];

export function OrdersContent({ user }: OrdersContentProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedMode, setSelectedMode] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('PENDING');
  
  // Modals and drawers
  const [orderDetailOpened, { open: openOrderDetail, close: closeOrderDetail }] = useDisclosure(false);
  const [actionModalOpened, { open: openActionModal, close: closeActionModal }] = useDisclosure(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [actionType, setActionType] = useState<'accept' | 'reject' | 'refund' | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [refundAmount, setRefundAmount] = useState(0);

  const itemsPerPage = 10;

  // Filter orders based on active tab and filters
  const getFilteredOrders = () => {
    return orders.filter(order => {
      const matchesSearch = 
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.clientEmail.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = activeTab === 'ALL' || order.status === activeTab;
      const matchesMode = selectedMode === 'ALL' || order.mode === selectedMode;
      
      return matchesSearch && matchesStatus && matchesMode;
    });
  };

  const filteredOrders = getFilteredOrders();
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'yellow';
      case 'CONFIRMED': return 'blue';
      case 'PREPARING': return 'orange';
      case 'SHIPPED': return 'purple';
      case 'DELIVERED': return 'green';
      case 'CANCELLED': return 'red';
      case 'REFUNDED': return 'gray';
      default: return 'gray';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'En attente';
      case 'CONFIRMED': return 'Confirmée';
      case 'PREPARING': return 'En préparation';
      case 'SHIPPED': return 'Expédiée';
      case 'DELIVERED': return 'Livrée';
      case 'CANCELLED': return 'Annulée';
      case 'REFUNDED': return 'Remboursée';
      default: return status;
    }
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'DIRECT_PURCHASE': return 'Achat direct';
      case 'AUCTION_WIN': return 'Enchère';
      default: return mode;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'yellow';
      case 'PAID': return 'green';
      case 'FAILED': return 'red';
      case 'REFUNDED': return 'gray';
      default: return 'gray';
    }
  };

  const handleOrderAction = async (orderId: string, action: 'accept' | 'reject', note?: string) => {
    try {
      setLoading(true);
      
      setOrders(prev => prev.map(order => {
        if (order.id === orderId) {
          const newStatus = action === 'accept' ? 'CONFIRMED' : 'CANCELLED';
          return {
            ...order,
            status: newStatus as Order['status'],
            updatedAt: new Date().toISOString(),
            timeline: [
              ...order.timeline,
              {
                status: newStatus,
                timestamp: new Date().toISOString(),
                note: note || (action === 'accept' ? 'Commande acceptée' : 'Commande refusée'),
              },
            ],
          };
        }
        return order;
      }));

      notifications.show({
        title: action === 'accept' ? 'Commande acceptée' : 'Commande refusée',
        message: `La commande #${orders.find(o => o.id === orderId)?.orderNumber} a été ${action === 'accept' ? 'acceptée' : 'refusée'}`,
        color: action === 'accept' ? 'green' : 'red',
      });
    } catch (error) {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de traiter la commande',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (orderId: string, newStatus: Order['status']) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          timeline: [
            ...order.timeline,
            {
              status: newStatus,
              timestamp: new Date().toISOString(),
              note: `Statut changé vers ${getStatusLabel(newStatus)}`,
            },
          ],
        };
      }
      return order;
    }));
  };

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    openOrderDetail();
  };

  const openAction = (order: Order, action: 'accept' | 'reject' | 'refund') => {
    setSelectedOrder(order);
    setActionType(action);
    setActionNote('');
    setRefundAmount(action === 'refund' ? order.amount : 0);
    openActionModal();
  };

  const handleActionSubmit = async () => {
    if (!selectedOrder || !actionType) return;

    try {
      setLoading(true);

      if (actionType === 'refund') {
        // Handle refund
        notifications.show({
          title: 'Remboursement initié',
          message: `Remboursement de ${refundAmount} MAD en cours`,
          color: 'green',
        });
      } else {
        await handleOrderAction(selectedOrder.id, actionType, actionNote);
      }

      closeActionModal();
    } catch (error) {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de traiter l\'action',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const getTabCounts = () => {
    const counts: Record<string, number> = {};
    orderStatuses.forEach(status => {
      if (status.value === 'ALL') {
        counts[status.value] = orders.length;
      } else {
        counts[status.value] = orders.filter(order => order.status === status.value).length;
      }
    });
    return counts;
  };

  const tabCounts = getTabCounts();

  if (loading && orders.length === 0) {
    return (
      <Center style={{ height: 400 }}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <>
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between">
          <div>
            <Title order={1} size="2rem" mb="xs">
              Commandes
            </Title>
            <Text c="dimmed" size="lg">
              Gérez vos commandes et demandes clients
            </Text>
          </div>
          <Group gap="sm">
            <Button
              leftSection={<RefreshCw size={16} />}
              variant="light"
              onClick={() => window.location.reload()}
            >
              Actualiser
            </Button>
            <Button
              leftSection={<Download size={16} />}
              variant="outline"
            >
              Exporter
            </Button>
          </Group>
        </Group>

        {/* Filters */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                placeholder="Rechercher par numéro, client, email..."
                leftSection={<Search size={16} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Select
                placeholder="Mode de commande"
                data={[
                  { value: 'ALL', label: 'Tous les modes' },
                  { value: 'DIRECT_PURCHASE', label: 'Achat direct' },
                  { value: 'AUCTION_WIN', label: 'Enchère gagnante' },
                ]}
                value={selectedMode}
                onChange={(value) => setSelectedMode(value || 'ALL')}
                clearable={false}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Button
                variant="light"
                leftSection={<Filter size={16} />}
                onClick={() => {
                  setSearchQuery('');
                  setSelectedMode('ALL');
                }}
              >
                Réinitialiser
              </Button>
            </Grid.Col>
          </Grid>
        </Card>

        {/* Status Tabs */}
        <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'PENDING')}>
          <Tabs.List>
            {orderStatuses.map((status) => (
              <Tabs.Tab
                key={status.value}
                value={status.value}
                rightSection={
                  <Badge size="xs" variant="filled" color="gray">
                    {tabCounts[status.value] || 0}
                  </Badge>
                }
              >
                {status.label}
              </Tabs.Tab>
            ))}
          </Tabs.List>

          {/* Orders Table */}
          <Card shadow="sm" padding="lg" radius="md" withBorder mt="md">
            {paginatedOrders.length === 0 ? (
              <Center py="xl">
                <Stack align="center" gap="md">
                  <Package size={48} color="gray" />
                  <Text size="lg" c="dimmed">
                    Aucune commande trouvée
                  </Text>
                </Stack>
              </Center>
            ) : (
              <>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>N° Commande</Table.Th>
                      <Table.Th>Client</Table.Th>
                      <Table.Th>Montant</Table.Th>
                      <Table.Th>Mode</Table.Th>
                      <Table.Th>Statut</Table.Th>
                      <Table.Th>Paiement</Table.Th>
                      <Table.Th>Créé le</Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {paginatedOrders.map((order) => (
                      <Table.Tr key={order.id}>
                        <Table.Td>
                          <Text fw={500} size="sm">
                            {order.orderNumber}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="sm">
                            <Avatar src={order.clientAvatar} size="sm" radius="xl">
                              {order.clientName.charAt(0)}
                            </Avatar>
                            <div>
                              <Text fw={500} size="sm">
                                {order.clientName}
                              </Text>
                              <Text size="xs" c="dimmed">
                                {order.clientEmail}
                              </Text>
                            </div>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Text fw={500} c="green">
                            {new Intl.NumberFormat('fr-FR').format(order.amount)} MAD
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            color={order.mode === 'AUCTION_WIN' ? 'orange' : 'blue'}
                            variant="light"
                          >
                            {getModeLabel(order.mode)}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Badge color={getStatusColor(order.status)} variant="light">
                            {getStatusLabel(order.status)}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Badge color={getPaymentStatusColor(order.paymentStatus)} variant="light">
                            {order.paymentStatus === 'PAID' ? 'Payé' : 'En attente'}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">
                            {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <ActionIcon
                              variant="subtle"
                              onClick={() => openOrderDetails(order)}
                            >
                              <Eye size={16} />
                            </ActionIcon>
                            
                            {order.status === 'PENDING' && (
                              <>
                                <ActionIcon
                                  variant="subtle"
                                  color="green"
                                  onClick={() => openAction(order, 'accept')}
                                >
                                  <Check size={16} />
                                </ActionIcon>
                                <ActionIcon
                                  variant="subtle"
                                  color="red"
                                  onClick={() => openAction(order, 'reject')}
                                >
                                  <X size={16} />
                                </ActionIcon>
                              </>
                            )}
                            
                            <Menu shadow="md" width={200}>
                              <Menu.Target>
                                <ActionIcon variant="subtle">
                                  <MoreHorizontal size={16} />
                                </ActionIcon>
                              </Menu.Target>
                              <Menu.Dropdown>
                                <Menu.Item
                                  leftSection={<Eye size={16} />}
                                  onClick={() => openOrderDetails(order)}
                                >
                                  Voir détails
                                </Menu.Item>
                                <Menu.Item
                                  leftSection={<MessageCircle size={16} />}
                                >
                                  Contacter client
                                </Menu.Item>
                                {order.paymentStatus === 'PAID' && (
                                  <Menu.Item
                                    leftSection={<DollarSign size={16} />}
                                    onClick={() => openAction(order, 'refund')}
                                  >
                                    Rembourser
                                  </Menu.Item>
                                )}
                                <Menu.Item
                                  leftSection={<FileText size={16} />}
                                >
                                  Générer facture
                                </Menu.Item>
                              </Menu.Dropdown>
                            </Menu>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>

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
          </Card>
        </Tabs>
      </Stack>

      {/* Order Detail Drawer */}
      <OrderDetailDrawer
        opened={orderDetailOpened}
        onClose={closeOrderDetail}
        order={selectedOrder}
        onStatusChange={handleStatusChange}
      />

      {/* Action Modal */}
      <Modal
        opened={actionModalOpened}
        onClose={closeActionModal}
        title={
          actionType === 'accept' ? 'Accepter la commande' :
          actionType === 'reject' ? 'Refuser la commande' :
          'Rembourser la commande'
        }
        centered
      >
        <Stack gap="md">
          {actionType === 'refund' ? (
            <>
              <Alert color="orange" variant="light">
                <Text size="sm">
                  Cette action initiera un remboursement pour le client.
                </Text>
              </Alert>
              
              <NumberInput
                label="Montant à rembourser"
                value={refundAmount}
                onChange={(value) => setRefundAmount(value as number)}
                min={0}
                max={selectedOrder?.amount || 0}
                suffix=" MAD"
              />
            </>
          ) : (
            <>
              <Alert 
                color={actionType === 'accept' ? 'green' : 'red'} 
                variant="light"
              >
                <Text size="sm">
                  {actionType === 'accept' 
                    ? 'Cette action confirmera la commande et notifiera le client.'
                    : 'Cette action annulera la commande et notifiera le client.'
                  }
                </Text>
              </Alert>
              
              <Textarea
                label="Note (optionnelle)"
                placeholder="Ajouter une note pour le client..."
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                minRows={3}
              />
            </>
          )}
          
          <Group justify="flex-end" gap="sm">
            <Button variant="outline" onClick={closeActionModal}>
              Annuler
            </Button>
            <Button
              color={
                actionType === 'accept' ? 'green' :
                actionType === 'reject' ? 'red' : 'orange'
              }
              onClick={handleActionSubmit}
              loading={loading}
            >
              {actionType === 'accept' ? 'Accepter' :
               actionType === 'reject' ? 'Refuser' :
               'Rembourser'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}