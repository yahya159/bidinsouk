import { Card, Stack, Text, Group, Badge, Button, Avatar, Divider } from '@mantine/core';
import { Eye, Check, X, Package } from 'lucide-react';
import { memo } from 'react';

export interface OrderCardProps {
  orderNumber: string;
  clientName: string;
  clientEmail: string;
  clientAvatar?: string;
  amount: number;
  mode: 'DIRECT_PURCHASE' | 'AUCTION_WIN';
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  itemsCount: number;
  createdAt: string;
  onViewDetails?: () => void;
  onAccept?: () => void;
  onReject?: () => void;
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

const getModeLabel = (mode: string) => {
  return mode === 'DIRECT_PURCHASE' ? 'Achat direct' : 'Enchère';
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

const getPaymentStatusLabel = (status: string) => {
  switch (status) {
    case 'PENDING': return 'En attente';
    case 'PAID': return 'Payé';
    case 'FAILED': return 'Échoué';
    case 'REFUNDED': return 'Remboursé';
    default: return status;
  }
};

export const OrderCard = memo(function OrderCard({
  orderNumber,
  clientName,
  clientEmail,
  clientAvatar,
  amount,
  mode,
  status,
  paymentStatus,
  itemsCount,
  createdAt,
  onViewDetails,
  onAccept,
  onReject,
}: OrderCardProps) {
  const isPending = status === 'PENDING';

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between">
          <div>
            <Text fw={600} size="sm">
              {orderNumber}
            </Text>
            <Text size="xs" c="dimmed">
              {new Date(createdAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </div>
          <Badge color={mode === 'AUCTION_WIN' ? 'orange' : 'blue'} variant="light">
            {getModeLabel(mode)}
          </Badge>
        </Group>

        <Divider />

        {/* Client Info */}
        <Group>
          <Avatar src={clientAvatar} size="md" radius="xl">
            {clientName.charAt(0)}
          </Avatar>
          <div style={{ flex: 1 }}>
            <Text fw={500} size="sm">
              {clientName}
            </Text>
            <Text size="xs" c="dimmed">
              {clientEmail}
            </Text>
          </div>
        </Group>

        {/* Order Details */}
        <Group justify="space-between">
          <div>
            <Text size="xs" c="dimmed" mb={4}>
              Montant
            </Text>
            <Text fw={700} size="lg" c="green">
              {formatPrice(amount)} MAD
            </Text>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Text size="xs" c="dimmed" mb={4}>
              Articles
            </Text>
            <Group gap={4} justify="flex-end">
              <Package size={16} />
              <Text fw={500}>{itemsCount}</Text>
            </Group>
          </div>
        </Group>

        {/* Status Badges */}
        <Group>
          <Badge color={getStatusColor(status)} variant="light">
            {getStatusLabel(status)}
          </Badge>
          <Badge color={getPaymentStatusColor(paymentStatus)} variant="dot">
            {getPaymentStatusLabel(paymentStatus)}
          </Badge>
        </Group>

        <Divider />

        {/* Actions */}
        <Group gap="xs">
          <Button
            variant="light"
            leftSection={<Eye size={16} />}
            onClick={onViewDetails}
            style={{ flex: 1 }}
          >
            Détails
          </Button>
          {isPending && onAccept && (
            <Button
              color="green"
              leftSection={<Check size={16} />}
              onClick={onAccept}
            >
              Accepter
            </Button>
          )}
          {isPending && onReject && (
            <Button
              color="red"
              variant="outline"
              leftSection={<X size={16} />}
              onClick={onReject}
            >
              Refuser
            </Button>
          )}
        </Group>
      </Stack>
    </Card>
  );
});

