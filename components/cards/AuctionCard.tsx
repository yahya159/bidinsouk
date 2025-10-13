'use client';

import {
  Card,
  Image,
  Text,
  Badge,
  Group,
  Avatar,
  Box,
  Stack,
  ActionIcon,
} from '@mantine/core';
import { Heart, Clock3 } from 'lucide-react';
import { badgeIcons, uiIcons } from '@/lib/iconMap';
import { AuctionData } from '@/lib/homeData';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface AuctionCardProps {
  auction: AuctionData;
}

export function AuctionCard({ auction }: AuctionCardProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);

  const handleCardClick = () => {
    router.push(`/auction/${auction.id}`);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'hot': return 'red';
      case 'live': return 'green';
      case 'trending': return 'blue';
      case 'verified': return 'teal';
      default: return 'gray';
    }
  };

  const getBadgeIcon = (badge: string) => {
    const IconComponent = badgeIcons[badge as keyof typeof badgeIcons];
    return IconComponent ? <IconComponent size={12} /> : null;
  };

  const StarIcon = uiIcons.star;

  return (
    <Card
      shadow="xs"
      padding="md"
      radius="lg"
      withBorder
      style={{
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        height: '100%',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        },
      }}
      onClick={handleCardClick}
    >
      <Card.Section style={{ position: 'relative' }}>
        <Image
          src={auction.image}
          height={200}
          alt={auction.title}
          style={{
            transition: 'transform 0.2s ease',
            '&:hover': {
              transform: 'scale(1.02)',
            },
          }}
        />
        
        {/* Badges */}
        <Box style={{ position: 'absolute', top: 12, left: 12 }}>
          <Stack gap={4}>
            {auction.badges.map((badge) => (
              <Badge
                key={badge}
                color={getBadgeColor(badge)}
                variant="filled"
                size="sm"
                leftSection={getBadgeIcon(badge)}
                style={{
                  textTransform: 'uppercase',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                }}
              >
                {badge === 'hot' ? 'HOT' : 
                 badge === 'live' ? 'LIVE' : 
                 badge === 'trending' ? 'TRENDING' : 
                 badge === 'verified' ? 'VÉRIFIÉE' : badge}
              </Badge>
            ))}
          </Stack>
        </Box>

        {/* Like Button */}
        <ActionIcon
          variant="filled"
          color={isLiked ? 'red' : 'gray'}
          size="md"
          radius="xl"
          onClick={handleLikeClick}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            backgroundColor: isLiked ? '#fa5252' : 'rgba(255,255,255,0.9)',
            color: isLiked ? 'white' : '#666',
            '&:hover': {
              backgroundColor: isLiked ? '#e03131' : 'white',
            },
          }}
        >
          <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
        </ActionIcon>
      </Card.Section>

      <Stack gap="sm" mt="md">
        {/* Title */}
        <Text
          fw={600}
          size="sm"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.3,
            minHeight: '2.6em',
          }}
        >
          {auction.title}
        </Text>

        {/* Seller */}
        <Group gap="xs">
          <Avatar src={auction.seller.avatar} size="xs" radius="xl" />
          <Text size="xs" c="dimmed">
            {auction.seller.name}
          </Text>
          <Group gap={2}>
            <StarIcon size={12} color="#ffd43b" fill="#ffd43b" />
            <Text size="xs" c="dimmed">
              {auction.seller.rating}
            </Text>
          </Group>
        </Group>

        {/* Price and Bids */}
        <Group justify="space-between" align="center">
          <Box>
            <Text size="lg" fw={700} c="blue">
              {new Intl.NumberFormat('fr-FR').format(auction.currentPrice)} MAD
            </Text>
            <Text size="xs" c="dimmed">
              {auction.bidCount} enchères
            </Text>
          </Box>
        </Group>

        {/* Time Left */}
        <Group justify="center" gap="xs" p="xs" style={{ 
          backgroundColor: auction.status === 'live' ? '#e7f5ff' : '#fff3cd',
          borderRadius: 8,
        }}>
          <Clock3 size={14} color={auction.status === 'live' ? '#228be6' : '#fd7e14'} />
          <Text 
            size="sm" 
            fw={500} 
            c={auction.status === 'live' ? 'blue' : 'orange'}
          >
            {auction.status === 'live' ? 'En cours' : auction.timeLeft}
          </Text>
        </Group>
      </Stack>
    </Card>
  );
}