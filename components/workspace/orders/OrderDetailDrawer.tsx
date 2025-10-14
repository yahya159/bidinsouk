'use client';

import { useState } from 'react';
import {
  Drawer,
  Title,
  Text,
  Stack,
  Card,
  Group,
  Badge,
  Avatar,
  Timeline,
  Button,
  Textarea,
  TextInput,
  NumberInput,
  Select,
  Divider,
  ScrollArea,
  ActionIcon,
  Tooltip,
  Grid,
  Alert,
  Table,
} from '@mantine/core';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  MessageCircle,
  Download,
  RotateCcw as Refund,
  MapPin,
  CreditCard,
  FileText,
  Phone,
  Mail,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { notifications } from '@mantine/notifications';

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

interface OrderDetailDrawerProps {
  opened: boolean;
  onClose: () => void;
  order: Order | null;
  onStatusChange: (orderId: string, status: Order['status']) => void;
}

export function OrderDetailDrawer({
  opened,
  onClose,
  order,
  onStatusChange,
}: OrderDetailDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [newStatus, setNewStatus] = useState<Order['status']>('PENDING');
  const [message, setMessage] = useState('');
  const [refundAmount, setRefundAmount] = useState(0);
  const [trackingNumber, setTrackingNumber] = useState('');

  if (!order) return null;

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

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'yellow';
      case 'PAID': return 'green';
      case 'FAILED': return 'red';
      case 'REFUNDED': return 'gray';
      default: return 'gray';
    }
  };

  const handleStatusChange = async () => {
    try {
      setLoading(true);
      onStatusChange(order.id, newStatus);
      
      notifications.show({
        title: 'Statut mis à jour',
        message: `La commande est maintenant ${getStatusLabel(newStatus).toLowerCase()}`,
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

  const handleSendMessage = async () => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      notifications.show({
        title: 'Message envoyé',
        message: 'Le client a été notifié',
        color: 'green',
      });
      
      setMessage('');
    } catch (error) {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible d\'envoyer le message',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      notifications.show({
        title: 'Remboursement initié',
        message: `Remboursement de ${refundAmount} MAD en cours`,
        color: 'green',
      });
      
      setRefundAmount(0);
    } catch (error) {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible d\'initier le remboursement',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateInvoice = () => {
    notifications.show({
      title: 'Facture générée',
      message: 'La facture PDF a été téléchargée',
      color: 'blue',
    });
  };

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <Package size={20} />
          <div>
            <Text fw={600}>Commande #{order.orderNumber}</Text>
            <Text size="sm" c="dimmed">{order.clientName}</Text>
          </div>
        </Group>
      }
      position="right"
      size="xl"
    >
      <ScrollArea style={{ height: 'calc(100vh - 120px)' }}>
        <Stack gap="md">
          {/* Order Status */}
          <Card shadow="sm" padding="md" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <Text fw={500}>Statut de la commande</Text>
              <Badge color={getStatusColor(order.status)} variant="light" size="lg">
                {getStatusLabel(order.status)}
              </Badge>
            </Group>
            
            <Grid>
              <Grid.Col span={8}>
                <Select
                  label="Changer le statut"
                  data={[
                    { value: 'PENDING', label: 'En attente' },
                    { value: 'CONFIRMED', label: 'Confirmée' },
                    { value: 'PREPARING', label: 'En préparation' },
                    { value: 'SHIPPED', label: 'Expédiée' },
                    { value: 'DELIVERED', label: 'Livrée' },
                    { value: 'CANCELLED', label: 'Annulée' },
                  ]}
                  value={newStatus}
                  onChange={(value) => setNewStatus(value as Order['status'])}
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <Button
                  fullWidth
                  mt="xl"
                  onClick={handleStatusChange}
                  loading={loading}
                  disabled={newStatus === order.status}
                >
                  Mettre à jour
                </Button>
              </Grid.Col>
            </Grid>
          </Card>

          {/* Client Information */}
          <Card shadow="sm" padding="md" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <Text fw={500}>Informations client</Text>
              <Group gap="xs">
                <ActionIcon variant="light" size="sm">
                  <Phone size={14} />
                </ActionIcon>
                <ActionIcon variant="light" size="sm">
                  <Mail size={14} />
                </ActionIcon>
                <ActionIcon variant="light" size="sm">
                  <MessageCircle size={14} />
                </ActionIcon>
              </Group>
            </Group>
            
            <Group gap="md">
              <Avatar src={order.clientAvatar} size="lg" radius="xl">
                {order.clientName.charAt(0)}
              </Avatar>
              <div>
                <Text fw={500}>{order.clientName}</Text>
                <Text size="sm" c="dimmed">{order.clientEmail}</Text>
                {order.clientPhone && (
                  <Text size="sm" c="dimmed">{order.clientPhone}</Text>
                )}
              </div>
            </Group>
          </Card>

          {/* Order Details */}
          <Card shadow="sm" padding="md" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <Text fw={500}>Détails de la commande</Text>
              <Group gap="xs">
                <Badge color={order.mode === 'AUCTION_WIN' ? 'orange' : 'blue'} variant="light">
                  {order.mode === 'AUCTION_WIN' ? 'Enchère' : 'Achat direct'}
                </Badge>
                <Badge color={getPaymentStatusColor(order.paymentStatus)} variant="light">
                  {order.paymentStatus === 'PAID' ? 'Payé' : 'En attente'}
                </Badge>
              </Group>
            </Group>
            
            <Grid>
              <Grid.Col span={6}>
                <Text size="sm" c="dimmed">Montant total</Text>
                <Text size="xl" fw={700} c="green">
                  {new Intl.NumberFormat('fr-FR').format(order.amount)} MAD
                </Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" c="dimmed">Mode de paiement</Text>
                <Text fw={500}>{order.paymentMethod}</Text>
              </Grid.Col>
            </Grid>
            
            <Divider my="md" />
            
            <Text size="sm" fw={500} mb="xs">Articles commandés</Text>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Produit</Table.Th>
                  <Table.Th>Qté</Table.Th>
                  <Table.Th>Prix unitaire</Table.Th>
                  <Table.Th>Total</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {order.items.map((item) => (
                  <Table.Tr key={item.id}>
                    <Table.Td>
                      <Group gap="sm">
                        <Avatar src={item.productImage} size="sm" radius="sm">
                          <Package size={16} />
                        </Avatar>
                        <Text size="sm">{item.productName}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>{item.quantity}</Table.Td>
                    <Table.Td>{new Intl.NumberFormat('fr-FR').format(item.unitPrice)} MAD</Table.Td>
                    <Table.Td fw={500}>{new Intl.NumberFormat('fr-FR').format(item.totalPrice)} MAD</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>

          {/* Shipping Address */}
          <Card shadow="sm" padding="md" radius="md" withBorder>
            <Group gap="sm" mb="md">
              <MapPin size={16} />
              <Text fw={500}>Adresse de livraison</Text>
            </Group>
            
            <Stack gap="xs">
              <Text fw={500}>{order.shippingAddress.fullName}</Text>
              <Text size="sm">{order.shippingAddress.address}</Text>
              <Text size="sm">
                {order.shippingAddress.city}, {order.shippingAddress.postalCode}
              </Text>
              <Text size="sm">{order.shippingAddress.country}</Text>
              {order.shippingAddress.phone && (
                <Text size="sm" c="dimmed">Tél: {order.shippingAddress.phone}</Text>
              )}
            </Stack>
          </Card>

          {/* Timeline */}
          <Card shadow="sm" padding="md" radius="md" withBorder>
            <Text fw={500} mb="md">Historique de la commande</Text>
            
            <Timeline active={order.timeline.length - 1} bulletSize={24} lineWidth={2}>
              {order.timeline.map((event, index) => (
                <Timeline.Item
                  key={index}
                  bullet={
                    <CheckCircle size={16} />
                  }
                  title={getStatusLabel(event.status)}
                >
                  <Text size="sm" c="dimmed">
                    {new Date(event.timestamp).toLocaleString('fr-FR')}
                  </Text>
                  {event.note && (
                    <Text size="sm" mt="xs">
                      {event.note}
                    </Text>
                  )}
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>

          {/* Tracking */}
          {order.status === 'SHIPPED' && (
            <Card shadow="sm" padding="md" radius="md" withBorder>
              <Group gap="sm" mb="md">
                <Truck size={16} />
                <Text fw={500}>Suivi de livraison</Text>
              </Group>
              
              <Group gap="md">
                <TextInput
                  placeholder="Numéro de suivi"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  style={{ flex: 1 }}
                />
                <Button variant="light">
                  Mettre à jour
                </Button>
              </Group>
              
              {order.trackingNumber && (
                <Alert color="blue" variant="light" mt="md">
                  <Text size="sm">
                    Numéro de suivi: <Text component="span" fw={500}>{order.trackingNumber}</Text>
                  </Text>
                </Alert>
              )}
            </Card>
          )}

          {/* Actions */}
          <Card shadow="sm" padding="md" radius="md" withBorder>
            <Text fw={500} mb="md">Actions</Text>
            
            <Stack gap="md">
              {/* Message Client */}
              <div>
                <Text size="sm" fw={500} mb="xs">Envoyer un message au client</Text>
                <Group gap="md">
                  <Textarea
                    placeholder="Votre message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    style={{ flex: 1 }}
                    minRows={2}
                  />
                  <Button
                    leftSection={<MessageCircle size={16} />}
                    onClick={handleSendMessage}
                    loading={loading}
                    disabled={!message.trim()}
                  >
                    Envoyer
                  </Button>
                </Group>
              </div>

              {/* Refund */}
              {order.paymentStatus === 'PAID' && (
                <div>
                  <Text size="sm" fw={500} mb="xs">Remboursement partiel</Text>
                  <Group gap="md">
                    <NumberInput
                      placeholder="Montant"
                      value={refundAmount}
                      onChange={(value) => setRefundAmount(value as number)}
                      min={0}
                      max={order.amount}
                      suffix=" MAD"
                      style={{ flex: 1 }}
                    />
                    <Button
                      leftSection={<Refund size={16} />}
                      onClick={handleRefund}
                      loading={loading}
                      color="orange"
                      disabled={refundAmount <= 0}
                    >
                      Rembourser
                    </Button>
                  </Group>
                </div>
              )}

              {/* Generate Invoice */}
              <Button
                leftSection={<Download size={16} />}
                variant="light"
                onClick={generateInvoice}
                fullWidth
              >
                Télécharger la facture PDF
              </Button>
            </Stack>
          </Card>
        </Stack>
      </ScrollArea>
    </Drawer>
  );
}