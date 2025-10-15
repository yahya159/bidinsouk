'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Badge,
  Button,
  NumberInput,
  Progress,
  Avatar,
  Divider,
  Alert,
} from '@mantine/core';
import {
  IconClock,
  IconHammer,
  IconTrendingUp,
  IconAlertCircle,
  IconWifi,
  IconWifiOff,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useRealtimeAuction } from '@/hooks/useRealtimeAuction';

interface Auction {
  id: number;
  title: string;
  description: string | null;
  currentBid: number;
  startPrice: number;
  minIncrement: number;
  endAt: string;
  status: string;
  bidsCount: number;
  images?: any;
}

interface AuctionDetailRealtimeProps {
  auction: Auction;
  userId?: number;
}

export function AuctionDetailRealtime({ auction: initialAuction, userId }: AuctionDetailRealtimeProps) {
  const [auction, setAuction] = useState(initialAuction);
  const [bidAmount, setBidAmount] = useState(
    initialAuction.currentBid + initialAuction.minIncrement
  );
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Real-time updates
  const { isConnected, connectionState } = useRealtimeAuction({
    auctionId: auction.id,
    onBidUpdate: useCallback((data: any) => {
      setAuction((prev) => ({
        ...prev,
        currentBid: data.currentBid,
        bidsCount: data.bidCount,
      }));
      
      // Update minimum bid amount
      setBidAmount(data.currentBid + auction.minIncrement);
    }, [auction.minIncrement]),
    onAuctionExtend: useCallback((newEndTime: string) => {
      setAuction((prev) => ({
        ...prev,
        endAt: newEndTime,
      }));
    }, []),
    onAuctionEnd: useCallback((data: any) => {
      setAuction((prev) => ({
        ...prev,
        status: 'ENDED',
      }));
    }, []),
    onStatusChange: useCallback((status: string) => {
      setAuction((prev) => ({
        ...prev,
        status,
      }));
    }, []),
    enableNotifications: true,
    enablePollingFallback: true,
  });

  // Countdown timer
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const end = new Date(auction.endAt).getTime();
      const now = Date.now();
      const remaining = Math.max(0, end - now);
      setTimeRemaining(remaining);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [auction.endAt]);

  // Format time remaining
  const formatTimeRemaining = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return 'green';
      case 'ENDING_SOON':
        return 'orange';
      case 'ENDED':
        return 'gray';
      default:
        return 'blue';
    }
  };

  // Calculate progress (time elapsed)
  const calculateProgress = () => {
    const start = new Date(auction.endAt).getTime() - (24 * 60 * 60 * 1000); // Assume 24h duration
    const end = new Date(auction.endAt).getTime();
    const now = Date.now();
    const elapsed = now - start;
    const total = end - start;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  // Place bid
  const handlePlaceBid = async () => {
    if (!userId) {
      notifications.show({
        title: 'Authentication Required',
        message: 'Please sign in to place a bid',
        color: 'red',
      });
      return;
    }

    if (bidAmount < auction.currentBid + auction.minIncrement) {
      notifications.show({
        title: 'Invalid Bid',
        message: `Minimum bid is ${new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(auction.currentBid + auction.minIncrement)}`,
        color: 'red',
      });
      return;
    }

    setIsPlacingBid(true);

    try {
      const response = await fetch(`/api/auctions/${auction.id}/bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: bidAmount }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to place bid');
      }

      notifications.show({
        title: 'Bid Placed!',
        message: `Your bid of ${new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(bidAmount)} has been placed`,
        color: 'green',
      });

      // Update local state (will also be updated via Pusher)
      setAuction((prev) => ({
        ...prev,
        currentBid: bidAmount,
        bidsCount: prev.bidsCount + 1,
      }));

      // Reset bid amount to new minimum
      setBidAmount(bidAmount + auction.minIncrement);
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to place bid',
        color: 'red',
      });
    } finally {
      setIsPlacingBid(false);
    }
  };

  const isAuctionActive = auction.status === 'RUNNING' || auction.status === 'ENDING_SOON';
  const isAuctionEnded = auction.status === 'ENDED' || timeRemaining === 0;

  return (
    <Paper p="xl" shadow="sm">
      {/* Connection Status */}
      <Group justify="space-between" mb="md">
        <Title order={2}>{auction.title}</Title>
        <Group gap="xs">
          <Badge
            size="lg"
            color={getStatusColor(auction.status)}
            leftSection={
              isConnected ? (
                <IconWifi size={14} />
              ) : (
                <IconWifiOff size={14} />
              )
            }
          >
            {isConnected ? 'Live' : 'Reconnecting...'}
          </Badge>
          <Badge size="lg" color={getStatusColor(auction.status)}>
            {auction.status.replace('_', ' ')}
          </Badge>
        </Group>
      </Group>

      {/* Description */}
      {auction.description && (
        <Text c="dimmed" mb="xl">
          {auction.description}
        </Text>
      )}

      {/* Time Remaining */}
      {isAuctionActive && (
        <Stack gap="xs" mb="xl">
          <Group justify="space-between">
            <Group gap="xs">
              <IconClock size={20} />
              <Text fw={500}>Time Remaining</Text>
            </Group>
            <Text fw={700} size="lg" c={timeRemaining < 300000 ? 'red' : 'blue'}>
              {formatTimeRemaining(timeRemaining)}
            </Text>
          </Group>
          <Progress
            value={calculateProgress()}
            color={timeRemaining < 300000 ? 'red' : 'blue'}
            size="lg"
            animated
          />
        </Stack>
      )}

      {/* Current Bid */}
      <Paper p="md" withBorder mb="xl">
        <Group justify="space-between" align="center">
          <div>
            <Text size="sm" c="dimmed">
              Current Bid
            </Text>
            <Text size="xl" fw={700} c="green">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              }).format(auction.currentBid)}
            </Text>
          </div>
          <div>
            <Text size="sm" c="dimmed" ta="right">
              Total Bids
            </Text>
            <Group gap="xs" justify="flex-end">
              <IconTrendingUp size={20} color="green" />
              <Text size="xl" fw={700}>
                {auction.bidsCount}
              </Text>
            </Group>
          </div>
        </Group>
      </Paper>

      {/* Bid Form */}
      {isAuctionActive && !isAuctionEnded && userId && (
        <Stack gap="md" mb="xl">
          <NumberInput
            label="Your Bid"
            description={`Minimum bid: ${new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
            }).format(auction.currentBid + auction.minIncrement)}`}
            value={bidAmount}
            onChange={(value) => setBidAmount(Number(value))}
            min={auction.currentBid + auction.minIncrement}
            step={auction.minIncrement}
            prefix="$"
            size="lg"
            disabled={isPlacingBid}
          />
          <Button
            size="lg"
            leftSection={<IconHammer size={20} />}
            onClick={handlePlaceBid}
            loading={isPlacingBid}
            disabled={bidAmount < auction.currentBid + auction.minIncrement}
            fullWidth
          >
            Place Bid
          </Button>
        </Stack>
      )}

      {/* Auction Ended */}
      {isAuctionEnded && (
        <Alert
          icon={<IconAlertCircle size={20} />}
          title="Auction Ended"
          color="blue"
          mb="xl"
        >
          This auction has ended. The winner will be notified shortly.
        </Alert>
      )}

      {/* Not Logged In */}
      {!userId && isAuctionActive && (
        <Alert
          icon={<IconAlertCircle size={20} />}
          title="Sign In Required"
          color="orange"
          mb="xl"
        >
          Please sign in to place a bid on this auction.
        </Alert>
      )}

      <Divider my="xl" />

      {/* Auction Details */}
      <Stack gap="md">
        <Group justify="space-between">
          <Text c="dimmed">Starting Price</Text>
          <Text fw={500}>
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
            }).format(auction.startPrice)}
          </Text>
        </Group>
        <Group justify="space-between">
          <Text c="dimmed">Minimum Increment</Text>
          <Text fw={500}>
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
            }).format(auction.minIncrement)}
          </Text>
        </Group>
        <Group justify="space-between">
          <Text c="dimmed">Ends At</Text>
          <Text fw={500}>
            {new Date(auction.endAt).toLocaleString()}
          </Text>
        </Group>
      </Stack>

      {/* Connection Warning */}
      {!isConnected && (
        <Alert
          icon={<IconWifiOff size={20} />}
          title="Connection Issue"
          color="yellow"
          mt="xl"
        >
          Real-time updates are temporarily unavailable. The page will update automatically
          when the connection is restored.
        </Alert>
      )}
    </Paper>
  );
}
