'use client'

import { Container, Title, Text, Stack, Alert, SimpleGrid, TextInput, Select, Drawer, Checkbox, RangeSlider, NumberInput, ActionIcon, Chip, Card, Group, Button, Badge } from '@mantine/core'
import { useEffect, useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Filter, X, Package } from 'lucide-react'
import { useDebouncedValue, useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { ProductCard } from '@/components/cards/ProductCard'
import { ProductCardSkeleton } from '@/components/skeletons/ProductCardSkeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'

interface ProductListItem {
  id: string
  slug: string
  title: string
  imageUrl: string
  category: { name: string; slug: string }
  brand?: string
  price: number
  compareAtPrice?: number
  discountPct?: number
  condition: "NEW" | "USED"
  rating?: number
  reviewsCount?: number
  seller: { name: string; storeSlug: string }
  inStock: boolean
}

interface Filters {
  q: string
  categories: string[]
  brands: string[]
  condition: string[]
  priceMin: number
  priceMax: number
  inStock: boolean
  sort: string
}

export default function ProductsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [opened, { open, close }] = useDisclosure(false)
  
  const [products, setProducts] = useState<ProductListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  
  // Filters state
  const [filters, setFilters] = useState<Filters>({
    q: searchParams.get('q') || '',
    categories: searchParams.getAll('cat') || [],
    brands: searchParams.getAll('brand') || [],
    condition: searchParams.getAll('condition') || [],
    priceMin: Number(searchParams.get('priceMin')) || 0,
    priceMax: Number(searchParams.get('priceMax')) || 50000,
    inStock: searchParams.get('inStock') !== '0',
    sort: searchParams.get('sort') || 'newest'
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

  const conditions = [
    { value: 'NEW', label: 'Neuf', count: 89 },
    { value: 'USED', label: 'Occasion', count: 156 }
  ]

  const fetchProducts = async () => {
    try {
      setLoading(true)
      
      // Build query params
      const params = new URLSearchParams()
      if (filters.q) params.set('search', filters.q)
      filters.categories.forEach(cat => params.append('category', cat))
      filters.brands.forEach(brand => params.append('brand', brand))
      filters.condition.forEach(cond => params.append('condition', cond))
      if (filters.priceMin > 0) params.set('priceMin', filters.priceMin.toString())
      if (filters.priceMax < 50000) params.set('priceMax', filters.priceMax.toString())
      if (!filters.inStock) params.set('inStock', '0')
      params.set('sort', filters.sort)

      const response = await fetch(`/api/products?${params.toString()}`)
      const data = await response.json()
      
      if (response.ok) {
        // Transform the API data to match our interface
        const transformedProducts = (data.products || []).map((product: any) => ({
          id: product.id.toString(),
          slug: `product-${product.id}`,
          title: product.title,
          imageUrl: product.images && Array.isArray(product.images) && product.images.length > 0 
            ? product.images[0].url 
            : 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400',
          category: { name: product.category || 'Divers', slug: 'divers' },
          price: Number(product.price) || 0,
          condition: product.condition || 'USED',
          seller: { name: product.store?.name || 'Vendeur', storeSlug: 'vendeur' },
          inStock: true,
          rating: 4.2 + Math.random() * 0.8,
          reviewsCount: Math.floor(Math.random() * 50) + 5
        }))
        
        setProducts(transformedProducts)
        setTotal(data.total || transformedProducts.length)
      } else {
        setError(data.error || 'Erreur lors du chargement des produits')
      }
    } catch (err) {
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [debouncedSearch, filters.categories, filters.brands, filters.condition, filters.priceMin, filters.priceMax, filters.inStock, filters.sort])

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (filters.q) params.set('q', filters.q)
    filters.categories.forEach(cat => params.append('cat', cat))
    filters.brands.forEach(brand => params.append('brand', brand))
    filters.condition.forEach(cond => params.append('condition', cond))
    if (filters.priceMin > 0) params.set('priceMin', filters.priceMin.toString())
    if (filters.priceMax < 50000) params.set('priceMax', filters.priceMax.toString())
    if (!filters.inStock) params.set('inStock', '0')
    if (filters.sort !== 'newest') params.set('sort', filters.sort)

    const newUrl = params.toString() ? `?${params.toString()}` : ''
    router.replace(`/products${newUrl}`, { scroll: false })
  }, [filters, router])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price)
  }

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'NEW': return 'green'
      case 'USED': return 'blue'
      default: return 'gray'
    }
  }

  const getConditionLabel = (condition: string) => {
    switch (condition) {
      case 'NEW': return 'Neuf'
      case 'USED': return 'Occasion'
      default: return condition
    }
  }

  const clearFilters = () => {
    setFilters({
      q: '',
      categories: [],
      brands: [],
      condition: [],
      priceMin: 0,
      priceMax: 50000,
      inStock: true,
      sort: 'newest'
    })
  }

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.q) count++
    if (filters.categories.length > 0) count++
    if (filters.brands.length > 0) count++
    if (filters.condition.length > 0) count++
    if (filters.priceMin > 0 || filters.priceMax < 50000) count++
    if (!filters.inStock) count++
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
        <Text fw={600} mb="md">État</Text>
        <Stack gap="xs">
          {conditions.map((condition) => (
            <Checkbox
              key={condition.value}
              label={
                <Group justify="space-between" style={{ width: '100%' }}>
                  <Text size="sm">{condition.label}</Text>
                  <Badge size="xs" variant="light">{condition.count}</Badge>
                </Group>
              }
              checked={filters.condition.includes(condition.value)}
              onChange={(event) => {
                const checked = event.currentTarget.checked
                setFilters(prev => ({
                  ...prev,
                  condition: checked 
                    ? [...prev.condition, condition.value]
                    : prev.condition.filter(c => c !== condition.value)
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
        <Text fw={600} mb="md">Disponibilité</Text>
        <Checkbox
          label="En stock uniquement"
          checked={filters.inStock}
          onChange={(event) => setFilters(prev => ({ ...prev, inStock: event.currentTarget.checked }))}
        />
      </div>
    </Stack>
  )

  // Handle add to cart
  const handleAddToCart = async (productId: string) => {
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      })

      if (response.ok) {
        notifications.show({
          title: 'Succès',
          message: 'Produit ajouté au panier',
          color: 'green',
        })
      } else {
        const errorData = await response.json()
        if (response.status === 401 && errorData.redirectTo) {
          // Redirect to login page
          router.push('/login')
        } else {
          throw new Error(errorData.error || 'Erreur lors de l\'ajout au panier')
        }
      }
    } catch (error) {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible d\'ajouter au panier',
        color: 'red',
      })
    }
  }

  const handleAddToWishlist = async (productId: string) => {
    try {
      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, action: 'add' }),
      })

      if (response.ok) {
        notifications.show({
          title: 'Succès',
          message: 'Produit ajouté aux favoris',
          color: 'green',
        })
      } else {
        const errorData = await response.json()
        if (response.status === 401 && errorData.redirectTo) {
          // Redirect to login page
          router.push('/login')
        } else {
          throw new Error(errorData.error || 'Erreur lors de l\'ajout aux favoris')
        }
      }
    } catch (error) {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible d\'ajouter aux favoris',
        color: 'red',
      })
    }
  }

  if (error) {
    return (
      <Container size="7xl" py="xl">
        <Alert title="Erreur" color="red">
          {error}
        </Alert>
        <Button mt="md" onClick={() => fetchProducts()}>
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
              <Title order={1} mb="md">Tous les produits</Title>
              <TextInput
                placeholder="Rechercher des produits..."
                leftSection={<Search size={18} />}
                value={filters.q}
                onChange={(event) => setFilters(prev => ({ ...prev, q: event.currentTarget.value }))}
                size="md"
                style={{ maxWidth: 400 }}
                aria-label="Rechercher des produits"
              />
            </div>
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
                  <Text fw={500}>{total} produit{total > 1 ? 's' : ''} trouvé{total > 1 ? 's' : ''}</Text>
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
                    onChange={(value) => setFilters(prev => ({ ...prev, sort: value || 'newest' }))}
                    data={[
                      { value: 'newest', label: 'Plus récent' },
                      { value: 'price_asc', label: 'Prix croissant' },
                      { value: 'price_desc', label: 'Prix décroissant' },
                      { value: 'popular', label: 'Populaire' },
                      { value: 'rating', label: 'Mieux notés' }
                    ]}
                    style={{ width: 200 }}
                  />
                </Group>
              </Group>
            </Card>

            {/* Products Grid */}
            {loading ? (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="lg">
                {Array.from({ length: 12 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </SimpleGrid>
            ) : products.length === 0 ? (
              <EmptyState
                icon={Package}
                title="Aucun produit trouvé"
                description="Aucun produit ne correspond à vos critères de recherche. Essayez de modifier vos filtres."
                action={
                  activeFiltersCount > 0 ? (
                    <Button onClick={clearFilters}>
                      Réinitialiser les filtres
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="lg">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    title={product.title}
                    imageUrl={product.imageUrl}
                    price={product.price}
                    compareAtPrice={product.compareAtPrice}
                    condition={product.condition}
                    category={product.category.name}
                    rating={product.rating}
                    reviewsCount={product.reviewsCount}
                    inStock={product.inStock}
                    seller={product.seller}
                    onAddToCart={(e) => {
                      e.preventDefault()
                      handleAddToCart(product.id)
                    }}
                    onAddToWishlist={(e) => {
                      e.preventDefault()
                      handleAddToWishlist(product.id)
                    }}
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
