/**
 * AUCTION CARD COMPONENT
 * 
 * Features:
 * - Real-time countdown timer
 * - Reserve price indicator (hidden amount)
 * - Quick bid functionality
 * - Auto-extend indicator
 * - Buy Now button
 * - Bid count and watchers
 * - Status badges
 */

'use client';

import { Card, Image, Stack, Text, Group, Badge, Button, ActionIcon, Progress, Tooltip } from '@mantine/core';
import { 
  Heart, 
  Gavel, 
  Clock, 
  TrendingUp, 
  Eye, 
  Users, 
  Zap,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { memo, useState, useEffect } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface AuctionCardProps {
  id: string;
  title: string;
  imageUrl: string;
  currentBid: number;
  startPrice: number;
  reservePrice?: number | null;
  reserveMet: boolean;
  buyNowPrice?: number | null;
  minIncrement: number;
  endAt: string; // ISO string
  status: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'RUNNING' | 'ENDING_SOON' | 'ENDED' | 'CANCELLED';
  autoExtend: boolean;
  extensionCount?: number;
  category?: string;
  bidsCount: number;
  watchersCount: number;
  seller?: {
    name: string;
  };
  isWatching?: boolean;
  onToggleWatch?: (e: React.MouseEvent) => void;
  onQuickBid?: (e: React.MouseEvent) => void;
  onBuyNow?: (e: React.MouseEvent) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const AuctionCard = memo(function AuctionCard({
  id,
  title,
  imageUrl,
  currentBid,
  startPrice,
  reservePrice,
  reserveMet,
  buyNowPrice,
  minIncrement,
  endAt,
  status,
  autoExtend,
  extensionCount = 0,
  category,
  bidsCount,
  watchersCount,
  seller,
  isWatching = false,
  onToggleWatch,
  onQuickBid,
  onBuyNow
}: AuctionCardProps) {
  
  // State for countdown
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [timeProgress, setTimeProgress] = useState<number>(0);
  const [isEnded, setIsEnded] = useState(status === 'ENDED');

  // Countdown timer
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const end = new Date(endAt).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeRemaining('Ended');
        setIsEnded(true);
        setTimeProgress(100);
        return;
      }

      // Calculate time units
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      // Format display
      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }

      // Calculate progress (assume 7 days max for progress bar)
      const totalDuration = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
      const elapsed = totalDuration - diff;
      setTimeProgress(Math.min(100, (elapsed / totalDuration) * 100));
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [endAt]);

  // Determine status color and text
  const getStatusInfo = () => {
    switch (status) {
      case 'ENDING_SOON':
        return { color: 'red', text: 'Ending Soon', pulse: true };
      case 'ACTIVE':
      case 'RUNNING':
        return { color: 'green', text: 'Live', pulse: false };
      case 'ENDED':
        return { color: 'gray', text: 'Ended', pulse: false };
      case 'SCHEDULED':
        return { color: 'blue', text: 'Upcoming', pulse: false };
      case 'CANCELLED':
        return { color: 'red', text: 'Cancelled', pulse: false };
      default:
        return { color: 'gray', text: status, pulse: false };
    }
  };

  const statusInfo = getStatusInfo();
  const isActive = ['ACTIVE', 'RUNNING', 'ENDING_SOON'].includes(status);
  const nextBid = currentBid > 0 ? currentBid + minIncrement : startPrice;

  return (
    <Card
      component={Link}
      href={`/auction/${id}`}
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      style={{ 
        cursor: 'pointer', 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      className="hover:shadow-lg"
    >
      {/* Image Section */}
      <Card.Section style={{ position: 'relative' }}>
        <Image
          src={imageUrl}
          alt={title}
          height={200}
          fit="cover"
          fallbackSrc="https://placehold.co/400x400?text=Auction+Item"
        />
        
        {/* Status Badge */}
        <Group 
          gap="xs" 
          style={{ 
            position: 'absolute', 
            top: 8, 
            left: 8, 
            right: 8 
          }}
          justify="space-between"
        >
          <Badge 
            color={statusInfo.color} 
            size="sm" 
            variant="filled"
            style={{
              animation: statusInfo.pulse ? 'pulse 2s infinite' : 'none'
            }}
          >
            {statusInfo.text}
          </Badge>
          
          {autoExtend && isActive && (
            <Tooltip label={`Auto-extends by 5 min (${extensionCount} extensions so far)`}>
              <Badge color="orange" size="sm" variant="light">
                <Zap size={12} style={{ marginRight: 4 }} />
                Anti-Snipe
              </Badge>
            </Tooltip>
          )}
        </Group>

        {/* Watch Button */}
        <ActionIcon
          style={{ 
            position: 'absolute', 
            bottom: 8, 
            right: 8,
            backgroundColor: 'rgba(255, 255, 255, 0.9)'
          }}
          variant={isWatching ? 'filled' : 'light'}
          color="red"
          size="md"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleWatch?.(e);
          }}
          aria-label="Watch auction"
        >
          <Heart 
            size={16} 
            fill={isWatching ? 'currentColor' : 'none'}
          />
        </ActionIcon>

        {/* Buy Now Badge */}
        {buyNowPrice && isActive && (
          <Badge
            color="violet"
            size="sm"
            variant="filled"
            style={{
              position: 'absolute',
              top: 8,
              right: 8
            }}
          >
            Buy Now Available
          </Badge>
        )}
      </Card.Section>

      {/* Content */}
      <Stack gap="sm" mt="md" style={{ flex: 1 }} justify="space-between">
        <div>
          {/* Category */}
          {category && (
            <Text size="xs" c="dimmed" mb="xs">
              {category}
            </Text>
          )}

          {/* Title */}
          <Text fw={500} size="sm" lineClamp={2} mb="xs">
            {title}
          </Text>

          {/* Current Bid */}
          <Group gap="xs" align="baseline" mb="xs">
            <Text size="xs" c="dimmed">
              Current Bid:
            </Text>
            <Text fw={700} size="lg" c="blue">
              {formatPrice(currentBid > 0 ? currentBid : startPrice)} د.م
            </Text>
          </Group>

          {/* Reserve Price Indicator */}
          {reservePrice && !isEnded && (
            <Group gap="xs" mb="xs">
              {reserveMet ? (
                <Tooltip label="Reserve price has been met">
                  <Badge 
                    color="green" 
                    size="sm" 
                    variant="light"
                    leftSection={<CheckCircle size={12} />}
                  >
                    Reserve Met
                  </Badge>
                </Tooltip>
              ) : (
                <Tooltip label="Reserve price not yet met">
                  <Badge 
                    color="orange" 
                    size="sm" 
                    variant="light"
                    leftSection={<AlertCircle size={12} />}
                  >
                    Reserve Not Met
                  </Badge>
                </Tooltip>
              )}
            </Group>
          )}

          {/* Buy Now Price */}
          {buyNowPrice && isActive && (
            <Group gap="xs" align="baseline" mb="xs">
              <Text size="xs" c="dimmed">
                Buy Now:
              </Text>
              <Text fw={600} size="md" c="violet">
                {formatPrice(buyNowPrice)} د.م
              </Text>
            </Group>
          )}

          {/* Countdown */}
          <Group gap="xs" mb="xs">
            <Clock size={14} style={{ color: isEnded ? '#aaa' : '#228be6' }} />
            <Text size="sm" fw={500} c={isEnded ? 'dimmed' : 'blue'}>
              {timeRemaining}
            </Text>
          </Group>

          {/* Progress Bar */}
          {!isEnded && (
            <Progress 
              value={timeProgress} 
              size="xs" 
              color={status === 'ENDING_SOON' ? 'red' : 'blue'}
              mb="xs"
            />
          )}

          {/* Stats */}
          <Group gap="md" mb="xs">
            <Group gap={4}>
              <Gavel size={14} style={{ color: '#868e96' }} />
              <Text size="xs" c="dimmed">
                {bidsCount} bids
              </Text>
            </Group>
            <Group gap={4}>
              <Eye size={14} style={{ color: '#868e96' }} />
              <Text size="xs" c="dimmed">
                {watchersCount} watching
              </Text>
            </Group>
          </Group>

          {/* Seller */}
          {seller && (
            <Text size="xs" c="dimmed">
              Seller: {seller.name}
            </Text>
          )}
        </div>

        {/* Action Buttons */}
        <div>
          {isActive && (
            <Stack gap="xs">
              <Button
                fullWidth
                leftSection={<TrendingUp size={16} />}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onQuickBid?.(e);
                }}
                size="sm"
                variant="filled"
              >
                Bid {formatPrice(nextBid)} د.م
              </Button>

              {buyNowPrice && (
                <Button
                  fullWidth
                  leftSection={<Zap size={16} />}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onBuyNow?.(e);
                  }}
                  size="sm"
                  variant="light"
                  color="violet"
                >
                  Buy Now {formatPrice(buyNowPrice)} د.م
                </Button>
              )}
            </Stack>
          )}

          {isEnded && (
            <Badge color="gray" size="lg" fullWidth>
              Auction Ended
            </Badge>
          )}

          {status === 'SCHEDULED' && (
            <Badge color="blue" size="lg" fullWidth>
              Starting Soon
            </Badge>
          )}
        </div>
      </Stack>
    </Card>
  );
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

// Add pulse animation CSS (add to globals.css)
/*
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
*/
