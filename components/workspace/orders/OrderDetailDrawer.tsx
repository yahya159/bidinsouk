'use client';

import {
  Drawer,
  Stack,
  Title,
  Text,
  Group,
  Badge,
  Avatar,
  Divider,
  Button,
  Table,
  Image,
  Timeline,
  Select,
  Card,
} from '@mantine/core';
import {
  User,
  MapPin,
  Package,
  DollarSign,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';

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
  onStatusChange?: (orderId: string, newStatus: Order['status']) => void;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
};

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

const getTimelineIcon = (status: string) => {
  switch (status) {
    case 'PENDING': return <Clock size={16} />;
    case 'CONFIRMED': return <CheckCircle size={16} />;
    case 'PREPARING': return <Package size={16} />;
    case 'SHIPPED': return <Truck size={16} />;
    case 'DELIVERED': return <CheckCircle size={16} />;
    case 'CANCELLED': return <XCircle size={16} />;
    case 'REFUNDED': return <AlertCircle size={16} />;
    default: return <Clock size={16} />;
  }
};

export function OrderDetailDrawer({
  opened,
  onClose,
  order,
  onStatusChange,
}: OrderDetailDrawerProps) {
  if (!order) return null;

  const handleStatusChange = (value: string | null) => {
    if (value && onStatusChange) {
      onStatusChange(order.id, value as Order['status']);
    }
  };

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={
        <div>
          <Title order={3}>Détails de la commande</Title>
          <Text size="sm" c="dimmed">
            {order.orderNumber}
          </Text>
        </div>
      }
      position="right"
      size="xl"
      padding="lg"
    >
      <Stack gap="xl">
        {/* Status & Actions */}
        <Card withBorder padding="md">
          <Stack gap="md">
            <Group justify="space-between">
              <Text size="sm" fw={500}>
                Statut de la commande
              </Text>
              <Badge color={getStatusColor(order.status)} variant="light">
                {getStatusLabel(order.status)}
              </Badge>
            </Group>

            <Select
              label="Changer le statut"
              value={order.status}
              onChange={handleStatusChange}
              data={[
                { value: 'PENDING', label: 'En attente' },
                { value: 'CONFIRMED', label: 'Confirmée' },
                { value: 'PREPARING', label: 'En préparation' },
                { value: 'SHIPPED', label: 'Expédiée' },
                { value: 'DELIVERED', label: 'Livrée' },
                { value: 'CANCELLED', label: 'Annulée' },
              ]}
            />
          </Stack>
        </Card>

        {/* Client Information */}
        <div>
          <Group mb="md">
            <User size={20} />
            <Title order={4}>Informations client</Title>
          </Group>
          <Card withBorder padding="md">
            <Group>
              <Avatar src={order.clientAvatar} size="lg" radius="xl">
                {order.clientName.charAt(0)}
              </Avatar>
              <div>
                <Text fw={500}>{order.clientName}</Text>
                <Text size="sm" c="dimmed">
                  {order.clientEmail}
                </Text>
                {order.clientPhone && (
                  <Text size="sm" c="dimmed">
                    {order.clientPhone}
                  </Text>
                )}
              </div>
            </Group>
          </Card>
        </div>

        {/* Shipping Address */}
        <div>
          <Group mb="md">
            <MapPin size={20} />
            <Title order={4}>Adresse de livraison</Title>
          </Group>
          <Card withBorder padding="md">
            <Stack gap="xs">
              <Text fw={500}>{order.shippingAddress.fullName}</Text>
              <Text size="sm">{order.shippingAddress.address}</Text>
              <Text size="sm">
                {order.shippingAddress.postalCode} {order.shippingAddress.city}
              </Text>
              <Text size="sm">{order.shippingAddress.country}</Text>
              {order.shippingAddress.phone && (
                <Text size="sm" c="dimmed">
                  Tél: {order.shippingAddress.phone}
                </Text>
              )}
            </Stack>
          </Card>
        </div>

        {/* Order Items */}
        <div>
          <Group mb="md">
            <Package size={20} />
            <Title order={4}>Articles commandés</Title>
          </Group>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Produit</Table.Th>
                <Table.Th>Qté</Table.Th>
                <Table.Th>Prix</Table.Th>
                <Table.Th>Total</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {order.items.map((item) => (
                <Table.Tr key={item.id}>
                  <Table.Td>
                    <Group gap="sm">
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        width={40}
                        height={40}
                        radius="sm"
                      />
                      <Text size="sm">{item.productName}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{item.quantity}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{formatPrice(item.unitPrice)} MAD</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={500}>
                      {formatPrice(item.totalPrice)} MAD
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          {/* Total */}
          <Group justify="flex-end" mt="md">
            <Text size="lg" fw={700}>
              Total: {formatPrice(order.amount)} MAD
            </Text>
          </Group>
        </div>

        <Divider />

        {/* Payment Information */}
        <div>
          <Group mb="md">
            <DollarSign size={20} />
            <Title order={4}>Informations de paiement</Title>
          </Group>
          <Card withBorder padding="md">
            <Stack gap="sm">
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Méthode de paiement:
                </Text>
                <Text size="sm" fw={500}>
                  {order.paymentMethod}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Statut:
                </Text>
                <Badge
                  color={
                    order.paymentStatus === 'PAID'
                      ? 'green'
                      : order.paymentStatus === 'FAILED'
                      ? 'red'
                      : 'yellow'
                  }
                  variant="light"
                >
                  {order.paymentStatus === 'PAID'
                    ? 'Payé'
                    : order.paymentStatus === 'FAILED'
                    ? 'Échoué'
                    : 'En attente'}
                </Badge>
              </Group>
            </Stack>
          </Card>
        </div>

        {/* Tracking Number */}
        {order.trackingNumber && (
          <div>
            <Group mb="md">
              <Truck size={20} />
              <Title order={4}>Suivi de livraison</Title>
            </Group>
            <Card withBorder padding="md">
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Numéro de suivi:
                </Text>
                <Text size="sm" fw={500}>
                  {order.trackingNumber}
                </Text>
              </Group>
            </Card>
          </div>
        )}

        {/* Timeline */}
        <div>
          <Title order={4} mb="md">
            Historique
          </Title>
          <Timeline active={order.timeline.length - 1} bulletSize={32} lineWidth={2}>
            {order.timeline.map((event, index) => (
              <Timeline.Item
                key={index}
                bullet={getTimelineIcon(event.status)}
                title={getStatusLabel(event.status)}
              >
                <Text c="dimmed" size="xs">
                  {new Date(event.timestamp).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
                {event.note && (
                  <Text size="sm" mt={4}>
                    {event.note}
                  </Text>
                )}
              </Timeline.Item>
            ))}
          </Timeline>
        </div>
      </Stack>
    </Drawer>
  );
}
