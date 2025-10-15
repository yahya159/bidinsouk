'use client';

import { useState } from 'react';
import {
  Container,
  Title,
  Group,
  Button,
  Stack,
  Text,
} from '@mantine/core';
import { IconDownload, IconFileSpreadsheet } from '@tabler/icons-react';
import { OrdersTable } from '@/components/admin/orders/OrdersTable';
import { notifications } from '@mantine/notifications';

interface Order {
  id: string;
  number: string;
  total: number;
  status: string;
  fulfillStatus: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  store: {
    id: string;
    name: string;
    seller: {
      id: string;
      name: string;
      email: string;
    };
  };
}

interface OrdersPageClientProps {
  initialOrders: Order[];
  initialTotal: number;
}

export function OrdersPageClient({ initialOrders, initialTotal }: OrdersPageClientProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      // In a real implementation, this would call an export API endpoint
      // For now, we'll create a simple CSV export
      const csvHeaders = ['Order Number', 'Buyer', 'Seller', 'Amount', 'Status', 'Fulfillment', 'Date'];
      const csvRows = initialOrders.map((order) => [
        order.number,
        order.user.name,
        order.store.seller.name,
        order.total.toString(),
        order.status,
        order.fulfillStatus,
        new Date(order.createdAt).toLocaleDateString(),
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      notifications.show({
        title: 'Success',
        message: 'Orders exported successfully',
        color: 'green',
      });
    } catch (error) {
      console.error('Error exporting orders:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to export orders',
        color: 'red',
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={1}>Orders Management</Title>
            <Text c="dimmed" mt="xs">
              View and manage all orders in the system
            </Text>
          </div>
          <Button
            leftSection={<IconFileSpreadsheet size={16} />}
            variant="light"
            onClick={handleExport}
            loading={exporting}
          >
            Export to CSV
          </Button>
        </Group>

        <OrdersTable initialOrders={initialOrders} initialTotal={initialTotal} />
      </Stack>
    </Container>
  );
}
