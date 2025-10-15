'use client'

import { Container, Title, Text, Stack, Alert, SimpleGrid, TextInput, Select, Tabs, Drawer, Checkbox, RangeSlider, NumberInput, ActionIcon, Chip, Card, Group, Button, Badge } from '@mantine/core'
import { useEffect, useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { Search, Filter, X, Gavel, Package } from 'lucide-react'
import { useDebouncedValue, useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { AuctionCard, type AuctionCardProps } from '@/components/cards/AuctionCard'
import { AuctionCardSkeleton } from '@/components/skeletons/AuctionCardSkeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'

interface AuctionListItem {
  id: string
  slug: string
  title: string
  imageUrl: string
  category: { name: string; slug: string }
  brand?: string
  currentBidMAD: number
  startingBidMAD?: number
  discountPct?: number
  endsAtISO: string
  status: "live" | "upcoming" | "ended"
  bidsCount: number
  watchersCount: number
  hasBuyNow?: boolean
  reserveMet?: boolean
  seller?: { name: string; storeSlug: string }
  condition?: 'NEW' | 'USED'
  reservePriceMAD?: number | null
  buyNowPriceMAD?: number | null
  minIncrementMAD: number
  autoExtend: boolean
  extensionCount: number
}

interface Filters {
  q: string
  categories: string[]
  brands: string[]
  status: string
  priceMin: number
  priceMax: number
  timeLeftMax: number
  hasBuyNow: boolean
  reserve: string
  sort: string
}

export default function AuctionsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [opened, { open, close }] = useDisclosure(false)
  
  const [auctions, setAuctions] = useState<AuctionListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  
  // Filters state
  const [filters, setFilters] = useState<Filters>({
    q: searchParams.get('q') || '',
    categories: searchParams.getAll('cat') || [],
    brands: searchParams.getAll('brand') || [],
    status: searchParams.get('status') || 'live',
    priceMin: Number(searchParams.get('priceMin')) || 0,
    priceMax: Number(searchParams.get('priceMax')) || 50000,
    timeLeftMax: Number(searchParams.get('timeLeftMax')) || 0,
    hasBuyNow: searchParams.get('hasBuyNow') === '1',
    reserve: searchParams.get('reserve') || '',
    sort: searchParams.get('sort') || 'ending_soon'
  })

  const [debouncedSearch] = useDebouncedValue(filters.q, 300)

  // Mock categories and brands for filters
  const categories = [
    { slug: 'electronique', name: 'Électronique', count: 45 },
    { slug: 'maison-jardin', name: 'Maison & Jardin', count: 32 },
    { slug: 'mode-vetements', name: 'Mode & Vêtements', count: 28 },
    { slug: 'sports-loisirs', name: 'Sports & Loisirs', count: 19 },
    { slug: 'livres-medias', name: 'Livres & Médias', count: 15 }
  ]

  const brands = [
    { name: 'Apple', count: 12 },
    { name: 'Samsung', count: 8 },
    { name: 'Nike', count: 6 },
    { name: 'Adidas', count: 5 }
  ]

  const fetchAuctions = async () => {
    try {
      setLoading(true)
      
      // Build query params
      const params = new URLSearchParams()
      if (filters.q) params.set('q', filters.q)
      if (filters.status) params.set('status', filters.status)
      filters.categories.forEach(cat => params.append('cat', cat))
      filters.brands.forEach(brand => params.append('brand', brand))
      if (filters.priceMin > 0) params.set('priceMin', filters.priceMin.toString())
      if (filters.priceMax < 50000) params.set('priceMax', filters.priceMax.toString())
      if (filters.timeLeftMax > 0) params.set('timeLeftMax', filters.timeLeftMax.toString())
      if (filters.hasBuyNow) params.set('hasBuyNow', '1')
      if (filters.reserve) params.set('reserve', filters.reserve)
      params.set('sort', filters.sort)

      const response = await fetch(`/api/auctions?${params.toString()}`)
      const data = await response.json()
      
      if (response.ok) {
        // Transform the API data to match our interface
        const transformedAuctions = (data.auctions || []).map((auction: any) => ({
          id: auction.id.toString(),
          slug: `auction-${auction.id}`,
          title: auction.title,
          imageUrl: auction.image || auction.images?.[0]?.url || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400',
          category: { name: auction.category || 'Électronique', slug: 'electronique' },
          currentBidMAD: Number(auction.currentPrice ?? auction.currentBid ?? auction.startPrice ?? 0),
          startingBidMAD: Number(auction.startPrice ?? 0),
          endsAtISO: auction.endAt,
          status: auction.status === 'ACTIVE' ? 'live' : auction.status === 'ENDED' ? 'ended' : 'upcoming',
          bidsCount: Number(auction.bidsCount ?? Math.floor(Math.random() * 20) + 1),
          watchersCount: Number(auction.watchers ?? Math.floor(Math.random() * 50)),
          reserveMet: typeof auction.reserveMet === 'boolean'
            ? auction.reserveMet
            : (auction.reservePrice != null ? Number(auction.currentBid ?? 0) >= Number(auction.reservePrice) : false),
          condition: auction.condition,
          seller: auction.store?.name ? { name: auction.store.name, storeSlug: auction.store.slug || 'vendeur' } : undefined,
          reservePriceMAD: auction.reservePrice != null ? Number(auction.reservePrice) : null,
          buyNowPriceMAD: auction.buyNowPrice != null ? Number(auction.buyNowPrice) : null,
          minIncrementMAD: Number(auction.minIncrement ?? auction.minBidIncrement ?? 10),
          autoExtend: Boolean(auction.autoExtend),
          extensionCount: Number(auction.extensionCount ?? 0)
        }))
        
        setAuctions(transformedAuctions)
        setTotal(data.total || transformedAuctions.length)
      } else {
        setError(data.error || 'Erreur lors du chargement des enchères')
      }
    } catch (err) {
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAuctions()
  }, [debouncedSearch, filters.status, filters.categories, filters.brands, filters.priceMin, filters.priceMax, filters.timeLeftMax, filters.hasBuyNow, filters.reserve, filters.sort])

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (filters.q) params.set('q', filters.q)
    if (filters.status !== 'live') params.set('status', filters.status)
    filters.categories.forEach(cat => params.append('cat', cat))
    filters.brands.forEach(brand => params.append('brand', brand))
    if (filters.priceMin > 0) params.set('priceMin', filters.priceMin.toString())
    if (filters.priceMax < 50000) params.set('priceMax', filters.priceMax.toString())
    if (filters.timeLeftMax > 0) params.set('timeLeftMax', filters.timeLeftMax.toString())
    if (filters.hasBuyNow) params.set('hasBuyNow', '1')
    if (filters.reserve) params.set('reserve', filters.reserve)
    if (filters.sort !== 'ending_soon') params.set('sort', filters.sort)

    const newUrl = params.toString() ? `?${params.toString()}` : ''
    router.replace(`/auctions${newUrl}`, { scroll: false })
  }, [filters, router])

  const clearFilters = () => {
    setFilters({
      q: '',
      categories: [],
      brands: [],
      status: 'live',
      priceMin: 0,
      priceMax: 50000,
      timeLeftMax: 0,
      hasBuyNow: false,
      reserve: '',
      sort: 'ending_soon'
    })
  }

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.q) count++
    if (filters.categories.length > 0) count++
    if (filters.brands.length > 0) count++
    if (filters.priceMin > 0 || filters.priceMax < 50000) count++
    if (filters.timeLeftMax > 0) count++
    if (filters.hasBuyNow) count++
    if (filters.reserve) count++
    return count
  }, [filters])

  const handleAddToWatchlist = async (auctionId: string) => {
    try {
      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: auctionId, action: 'add' }),
      })

      if (response.ok) {
        notifications.show({
          title: 'Succès',
          message: 'Enchère ajoutée aux favoris',
          color: 'green',
        })
      }
    } catch (error) {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible d\'ajouter aux favoris',
        color: 'red',
      })
    }
  }

  const mapStatusToCard = (status: AuctionListItem['status']): AuctionCardProps['status'] => {
    switch (status) {
      case 'live':
        return 'ACTIVE'
      case 'ended':
        return 'ENDED'
      default:
        return 'SCHEDULED'
    }
  }

  const createQuickBidHandler = (auctionId: string) => (event: ReactMouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    router.push(`/auction/${auctionId}`)
  }

  const createWatchToggleHandler = (auctionId: string) => (event: ReactMouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    handleAddToWatchlist(auctionId)
  }

  const createBuyNowHandler = (auctionId: string) => (event: ReactMouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    router.push(`/auction/${auctionId}`)
  }

  const FiltersPanel = () => (
    <Stack gap="lg">
      <div>
        <Text fw={600} mb="md">Catégories</Text>
        <Stack gap="xs">
          {categories.map((category) => (
            <Checkbox
              key={category.slug}
              label={
                <Group justify="space-between" style={{ width: '100%' }}>
                  <Text size="sm">{category.name}</Text>
                  <Badge size="xs" variant="light">{category.count}</Badge>
                </Group>
              }
              checked={filters.categories.includes(category.slug)}
              onChange={(event) => {
                const checked = event.currentTarget.checked
                setFilters(prev => ({
                  ...prev,
                  categories: checked 
                    ? [...prev.categories, category.slug]
                    : prev.categories.filter(c => c !== category.slug)
                }))
              }}
            />
          ))}
        </Stack>
      </div>

      <div>
        <Text fw={600} mb="md">Prix (MAD)</Text>
        <Stack gap="md">
          <RangeSlider
            value={[filters.priceMin, filters.priceMax]}
            onChange={([min, max]) => setFilters(prev => ({ ...prev, priceMin: min, priceMax: max }))}
            min={0}
            max={50000}
            step={100}
            marks={[
              { value: 0, label: '0' },
              { value: 25000, label: '25K' },
              { value: 50000, label: '50K' }
            ]}
          />
          <Group>
            <NumberInput
              placeholder="Min"
              value={filters.priceMin}
              onChange={(value) => setFilters(prev => ({ ...prev, priceMin: Number(value) || 0 }))}
              min={0}
              max={filters.priceMax}
              style={{ flex: 1 }}
            />
            <NumberInput
              placeholder="Max"
              value={filters.priceMax}
              onChange={(value) => setFilters(prev => ({ ...prev, priceMax: Number(value) || 50000 }))}
              min={filters.priceMin}
              max={50000}
              style={{ flex: 1 }}
            />
          </Group>
        </Stack>
      </div>

      <div>
        <Text fw={600} mb="md">Se termine bientôt</Text>
        <Select
          placeholder="Sélectionner"
          value={filters.timeLeftMax.toString()}
          onChange={(value) => setFilters(prev => ({ ...prev, timeLeftMax: Number(value) || 0 }))}
          data={[
            { value: '0', label: 'Toutes' },
            { value: '30', label: 'Dans 30 minutes' },
            { value: '60', label: 'Dans 1 heure' },
            { value: '120', label: 'Dans 2 heures' },
            { value: '1440', label: 'Dans 24 heures' }
          ]}
        />
      </div>
    </Stack>
  )

  if (error) {
    return (
      <Container size="7xl" py="xl">
        <Alert title="Erreur" color="red">
          {error}
        </Alert>
        <Button mt="md" onClick={() => fetchAuctions()}>
          Réessayer
        </Button>
      </Container>
    )
  }

  return (
    <ErrorBoundary>
      <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <Container size="7xl" py="xl">
          {/* Header */}
          <Stack gap="xl" mb="xl">
            <div>
              <Title order={1} mb="md">Toutes les enchères</Title>
              <TextInput
                placeholder="Rechercher des enchères..."
                leftSection={<Search size={18} />}
                value={filters.q}
                onChange={(event) => setFilters(prev => ({ ...prev, q: event.currentTarget.value }))}
                size="md"
                style={{ maxWidth: 400 }}
                aria-label="Rechercher des enchères"
              />
            </div>

            {/* Status Tabs */}
            <Tabs value={filters.status} onChange={(value) => setFilters(prev => ({ ...prev, status: value || 'live' }))}>
              <Tabs.List>
                <Tabs.Tab value="live">En cours</Tabs.Tab>
                <Tabs.Tab value="upcoming">À venir</Tabs.Tab>
                <Tabs.Tab value="ended">Terminées</Tabs.Tab>
              </Tabs.List>
            </Tabs>
          </Stack>

          <div style={{ display: 'flex', gap: '24px' }}>
            {/* Desktop Filters */}
            <div style={{ display: 'none', width: '320px' }} className="lg:block">
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Group justify="space-between" mb="lg">
                  <Text fw={600}>Filtres</Text>
                  {activeFiltersCount > 0 && (
                    <Button variant="subtle" size="xs" onClick={clearFilters}>
                      Réinitialiser
                    </Button>
                  )}
                </Group>
                <FiltersPanel />
              </Card>
            </div>

            {/* Main Content */}
            <div style={{ flex: 1 }}>
              {/* Results Toolbar */}
              <Card shadow="sm" padding="md" radius="md" withBorder mb="lg">
                <Group justify="space-between">
                  <div>
                    <Text fw={500}>{total} résultat{total > 1 ? 's' : ''} trouvé{total > 1 ? 's' : ''}</Text>
                    {activeFiltersCount > 0 && (
                      <Group gap="xs" mt="xs">
                        <Text size="sm" c="dimmed">Filtres actifs:</Text>
                        {filters.q && (
                          <Chip
                            checked={false}
                            onChange={() => setFilters(prev => ({ ...prev, q: '' }))}
                            size="sm"
                          >
                            "{filters.q}" <X size={12} />
                          </Chip>
                        )}
                      </Group>
                    )}
                  </div>
                  
                  <Group>
                    <ActionIcon variant="outline" onClick={open} className="lg:hidden" aria-label="Ouvrir les filtres">
                      <Filter size={18} />
                      {activeFiltersCount > 0 && (
                        <Badge size="xs" style={{ position: 'absolute', top: -5, right: -5 }}>
                          {activeFiltersCount}
                        </Badge>
                      )}
                    </ActionIcon>
                    
                    <Select
                      placeholder="Trier par"
                      value={filters.sort}
                      onChange={(value) => setFilters(prev => ({ ...prev, sort: value || 'ending_soon' }))}
                      data={[
                        { value: 'ending_soon', label: 'Finissant bientôt' },
                        { value: 'newest', label: 'Plus récent' },
                        { value: 'price_asc', label: 'Prix croissant' },
                        { value: 'price_desc', label: 'Prix décroissant' },
                        { value: 'popular', label: 'Populaire' }
                      ]}
                      style={{ width: 200 }}
                    />
                  </Group>
                </Group>
              </Card>

              {/* Auctions Grid */}
              {loading ? (
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <AuctionCardSkeleton key={i} />
                  ))}
                </SimpleGrid>
              ) : auctions.length === 0 ? (
                <EmptyState
                  icon={Gavel}
                  title="Aucune enchère trouvée"
                  description="Aucune enchère ne correspond à vos critères de recherche. Essayez de modifier vos filtres."
                  action={
                    activeFiltersCount > 0 ? (
                      <Button onClick={clearFilters}>
                        Réinitialiser les filtres
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                  {auctions.map((auction) => (
                    <AuctionCard
                      key={auction.id}
                      id={auction.id}
                      title={auction.title}
                      imageUrl={auction.imageUrl}
                      currentBid={auction.currentBidMAD}
                      startPrice={auction.startingBidMAD || 0}
                      reservePrice={auction.reservePriceMAD ?? null}
                      reserveMet={auction.reserveMet ?? false}
                      buyNowPrice={auction.buyNowPriceMAD ?? null}
                      minIncrement={auction.minIncrementMAD}
                      endAt={auction.endsAtISO}
                      status={mapStatusToCard(auction.status)}
                      autoExtend={auction.autoExtend}
                      extensionCount={auction.extensionCount}
                      category={auction.category.name}
                      bidsCount={auction.bidsCount}
                      watchersCount={auction.watchersCount}
                      seller={auction.seller ? { name: auction.seller.name } : undefined}
                      onQuickBid={createQuickBidHandler(auction.id)}
                      onToggleWatch={createWatchToggleHandler(auction.id)}
                      onBuyNow={auction.buyNowPriceMAD != null ? createBuyNowHandler(auction.id) : undefined}
                    />
                  ))}
                </SimpleGrid>
              )}
            </div>
          </div>

          {/* Mobile Filters Drawer */}
          <Drawer opened={opened} onClose={close} title="Filtres" position="right" size="sm">
            <FiltersPanel />
            <Group mt="xl">
              <Button variant="outline" onClick={clearFilters} flex={1}>
                Réinitialiser
              </Button>
              <Button onClick={close} flex={1}>
                Appliquer
              </Button>
            </Group>
          </Drawer>
        </Container>
      </div>
    </ErrorBoundary>
  )
}
