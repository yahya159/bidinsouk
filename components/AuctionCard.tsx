'use client'

import {
  Card,
  Text,
  Title,
  Group,
  Badge,
  Button,
  Progress,
  Stack,
  Box,
  ActionIcon,
  Loader
} from '@mantine/core'
import { IconHeart, IconEye, IconClock } from '@tabler/icons-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { notifications } from '@mantine/notifications'
import type { AuctionListItem } from '@/lib/services/auctions'

interface AuctionCardProps {
  auction: AuctionListItem
}

export default function AuctionCard({ auction }: AuctionCardProps) {
  // Ensure ID is always a valid string
  const auctionId = typeof auction.id === 'string' ? auction.id : String(auction.id)
  
  // Debug: Warn if ID is not a simple string (could indicate data corruption)
  if (typeof auction.id !== 'string' || auction.id.includes('{') || auction.id.includes('[')) {
    console.error('Invalid auction ID detected:', auction.id, 'Full auction:', auction)
  }
  
  const [isInWatchlist, setIsInWatchlist] = useState(false)
  const [watchlistLoading, setWatchlistLoading] = useState(false)
  const [watcherCount, setWatcherCount] = useState(() => auction.watchers ?? 0)

  const endDate = new Date(auction.endAt)
  const startDate = new Date(auction.startAt)
  const now = new Date()

  const timeLeftMs = Math.max(endDate.getTime() - now.getTime(), 0)
  const totalTimeMs = Math.max(endDate.getTime() - startDate.getTime(), 0)
  const elapsedMs = Math.max(now.getTime() - startDate.getTime(), 0)

  const days = Math.floor(timeLeftMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((timeLeftMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60))

  const progress = totalTimeMs === 0 ? 100 : Math.min(100, Math.max(0, (elapsedMs / totalTimeMs) * 100))

  const bidCount = auction.bidCount ?? 0
  const title = auction.product?.title || auction.title || 'Enchere'
  const storeName = auction.store?.name || 'Boutique'

  const startPrice = Number(auction.startPrice) || 0
  const currentPrice = auction.currentBid ? Number(auction.currentBid) : startPrice
  const reservePrice = auction.reservePrice ? Number(auction.reservePrice) : null
  const reserveMet = reservePrice ? currentPrice >= reservePrice : false

  useEffect(() => {
    setIsInWatchlist(false)
  }, [auctionId])

  const toggleWatchlist = async () => {
    setWatchlistLoading(true)
    try {
      if (isInWatchlist) {
        const response = await fetch(`/api/watchlist/${auctionId}`, { method: 'DELETE' })

        if (response.ok) {
          setIsInWatchlist(false)
          setWatcherCount((prev) => Math.max(prev - 1, 0))
          notifications.show({
            color: 'blue',
            title: 'Favoris mis a jour',
            message: 'Enchere retiree de vos favoris.'
          })
        } else {
          const body = await response.json().catch(() => null)
          const message = body?.message ?? "Impossible de retirer l'enchere de vos favoris."
          notifications.show({ color: 'red', title: 'Erreur', message })
        }
      } else {
        const response = await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: auctionId, action: 'add' })
        })

        if (response.ok) {
          setIsInWatchlist(true)
          setWatcherCount((prev) => prev + 1)
          notifications.show({
            color: 'teal',
            title: 'Enchere ajoutee',
            message: 'Vous suivrez maintenant cette enchere.'
          })
        } else {
          const body = await response.json().catch(() => null)
          const message = body?.message ?? "Impossible d'ajouter l'enchere a vos favoris."
          notifications.show({ color: 'red', title: 'Erreur', message })
        }
      }
    } catch (error) {
      notifications.show({
        color: 'red',
        title: 'Erreur reseau',
        message: 'Impossible de mettre a jour la watchlist. Reessayez plus tard.'
      })
    } finally {
      setWatchlistLoading(false)
    }
  }

  const remainingLabel =
    days > 0 ? `${days}j ${hours}h` : hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`

  return (
    <Card
      shadow="sm"
      padding="md"
      radius="md"
      withBorder
      style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      {reservePrice && (
        <Badge
          color={reserveMet ? 'green' : 'red'}
          variant="light"
          style={{ position: 'absolute', top: '10px', right: '40px', zIndex: 1 }}
        >
          {reserveMet ? 'Reserve atteinte' : 'Reserve non atteinte'}
        </Badge>
      )}

      <ActionIcon
        variant={isInWatchlist ? 'filled' : 'outline'}
        color="red"
        radius="xl"
        size="lg"
        style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 1 }}
        onClick={toggleWatchlist}
        disabled={watchlistLoading}
        aria-label={isInWatchlist ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      >
        {watchlistLoading ? (
          <Loader size="xs" color="red" />
        ) : (
          <IconHeart size={16} fill={isInWatchlist ? 'currentColor' : 'none'} />
        )}
      </ActionIcon>

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
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.02)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
        }}
      />

      <Stack gap="sm" mt="md" style={{ flexGrow: 1 }}>
        <Badge color="blue" variant="light" size="sm">
          {storeName}
        </Badge>

        <Title order={4} lineClamp={1}>
          <Link href={`/auction/${auctionId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            {title}
          </Link>
        </Title>

        <Text size="sm" c="dimmed" lineClamp={2}>
          {auction.description || 'Description de l enchere'}
        </Text>

        <Group justify="space-between">
          <div>
            <Text size="sm" c="dimmed">
              Prix de depart
            </Text>
            <Text fw={700}>{startPrice.toFixed(2)} MAD</Text>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Text size="sm" c="dimmed">
              Derniere enchere
            </Text>
            <Text fw={700}>{currentPrice.toFixed(2)} MAD</Text>
          </div>
        </Group>

        {reservePrice && (
          <Text size="sm" c="dimmed">
            Prix de reserve: <Text span fw={500}>{reservePrice.toFixed(2)} MAD</Text>
          </Text>
        )}

        <Group gap="xs">
          <Group gap={4}>
            <IconClock size={14} />
            <Text size="sm">{bidCount} encheres</Text>
          </Group>
            <Group gap={4}>
            <IconEye size={14} />
            <Text size="sm">{watcherCount} regardent</Text>
          </Group>
        </Group>

        <div>
          <Group justify="space-between" mb={6}>
            <Text size="sm">Temps restant</Text>
            <Text size="sm" fw={500}>
              {remainingLabel}
            </Text>
          </Group>
          <Progress value={progress} radius="xl" color="blue" />
        </div>

        <Button fullWidth component={Link} href={`/auction/${auctionId}`} style={{ marginTop: 'auto' }}>
          Placer une enchere
        </Button>
      </Stack>
    </Card>
  )
}
