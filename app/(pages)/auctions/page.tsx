'use client'

import { Container, Title, Text, Stack, Loader, Alert, SimpleGrid, Card, Image, Badge, Group, Button, TextInput, Select, Tabs, Drawer, Checkbox, RangeSlider, NumberInput, ActionIcon, Chip } from '@mantine/core'
import { useEffect, useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Heart, Search, Filter, X, Clock, Gavel, Eye } from 'lucide-react'
import { useDebouncedValue, useDisclosure } from '@mantine/hooks'

interface AuctionCard {
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
  hasBuyNow?: boolean
  reserveMet?: boolean
  seller?: { name: string; storeSlug: string }
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
  
  const [auctions, setAuctions] = useState<AuctionCard[]>([])
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
          imageUrl: auction.image || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400',
          category: { name: 'Électronique', slug: 'electronique' },
          currentBidMAD: auction.currentPrice || auction.currentBid || 0,
          startingBidMAD: auction.startPrice,
          endsAtISO: auction.endAt,
          status: auction.status === 'live' ? 'live' : auction.status === 'ended' ? 'ended' : 'upcoming',
          bidsCount: Math.floor(Math.random() * 20) + 1,
          seller: { name: auction.store?.name || 'Vendeur', storeSlug: 'vendeur' }
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price)
  }

  const formatTimeLeft = (endsAtISO: string) => {
    const now = new Date()
    const endTime = new Date(endsAtISO)
    const diff = endTime.getTime() - now.getTime()
    
    if (diff <= 0) return 'Terminé'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) return `${days}j ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'green'
      case 'upcoming': return 'gray'
      case 'ended': return 'red'
      default: return 'blue'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'live': return 'En cours'
      case 'upcoming': return 'À venir'
      case 'ended': return 'Terminée'
      default: return status
    }
  }

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
        <Text fw={600} mb="md">Marques</Text>
        <Stack gap="xs">
          {brands.map((brand) => (
            <Checkbox
              key={brand.name}
              label={
                <Group justify="space-between" style={{ width: '100%' }}>
                  <Text size="sm">{brand.name}</Text>
                  <Badge size="xs" variant="light">{brand.count}</Badge>
                </Group>
              }
              checked={filters.brands.includes(brand.name)}
              onChange={(event) => {
                const checked = event.currentTarget.checked
                setFilters(prev => ({
                  ...prev,
                  brands: checked 
                    ? [...prev.brands, brand.name]
                    : prev.brands.filter(b => b !== brand.name)
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

      <div>
        <Text fw={600} mb="md">Options</Text>
        <Stack gap="xs">
          <Checkbox
            label="Achat immédiat disponible"
            checked={filters.hasBuyNow}
            onChange={(event) => setFilters(prev => ({ ...prev, hasBuyNow: event.currentTarget.checked }))}
          />
          <Select
            placeholder="Statut de réserve"
            value={filters.reserve}
            onChange={(value) => setFilters(prev => ({ ...prev, reserve: value || '' }))}
            data={[
              { value: '', label: 'Toutes' },
              { value: 'met', label: 'Réserve atteinte' },
              { value: 'not_met', label: 'Réserve non atteinte' }
            ]}
          />
        </Stack>
      </div>
    </Stack>
  )

  if (loading) {
    return (
      <Container size="7xl" py="xl">
        <Stack align="center" justify="center" style={{ height: '400px' }}>
          <Loader size="xl" />
          <Text>Chargement des enchères...</Text>
        </Stack>
      </Container>
    )
  }

  if (error) {
    return (
      <Container size="7xl" py="xl">
        <Alert title="Erreur" color="red">
          {error}
        </Alert>
      </Container>
    )
  }

  return (
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
                      {filters.categories.length > 0 && (
                        <Chip
                          checked={false}
                          onChange={() => setFilters(prev => ({ ...prev, categories: [] }))}
                          size="sm"
                        >
                          {filters.categories.length} catégorie{filters.categories.length > 1 ? 's' : ''} <X size={12} />
                        </Chip>
                      )}
                    </Group>
                  )}
                </div>
                
                <Group>
                  {/* Mobile Filter Button */}
                  <ActionIcon variant="outline" onClick={open} className="lg:hidden">
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
            {auctions.length === 0 ? (
              <Alert title="Aucune enchère trouvée" color="blue">
                Aucune enchère ne correspond à vos critères de recherche.
              </Alert>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="lg">
                {auctions.map((auction) => (
                  <Card key={auction.id} shadow="sm" padding="lg" radius="md" withBorder className="hover:shadow-lg transition-shadow">
                    <Card.Section>
                      <div style={{ position: 'relative', height: '200px', backgroundColor: '#f8f9fa' }}>
                        <Image
                          src={auction.imageUrl}
                          alt={auction.title}
                          height={200}
                          fit="cover"
                        />
                        
                        {/* Status Badge */}
                        <Badge 
                          color={getStatusColor(auction.status)} 
                          style={{ position: 'absolute', top: '8px', right: '8px' }}
                          size="sm"
                        >
                          {getStatusLabel(auction.status)}
                        </Badge>

                        {/* Discount Badge */}
                        {auction.discountPct && (
                          <Badge 
                            color="red" 
                            style={{ position: 'absolute', top: '8px', left: '8px' }}
                            size="sm"
                          >
                            -{auction.discountPct}%
                          </Badge>
                        )}

                        {/* Wishlist Button */}
                        <ActionIcon
                          variant="light"
                          style={{ position: 'absolute', bottom: '8px', right: '8px' }}
                          size="sm"
                        >
                          <Heart size={16} />
                        </ActionIcon>
                      </div>
                    </Card.Section>

                    <Stack gap="sm" mt="md">
                      <Text fw={500} size="sm" lineClamp={2}>
                        {auction.title}
                      </Text>

                      <div>
                        <Text size="xs" c="dimmed">Enchère actuelle</Text>
                        <Group gap="xs" align="baseline">
                          <Text fw={700} size="lg" c="orange">
                            {formatPrice(auction.currentBidMAD)} د.م
                          </Text>
                          {auction.startingBidMAD && auction.startingBidMAD !== auction.currentBidMAD && (
                            <Text size="xs" c="dimmed" td="line-through">
                              {formatPrice(auction.startingBidMAD)} د.م
                            </Text>
                          )}
                        </Group>
                      </div>

                      {/* Countdown */}
                      <Group gap="xs" align="center">
                        <Clock size={14} />
                        <Text size="xs" c="dimmed">
                          {auction.status === 'live' ? formatTimeLeft(auction.endsAtISO) : 
                           auction.status === 'upcoming' ? `Débute le ${new Date(auction.endsAtISO).toLocaleDateString('fr-FR')}` :
                           'Terminé'}
                        </Text>
                      </Group>

                      {/* Bids count and brand */}
                      <Group justify="space-between">
                        <Group gap="xs">
                          <Gavel size={14} />
                          <Text size="xs" c="dimmed">{auction.bidsCount} enchère{auction.bidsCount > 1 ? 's' : ''}</Text>
                        </Group>
                        {auction.brand && (
                          <Text size="xs" c="dimmed">{auction.brand}</Text>
                        )}
                      </Group>

                      {/* CTA Button */}
                      <Button 
                        variant={auction.status === 'live' ? 'filled' : 'outline'}
                        size="sm" 
                        fullWidth
                        component={Link}
                        href={`/auction/${auction.id}`}
                        leftSection={auction.status === 'live' ? <Gavel size={16} /> : <Eye size={16} />}
                      >
                        {auction.status === 'live' ? 'Enchérir' : 'Voir'}
                      </Button>
                    </Stack>
                  </Card>
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
  )
}