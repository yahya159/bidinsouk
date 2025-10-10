'use client'

import { Card, Text, Title, Group, Badge, Button, Progress, Stack, Box, ActionIcon } from '@mantine/core'
import { IconHeart, IconEye, IconClock } from '@tabler/icons-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function AuctionCard(props: { auction: any }) {
  const { auction } = props;
  
  // State for watchlist
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  
  // Format date
  const endDate = new Date(auction.endAt);
  const now = new Date();
  const timeLeft = endDate.getTime() - now.getTime();
  
  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

  // Calculate progress (0-100%) based on time remaining
  const totalTime = new Date(auction.endAt).getTime() - new Date(auction.startAt).getTime();
  const elapsed = now.getTime() - new Date(auction.startAt).getTime();
  const progress = Math.min(100, Math.max(0, (elapsed / totalTime) * 100));
  
  // Use real data or fallback to mock data
  const bidCount = auction.bids?.length || Math.floor(Math.random() * 20) + 1;
  const watchingCount = auction.watchlistItems?.length || Math.floor(Math.random() * 50) + 1;
  
  // Get product title from product relation if available
  const title = auction.product?.title || auction.title || "Enchère sans titre";
  
  // Get store name from store relation if available
  const storeName = auction.store?.name || "Boutique inconnue";
  
  // Format prices
  const startPrice = parseFloat(auction.startPrice);
  const currentPrice = auction.currentBid ? parseFloat(auction.currentBid) : startPrice;
  const reservePrice = auction.reservePrice ? parseFloat(auction.reservePrice) : null;
  
  // Check if reserve is met
  const reserveMet = reservePrice ? currentPrice >= reservePrice : false;
  
  // Check if item is in watchlist
  useEffect(() => {
    // In a real implementation, you would check if the item is in the watchlist
    // This is a placeholder implementation
    setIsInWatchlist(false);
  }, [auction.id]);
  
  const toggleWatchlist = async () => {
    setWatchlistLoading(true);
    try {
      if (isInWatchlist) {
        // Remove from watchlist
        const response = await fetch(`/api/watchlist/${auction.id}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          setIsInWatchlist(false);
        }
      } else {
        // Add to watchlist
        const response = await fetch('/api/watchlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ productId: auction.id }),
        });
        
        if (response.ok) {
          setIsInWatchlist(true);
        }
      }
    } catch (error) {
      console.error('Error updating watchlist:', error);
    } finally {
      setWatchlistLoading(false);
    }
  };
  
  return (
    <Card 
      shadow="sm" 
      padding="md" 
      radius="md" 
      withBorder 
      style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      {/* Reserve status badge */}
      {reservePrice && (
        <Badge 
          color={reserveMet ? 'green' : 'red'} 
          variant="light" 
          style={{ position: 'absolute', top: '10px', right: '40px', zIndex: 1 }}
        >
          {reserveMet ? 'Reserve atteinte' : 'Reserve non atteinte'}
        </Badge>
      )}
      
      {/* Watchlist heart icon */}
      <ActionIcon 
        variant={isInWatchlist ? "filled" : "outline"} 
        color="red" 
        radius="xl" 
        size="lg"
        style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 1 }}
        onClick={toggleWatchlist}
        loading={watchlistLoading}
      >
        <IconHeart size={16} fill={isInWatchlist ? "currentColor" : "none"} />
      </ActionIcon>
      
      {/* Product image with hover effect */}
      <Box 
        style={{ 
          backgroundColor: '#f1f3f5', 
          border: '2px dashed #dee2e6', 
          borderRadius: '12px', 
          width: '100%', 
          height: '12rem',
          transition: 'transform 0.2s',
          flexShrink: 0
        }} 
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      />
      
      <Stack gap="sm" mt="md" style={{ flexGrow: 1 }}>
        {/* Store badge */}
        <Badge color="blue" variant="light" size="sm">
          {storeName}
        </Badge>
        
        {/* Title with line clamp */}
        <Title order={4} lineClamp={1}>
          <Link href={`/auction/${auction.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            {title}
          </Link>
        </Title>
        
        {/* Description with line clamp */}
        <Text size="sm" c="dimmed" lineClamp={2}>
          {auction.description || "Description de l'enchère"}
        </Text>
        
        <Group justify="space-between">
          <div>
            <Text size="sm" c="dimmed">Prix de départ</Text>
            <Text fw={700}>{startPrice.toFixed(2)} MAD</Text>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Text size="sm" c="dimmed">Dernière enchère</Text>
            <Text fw={700}>{currentPrice.toFixed(2)} MAD</Text>
          </div>
        </Group>
        
        {/* Reserve price (if applicable) */}
        {reservePrice && (
          <Text size="sm" c="dimmed">
            Prix de réserve: <Text span fw={500}>{reservePrice.toFixed(2)} MAD</Text>
          </Text>
        )}
        
        {/* Bid count and watching count */}
        <Group gap="xs">
          <Group gap={4}>
            <IconClock size={14} />
            <Text size="sm">{bidCount} enchères</Text>
          </Group>
          <Group gap={4}>
            <IconEye size={14} />
            <Text size="sm">{watchingCount} regardent</Text>
          </Group>
        </Group>
        
        {/* Countdown timer */}
        <div>
          <Group justify="space-between" mb={6}>
            <Text size="sm">Temps restant</Text>
            <Text size="sm" fw={500}>
              {days > 0 ? `${days}j ${hours}h` : hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`}
            </Text>
          </Group>
          <Progress value={progress} radius="xl" color="blue" />
        </div>
        
        {/* Place bid button */}
        <Button 
          fullWidth 
          component={Link} 
          href={`/auction/${auction.id}`}
          style={{ marginTop: 'auto' }}
        >
          Placer une enchère
        </Button>
      </Stack>
    </Card>
  )
}