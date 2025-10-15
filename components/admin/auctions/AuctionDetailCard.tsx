'use client';

import {
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Badge,
  Button,
  Grid,
  Timeline,
  Modal,
  NumberInput,
} from '@mantine/core';
import {
  IconEdit,
  IconTrash,
  IconClock,
  IconPlayerStop,
  IconCalendar,
  IconCurrencyDollar,
} from '@tabler/icons-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { AuctionStatus } from '@prisma/client';

interface Auction {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  currentBid: string;
  startPrice: string;
  reservePrice: string | null;
  minIncrement: string;
  startAt: Date;
  endAt: Date;
  status: AuctionStatus;
  autoExtend: boolean;
  extendMinutes: number;
  views: number;
  watchers: number;
  product: {
    id: string;
    title: string;
    images: any;
  } | null;
  store: {
    id: string;
    name: string;
    seller: {
      user: {
        id: string;
        name: string;
        email: string;
      };
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

interface AuctionDetailCardProps {
  auction: Auction;
}

export function AuctionDetailCard({ auction }: AuctionDetailCardProps) {
  const router = useRouter();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [endModalOpen, setEndModalOpen] = useState(false);
  const [extensionMinutes, setExtensionMinutes] = useState(30);
  const [loading, setLoading] = useState(false);

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const getStatusColor = (status: AuctionStatus) => {
    switch (status) {
      case 'SCHEDULED':
        return 'blue';
      case 'RUNNING':
        return 'green';
      case 'ENDING_SOON':
        return 'orange';
      case 'ENDED':
        return 'gray';
      case 'ARCHIVED':
        return 'dark';
      default:
        return 'gray';
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/auctions/${auction.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: 'Auction deleted successfully',
          color: 'green',
        });
        router.push('/admin-dashboard/auctions');
      } else {
        const error = await response.json();
        notifications.show({
          title: 'Error',
          message: error.error || 'Failed to delete auction',
          color: 'red',
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'An unexpected error occurred',
        color: 'red',
      });
    } finally {
      setLoading(false);
      setDeleteModalOpen(false);
    }
  };

  const handleExtend = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/auctions/${auction.id}/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minutes: extensionMinutes }),
      });

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: 'Auction extended successfully',
          color: 'green',
        });
        router.refresh();
      } else {
        const error = await response.json();
        notifications.show({
          title: 'Error',
          message: error.error || 'Failed to extend auction',
          color: 'red',
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'An unexpected error occurred',
        color: 'red',
      });
    } finally {
      setLoading(false);
      setExtendModalOpen(false);
    }
  };

  const handleEnd = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/auctions/${auction.id}/end`, {
        method: 'POST',
      });

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: 'Auction ended successfully',
          color: 'green',
        });
        router.refresh();
      } else {
        const error = await response.json();
        notifications.show({
          title: 'Error',
          message: error.error || 'Failed to end auction',
          color: 'red',
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'An unexpected error occurred',
        color: 'red',
      });
    } finally {
      setLoading(false);
      setEndModalOpen(false);
    }
  };

  return (
    <>
      <Paper p="md">
        <Group justify="space-between" mb="lg">
          <Title order={3}>{auction.title}</Title>
          <Badge size="lg" color={getStatusColor(auction.status)}>
            {auction.status.replace('_', ' ')}
          </Badge>
        </Group>

        <Grid>
          <Grid.Col span={6}>
            <Stack gap="md">
              <div>
                <Text size="sm" c="dimmed">
                  Description
                </Text>
                <Text>{auction.description || 'No description'}</Text>
              </div>

              <div>
                <Text size="sm" c="dimmed">
                  Category
                </Text>
                <Text>{auction.category || 'Uncategorized'}</Text>
              </div>

              <div>
                <Text size="sm" c="dimmed">
                  Store
                </Text>
                <Text fw={500}>{auction.store.name}</Text>
                <Text size="sm">{auction.store.seller.user.name}</Text>
              </div>

              {auction.product && (
                <div>
                  <Text size="sm" c="dimmed">
                    Product
                  </Text>
                  <Text>{auction.product.title}</Text>
                </div>
              )}
            </Stack>
          </Grid.Col>

          <Grid.Col span={6}>
            <Stack gap="md">
              <div>
                <Text size="sm" c="dimmed">
                  Current Bid
                </Text>
                <Text size="xl" fw={700} c="green">
                  {formatCurrency(auction.currentBid)}
                </Text>
              </div>

              <div>
                <Text size="sm" c="dimmed">
                  Start Price
                </Text>
                <Text>{formatCurrency(auction.startPrice)}</Text>
              </div>

              {auction.reservePrice && (
                <div>
                  <Text size="sm" c="dimmed">
                    Reserve Price
                  </Text>
                  <Text>{formatCurrency(auction.reservePrice)}</Text>
                </div>
              )}

              <div>
                <Text size="sm" c="dimmed">
                  Min Increment
                </Text>
                <Text>{formatCurrency(auction.minIncrement)}</Text>
              </div>

              <div>
                <Text size="sm" c="dimmed">
                  Auto-Extend
                </Text>
                <Text>
                  {auction.autoExtend
                    ? `Yes (${auction.extendMinutes} minutes)`
                    : 'No'}
                </Text>
              </div>
            </Stack>
          </Grid.Col>
        </Grid>

        <Title order={4} mt="xl" mb="md">
          Timeline
        </Title>
        <Timeline active={2} bulletSize={24} lineWidth={2}>
          <Timeline.Item
            bullet={<IconCalendar size={12} />}
            title="Auction Created"
          >
            <Text c="dimmed" size="sm">
              {formatDate(auction.createdAt)}
            </Text>
          </Timeline.Item>
          <Timeline.Item
            bullet={<IconClock size={12} />}
            title="Auction Start"
          >
            <Text c="dimmed" size="sm">
              {formatDate(auction.startAt)}
            </Text>
          </Timeline.Item>
          <Timeline.Item
            bullet={<IconPlayerStop size={12} />}
            title="Auction End"
          >
            <Text c="dimmed" size="sm">
              {formatDate(auction.endAt)}
            </Text>
          </Timeline.Item>
        </Timeline>

        <Group mt="xl">
          <Button
            leftSection={<IconEdit size={16} />}
            onClick={() => router.push(`/admin-dashboard/auctions/${auction.id}/edit`)}
          >
            Edit
          </Button>
          {(auction.status === 'RUNNING' || auction.status === 'ENDING_SOON') && (
            <>
              <Button
                leftSection={<IconClock size={16} />}
                variant="light"
                onClick={() => setExtendModalOpen(true)}
              >
                Extend
              </Button>
              <Button
                leftSection={<IconPlayerStop size={16} />}
                variant="light"
                color="orange"
                onClick={() => setEndModalOpen(true)}
              >
                End Early
              </Button>
            </>
          )}
          <Button
            leftSection={<IconTrash size={16} />}
            color="red"
            variant="light"
            onClick={() => setDeleteModalOpen(true)}
          >
            Delete
          </Button>
        </Group>
      </Paper>

      {/* Delete Modal */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Auction"
      >
        <Text>Are you sure you want to delete this auction? This action cannot be undone.</Text>
        <Group justify="flex-end" mt="md">
          <Button variant="light" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button color="red" onClick={handleDelete} loading={loading}>
            Delete
          </Button>
        </Group>
      </Modal>

      {/* Extend Modal */}
      <Modal
        opened={extendModalOpen}
        onClose={() => setExtendModalOpen(false)}
        title="Extend Auction"
      >
        <NumberInput
          label="Extension Duration (minutes)"
          value={extensionMinutes}
          onChange={(value) => setExtensionMinutes(Number(value))}
          min={1}
          max={1440}
        />
        <Group justify="flex-end" mt="md">
          <Button variant="light" onClick={() => setExtendModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExtend} loading={loading}>
            Extend
          </Button>
        </Group>
      </Modal>

      {/* End Modal */}
      <Modal
        opened={endModalOpen}
        onClose={() => setEndModalOpen(false)}
        title="End Auction Early"
      >
        <Text>Are you sure you want to end this auction early?</Text>
        <Group justify="flex-end" mt="md">
          <Button variant="light" onClick={() => setEndModalOpen(false)}>
            Cancel
          </Button>
          <Button color="orange" onClick={handleEnd} loading={loading}>
            End Auction
          </Button>
        </Group>
      </Modal>
    </>
  );
}
