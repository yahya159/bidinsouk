'use client'

import AuctionCard from '@/components/AuctionCard'
import { Container, Title, Text, SimpleGrid, Button, Group, Stack, Loader, Alert } from '@mantine/core'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface Auction {
  id: number
  title: string
  description: string
  startPrice: number
  currentPrice: number
  endAt: Date
  image: string
  product?: {
    id: number
    title: string
  }
  store?: {
    name: string
  }
}

export default function AuctionsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/auctions')
        const data = await response.json()
        
        if (response.ok) {
          setAuctions(data.auctions || [])
        } else {
          setError(data.error || 'Erreur lors du chargement des enchères')
        }
      } catch (err) {
        setError('Erreur de connexion au serveur')
      } finally {
        setLoading(false)
      }
    }

    fetchAuctions()
  }, [])

  const handleCreateAuction = () => {
    router.push('/auctions/create')
  }

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Stack align="center" justify="center" style={{ height: '400px' }}>
          <Loader size="xl" />
          <Text>Chargement des enchères...</Text>
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
        <Group justify="space-between">
          <div>
            <Title order={1}>Enchères en cours</Title>
            <Text c="dimmed">Découvrez les meilleures offres et participez aux enchères en temps réel</Text>
          </div>
          {session && (
            <Button onClick={handleCreateAuction}>
              Déposer une enchère
            </Button>
          )}
        </Group>
      </Stack>
      
      {auctions.length === 0 ? (
        <Alert title="Aucune enchère trouvée" color="blue">
          Il n'y a actuellement aucune enchère en cours.
        </Alert>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          {auctions.map((auction: any) => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </SimpleGrid>
      )}
      
      <Group justify="center" mt="xl">
        <Button variant="default">Voir plus d'enchères</Button>
      </Group>
    </Container>
  )
}