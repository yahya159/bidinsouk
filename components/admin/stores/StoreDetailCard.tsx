'use client';

import {
  Card,
  Text,
  Badge,
  Group,
  Stack,
  Title,
  Divider,
  Grid,
  Table,
  Paper,
} from '@mantine/core';
import { IconMail, IconPhone, IconUser, IconCalendar } from '@tabler/icons-react';

type StoreStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';

interface Store {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string | null;
  status: StoreStatus;
  createdAt: string;
  address: any;
  socials: any;
  seo: any;
  seller: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      phone: string | null;
      avatarUrl: string | null;
    };
  };
  products?: Array<{
    id: string;
    title: string;
    status: string;
    price: string | null;
    createdAt: string;
  }>;
  auctions?: Array<{
    id: string;
    title: string;
    status: string;
    currentBid: string;
    endAt: string;
  }>;
  _count?: {
    products: number;
    auctions: number;
    orders: number;
  };
}

interface StoreDetailCardProps {
  store: Store;
}

export function StoreDetailCard({ store }: StoreDetailCardProps) {
  const getStatusBadgeColor = (status: StoreStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'green';
      case 'SUSPENDED':
        return 'red';
      case 'PENDING':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: string | null) => {
    if (!price) return 'N/A';
    return `$${parseFloat(price).toFixed(2)}`;
  };

  return (
    <Stack gap="md">
      {/* Store Information */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Group justify="space-between">
            <Title order={2}>{store.name}</Title>
            <Badge color={getStatusBadgeColor(store.status)} size="lg">
              {store.status}
            </Badge>
          </Group>

          <Divider />

          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="xs">
                <Group gap="xs">
                  <IconMail size={16} />
                  <Text size="sm" fw={500}>
                    Email:
                  </Text>
                  <Text size="sm">{store.email}</Text>
                </Group>

                {store.phone && (
                  <Group gap="xs">
                    <IconPhone size={16} />
                    <Text size="sm" fw={500}>
                      Phone:
                    </Text>
                    <Text size="sm">{store.phone}</Text>
                  </Group>
                )}

                <Group gap="xs">
                  <IconCalendar size={16} />
                  <Text size="sm" fw={500}>
                    Created:
                  </Text>
                  <Text size="sm">{formatDate(store.createdAt)}</Text>
                </Group>

                <Group gap="xs">
                  <Text size="sm" fw={500}>
                    Slug:
                  </Text>
                  <Text size="sm" c="dimmed">
                    {store.slug}
                  </Text>
                </Group>
              </Stack>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="xs">
                <Text size="sm" fw={500}>
                  Statistics:
                </Text>
                {store._count && (
                  <Stack gap={4}>
                    <Text size="sm">Products: {store._count.products}</Text>
                    <Text size="sm">Auctions: {store._count.auctions}</Text>
                    <Text size="sm">Orders: {store._count.orders}</Text>
                  </Stack>
                )}
              </Stack>
            </Grid.Col>
          </Grid>
        </Stack>
      </Card>

      {/* Seller Information */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Group gap="xs">
            <IconUser size={20} />
            <Title order={3}>Seller Information</Title>
          </Group>

          <Divider />

          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="xs">
                <Group gap="xs">
                  <Text size="sm" fw={500}>
                    Name:
                  </Text>
                  <Text size="sm">{store.seller.user.name}</Text>
                </Group>

                <Group gap="xs">
                  <Text size="sm" fw={500}>
                    Email:
                  </Text>
                  <Text size="sm">{store.seller.user.email}</Text>
                </Group>

                {store.seller.user.phone && (
                  <Group gap="xs">
                    <Text size="sm" fw={500}>
                      Phone:
                    </Text>
                    <Text size="sm">{store.seller.user.phone}</Text>
                  </Group>
                )}
              </Stack>
            </Grid.Col>
          </Grid>
        </Stack>
      </Card>

      {/* Recent Products */}
      {store.products && store.products.length > 0 && (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Title order={3}>Recent Products</Title>
            <Divider />
            <Paper withBorder>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Title</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Price</Table.Th>
                    <Table.Th>Created</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {store.products.map((product) => (
                    <Table.Tr key={product.id}>
                      <Table.Td>{product.title}</Table.Td>
                      <Table.Td>
                        <Badge size="sm">{product.status}</Badge>
                      </Table.Td>
                      <Table.Td>{formatPrice(product.price)}</Table.Td>
                      <Table.Td>
                        <Text size="sm">{formatDate(product.createdAt)}</Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          </Stack>
        </Card>
      )}

      {/* Recent Auctions */}
      {store.auctions && store.auctions.length > 0 && (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Title order={3}>Recent Auctions</Title>
            <Divider />
            <Paper withBorder>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Title</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Current Bid</Table.Th>
                    <Table.Th>Ends At</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {store.auctions.map((auction) => (
                    <Table.Tr key={auction.id}>
                      <Table.Td>{auction.title}</Table.Td>
                      <Table.Td>
                        <Badge size="sm">{auction.status}</Badge>
                      </Table.Td>
                      <Table.Td>{formatPrice(auction.currentBid)}</Table.Td>
                      <Table.Td>
                        <Text size="sm">{formatDate(auction.endAt)}</Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          </Stack>
        </Card>
      )}

      {/* Additional Data */}
      {(store.address || store.socials || store.seo) && (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Title order={3}>Additional Information</Title>
            <Divider />

            {store.address && (
              <div>
                <Text size="sm" fw={500} mb="xs">
                  Address:
                </Text>
                <Text size="sm" c="dimmed" style={{ whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(store.address, null, 2)}
                </Text>
              </div>
            )}

            {store.socials && (
              <div>
                <Text size="sm" fw={500} mb="xs">
                  Social Links:
                </Text>
                <Text size="sm" c="dimmed" style={{ whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(store.socials, null, 2)}
                </Text>
              </div>
            )}

            {store.seo && (
              <div>
                <Text size="sm" fw={500} mb="xs">
                  SEO Data:
                </Text>
                <Text size="sm" c="dimmed" style={{ whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(store.seo, null, 2)}
                </Text>
              </div>
            )}
          </Stack>
        </Card>
      )}
    </Stack>
  );
}
