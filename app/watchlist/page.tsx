'use client'

import { Container, Title, Text, Stack, Loader, Alert, SimpleGrid, Button } from '@mantine/core'
import { useEffect, useState } from 'react'
import AuctionCard from '@/components/AuctionCard'

interface WatchlistItem {
  id: number
  productId: number
  product: {
    id: number
    title: string
    auctions: any[]
    offers: any[]
    store: {
      name: string
      slug: string
    }
  }
}

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/watchlist')
        const data = await response.json()
        
        if (response.ok) {
          setWatchlist(data.watchlist || [])
        } else {
          setError(data.error || 'Erreur lors du chargement de la liste de souhaits')
        }
      } catch (err) {
        setError('Erreur de connexion au serveur')
      } finally {
        setLoading(false)
      }
    }

    fetchWatchlist()
  }, [])

  const removeFromWatchlist = async (productId: number) => {
    try {
      const response = await fetch(`/api/watchlist/${productId}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        setWatchlist(watchlist.filter(item => item.productId !== productId))
      } else {
        const data = await response.json()
        setError(data.error || 'Erreur lors de la suppression')
      }
    } catch (err) {
      setError('Erreur de connexion au serveur')
    }
  }

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Stack align="center" justify="center" style={{ height: '400px' }}>
          <Loader size="xl" />
          <Text>Chargement de votre liste de souhaits...</Text>
        </Stack>
      </Container>
    )
  }

  if (error) {
    return (
      <Container size="xl" py="xl">
        <Alert title="Erreur" color="red">
          {error}
        </Alert>
      </Container>
    )
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="md" mb="md">
        <Title order={1}>Ma liste de souhaits</Title>
        <Text c="dimmed">Tous les articles que vous avez ajoutés à votre liste de souhaits</Text>
      </Stack>

      {watchlist.length === 0 ? (
        <Alert title="Liste de souhaits vide" color="blue">
          Vous n'avez pas encore ajouté d'articles à votre liste de souhaits.
        </Alert>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          {watchlist.map((item) => (
            <div key={item.productId} style={{ position: 'relative' }}>
              <AuctionCard 
                auction={{
                  id: item.productId,
                  title: item.product.title,
                  store: item.product.store,
                  // Use auction data if available, otherwise use placeholder data
                  ...(item.product.auctions[0] || {
                    startPrice: item.product.offers[0]?.price || 0,
                    currentBid: item.product.offers[0]?.price || 0,
                    endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    startAt: new Date()
                  })
                }} 
              />
              <Button
                variant="outline"
                color="red"
                size="xs"
                style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 2 }}
                onClick={() => removeFromWatchlist(item.productId)}
              >
                Supprimer
              </Button>
            </div>
          ))}
        </SimpleGrid>
      )}
    </Container>
  )
}