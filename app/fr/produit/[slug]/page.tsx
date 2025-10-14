import { notFound } from 'next/navigation';
import { ProductGallery } from '@/components/auction/ProductGallery';
import { SellerCard } from '@/components/auction/SellerCard';
import { Countdown } from '@/components/auction/Countdown';
import { BidPanel } from '@/components/auction/BidPanel';
import { RecentBids } from '@/components/auction/RecentBids';
import { AskQuestion } from '@/components/auction/AskQuestion';
import { SimilarProducts } from '@/components/auction/SimilarProducts';
import { ShareRow } from '@/components/auction/ShareRow';

import { SiteHeader } from '@/components/layout/SiteHeader';
import Footer from '@/components/shared/Footer';
import { 
  Container, 
  Card, 
  Stack, 
  Group, 
  Text, 
  Title, 
  Badge, 
  Divider,
  Box,
  Anchor,
  Paper,
  Button
} from '@mantine/core';
import { Star, Heart, Share2, Eye } from 'lucide-react';
import type { AuctionProduct, ProductPageData } from '@/types/auction';

// Mock data for development
const mockProduct: AuctionProduct = {
  id: '1',
  slug: 'casque-enfant-sans-fil-citytek',
  title: 'Casque Enfant Sans Fil CityTek - Bluetooth 5.0 avec Contrôle Parental',
  descriptionHtml: `
    <div class="space-y-4">
      <p>Casque audio sans fil spécialement conçu pour les enfants avec limitation de volume pour protéger leur audition.</p>
      <h3 class="font-semibold">Caractéristiques principales :</h3>
      <ul class="list-disc list-inside space-y-1">
        <li>Bluetooth 5.0 pour une connexion stable</li>
        <li>Limitation de volume à 85dB pour la sécurité auditive</li>
        <li>Autonomie de 20 heures</li>
        <li>Design ergonomique et coloré</li>
        <li>Microphone intégré pour les appels</li>
      </ul>
    </div>
  `,
  images: [
    { url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800', alt: 'Casque CityTek vue principale' },
    { url: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800', alt: 'Casque CityTek vue latérale' },
    { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', alt: 'Casque CityTek détails' }
  ],
  category: { id: 'electronics', name: 'Électronique', slug: 'electronique' },
  seller: {
    id: 'seller1',
    name: 'TechStore Maroc',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    rating: 4.8,
    storeSlug: 'techstore-maroc'
  },
  specs: {
    'Marque': 'CityTek',
    'Modèle': 'CT-K200',
    'Connectivité': 'Bluetooth 5.0',
    'Autonomie': '20 heures',
    'Couleur': 'Bleu/Orange'
  },
  condition: 'Neuf',
  startingBidMAD: 150,
  currentBidMAD: 280,
  minIncrementMAD: 10,
  reserveMet: true,
  endsAtISO: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
  timezone: 'UTC +1',
  watchlisted: false
};

const mockBids = [
  {
    id: '1',
    bidder: { id: '1', displayName: 'client***', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' },
    amountMAD: 280,
    placedAtISO: new Date(Date.now() - 5 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    bidder: { id: '2', displayName: 'ahmed***', avatarUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100' },
    amountMAD: 270,
    placedAtISO: new Date(Date.now() - 15 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    bidder: { id: '3', displayName: 'sara***' },
    amountMAD: 260,
    placedAtISO: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  }
];

const mockSimilar: AuctionProduct[] = [
  {
    ...mockProduct,
    id: '2',
    slug: 'casque-gaming-pro',
    title: 'Casque Gaming Pro RGB',
    currentBidMAD: 320,
    images: [{ url: 'https://images.unsplash.com/photo-1599669454699-248893623440?w=400', alt: 'Casque Gaming' }]
  },
  {
    ...mockProduct,
    id: '3',
    slug: 'ecouteurs-sport',
    title: 'Écouteurs Sport Waterproof',
    currentBidMAD: 180,
    images: [{ url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400', alt: 'Écouteurs Sport' }]
  }
];

async function getProductData(slug: string): Promise<ProductPageData | null> {
  // In production, this would fetch from your API
  if (slug !== mockProduct.slug) {
    return null;
  }
  
  return {
    product: mockProduct,
    bids: mockBids,
    similar: mockSimilar
  };
}

export default async function ProductPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getProductData(slug);
  
  if (!data) {
    notFound();
  }

  const { product, bids, similar } = data;

  return (
    <>
      <SiteHeader />
      <Box style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <Container size="xl" py="xl">
          {/* Product Header */}
          <Group align="flex-start" gap="xl" mb="xl" style={{ flexWrap: 'wrap' }}>
            {/* Left: Product Gallery */}
            <Box style={{ flex: '1 1 400px', minWidth: '300px' }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <ProductGallery images={product.images} title={product.title} />
              </Card>
            </Box>
            
            {/* Right: Product Info */}
            <Box style={{ flex: '1 1 400px', minWidth: '300px' }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
                <Stack gap="md">
                  {/* Title */}
                  <Title order={1} size="h2" fw={700}>
                    {product.title}
                  </Title>
                  
                  {/* Category Badge */}
                  <Group gap="xs">
                    <Badge color="blue" variant="light" size="lg">
                      {product.category.name}
                    </Badge>
                    <Badge color="green" variant="light" size="lg">
                      {product.condition}
                    </Badge>
                  </Group>

                  {/* Seller Info */}
                  <Paper p="md" withBorder radius="md" style={{ backgroundColor: '#f8f9fa' }}>
                    <Group justify="space-between" align="center">
                      <div>
                        <Text size="sm" c="dimmed">Vendu par</Text>
                        <Group gap="xs" align="center">
                          <Text fw={600}>{product.seller.name}</Text>
                          <Group gap={2}>
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                style={{
                                  color: i < Math.floor(product.seller.rating || 0) ? '#ffd43b' : '#e9ecef',
                                  fill: i < Math.floor(product.seller.rating || 0) ? '#ffd43b' : 'transparent'
                                }}
                              />
                            ))}
                            <Text size="sm" c="dimmed">({product.seller.rating})</Text>
                          </Group>
                        </Group>
                      </div>
                      <Anchor href={`/magasin/${product.seller.storeSlug}`} size="sm">
                        Voir la boutique
                      </Anchor>
                    </Group>
                  </Paper>

                  {/* Price Info */}
                  <Paper p="md" withBorder radius="md" style={{ backgroundColor: '#fff3cd' }}>
                    <Stack gap="xs">
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">Enchère actuelle</Text>
                        <Text size="xl" fw={700} c="orange">
                          {new Intl.NumberFormat('fr-FR').format(product.currentBidMAD)} MAD
                        </Text>
                      </Group>
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">Prix de départ</Text>
                        <Text size="sm" c="dimmed">
                          {new Intl.NumberFormat('fr-FR').format(product.startingBidMAD)} MAD
                        </Text>
                      </Group>
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">Incrément minimum</Text>
                        <Text size="sm" fw={500}>
                          {new Intl.NumberFormat('fr-FR').format(product.minIncrementMAD)} MAD
                        </Text>
                      </Group>
                    </Stack>
                  </Paper>

                  {/* Specifications */}
                  {product.specs && (
                    <div>
                      <Text fw={600} mb="sm">Caractéristiques principales</Text>
                      <Paper p="md" withBorder radius="md">
                        <Stack gap="xs">
                          {Object.entries(product.specs).map(([key, value]) => (
                            <Group key={key} justify="space-between">
                              <Text size="sm" c="dimmed">{key}</Text>
                              <Text size="sm" fw={500}>{value}</Text>
                            </Group>
                          ))}
                        </Stack>
                      </Paper>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <Group gap="sm">
                    <Group gap="xs">
                      <Eye size={16} />
                      <Text size="sm" c="dimmed">247 vues</Text>
                    </Group>
                    <Group gap="xs">
                      <Heart size={16} />
                      <Text size="sm" c="dimmed">12 favoris</Text>
                    </Group>
                    <Group gap="xs">
                      <Share2 size={16} />
                      <Text size="sm" c="dimmed">Partager</Text>
                    </Group>
                  </Group>
                </Stack>
              </Card>
            </Box>
          </Group>

          {/* Main Auction Section */}
          <Card shadow="sm" padding="xl" radius="md" withBorder mb="xl">
            {/* Auction Header */}
            <Box mb="xl">
              <Group justify="space-between" align="center" mb="md">
                <Title order={2} c="dark" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Box 
                    style={{ 
                      width: '8px', 
                      height: '32px', 
                      backgroundColor: '#ff6b35', 
                      borderRadius: '4px' 
                    }} 
                  />
                  Enchère en cours
                </Title>
                <Group gap="xs">
                  <Badge 
                    color={product.reserveMet ? 'green' : 'orange'} 
                    variant="light" 
                    size="lg"
                  >
                    {product.reserveMet ? 'Prix de réserve atteint' : 'Prix de réserve non atteint'}
                  </Badge>
                  <Badge color="blue" variant="light" size="lg">
                    {bids.length} enchère{bids.length > 1 ? 's' : ''}
                  </Badge>
                </Group>
              </Group>

              {/* Auction Stats */}
              <Paper p="lg" withBorder radius="md" style={{ backgroundColor: '#f8f9fa' }}>
                <Group justify="space-around" align="center">
                  <Box ta="center">
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>
                      Enchère actuelle
                    </Text>
                    <Text size="xl" fw={700} c="#ff6b35">
                      {new Intl.NumberFormat('fr-FR').format(product.currentBidMAD)} MAD
                    </Text>
                  </Box>
                  <Divider orientation="vertical" />
                  <Box ta="center">
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>
                      Prix de départ
                    </Text>
                    <Text size="lg" fw={500} c="dimmed">
                      {new Intl.NumberFormat('fr-FR').format(product.startingBidMAD)} MAD
                    </Text>
                  </Box>
                  <Divider orientation="vertical" />
                  <Box ta="center">
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>
                      Incrément min.
                    </Text>
                    <Text size="lg" fw={500} c="dark">
                      {new Intl.NumberFormat('fr-FR').format(product.minIncrementMAD)} MAD
                    </Text>
                  </Box>
                  <Divider orientation="vertical" />
                  <Box ta="center">
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>
                      Participants
                    </Text>
                    <Text size="lg" fw={500} c="dark">
                      {new Set(bids.map(bid => bid.bidder.id)).size}
                    </Text>
                  </Box>
                </Group>
              </Paper>
            </Box>
            
            <Group align="flex-start" gap="xl" style={{ flexWrap: 'wrap' }}>
              {/* Left: Seller & Countdown */}
              <Box style={{ flex: '1 1 320px', minWidth: '280px' }}>
                <Stack gap="lg">
                  {/* Countdown - More Prominent */}
                  <Paper p="lg" withBorder radius="md" style={{ backgroundColor: '#fff3cd', border: '2px solid #ffc107' }}>
                    <Text fw={700} mb="md" ta="center" c="dark" size="lg">
                      ⏰ Temps restant
                    </Text>
                    <Countdown 
                      endsAt={product.endsAtISO} 
                      timezone={product.timezone}
                    />
                  </Paper>

                  {/* Seller Info */}
                  <div>
                    <Text fw={600} mb="md" size="lg">👤 Vendeur</Text>
                    <SellerCard seller={product.seller} />
                  </div>

                  {/* Auction Details */}
                  <Paper p="md" withBorder radius="md">
                    <Text fw={600} mb="md" size="sm">📋 Détails de l'enchère</Text>
                    <Stack gap="xs">
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">Début de l'enchère</Text>
                        <Text size="sm" fw={500}>
                          {new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')}
                        </Text>
                      </Group>
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">Fin de l'enchère</Text>
                        <Text size="sm" fw={500}>
                          {new Date(product.endsAtISO).toLocaleDateString('fr-FR')} à {new Date(product.endsAtISO).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </Group>
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">Fuseau horaire</Text>
                        <Text size="sm" fw={500}>{product.timezone}</Text>
                      </Group>
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">Condition</Text>
                        <Badge color="green" variant="light" size="sm">
                          {product.condition}
                        </Badge>
                      </Group>
                    </Stack>
                  </Paper>
                </Stack>
              </Box>

              {/* Center: Bid Panel */}
              <Box style={{ flex: '1 1 320px', minWidth: '280px' }}>
                <Paper p="lg" withBorder radius="md" style={{ backgroundColor: 'white', border: '2px solid #e9ecef' }}>
                  <Text fw={700} mb="md" ta="center" size="lg" c="dark">
                    💰 Placer une enchère
                  </Text>
                  <BidPanel 
                    product={product}
                    currentBid={product.currentBidMAD}
                    minIncrement={product.minIncrementMAD}
                    reserveMet={product.reserveMet}
                  />
                </Paper>

                {/* Quick Bid Buttons */}
                <Paper p="md" withBorder radius="md" mt="md" style={{ backgroundColor: '#f8f9fa' }}>
                  <Text fw={600} mb="sm" size="sm" ta="center">⚡ Enchères rapides</Text>
                  <Group gap="xs" justify="center">
                    <Button 
                      variant="outline" 
                      size="xs" 
                      color="orange"
                      style={{ minWidth: '80px' }}
                    >
                      +{product.minIncrementMAD} MAD
                    </Button>
                    <Button 
                      variant="outline" 
                      size="xs" 
                      color="orange"
                      style={{ minWidth: '80px' }}
                    >
                      +{product.minIncrementMAD * 2} MAD
                    </Button>
                    <Button 
                      variant="outline" 
                      size="xs" 
                      color="orange"
                      style={{ minWidth: '80px' }}
                    >
                      +{product.minIncrementMAD * 5} MAD
                    </Button>
                  </Group>
                </Paper>
              </Box>

              {/* Right: Recent Bids & Activity */}
              <Box style={{ flex: '1 1 320px', minWidth: '280px' }}>
                <Stack gap="lg">
                  {/* Recent Bids */}
                  <div>
                    <Group justify="space-between" align="center" mb="md">
                      <Text fw={600} size="lg">📈 Enchères récentes</Text>
                      <Text size="xs" c="dimmed">
                        Mise à jour en temps réel
                      </Text>
                    </Group>
                    <RecentBids bids={bids} />
                  </div>
                  
                  {/* Auction Activity Stats */}
                  <Paper p="md" withBorder radius="md" style={{ backgroundColor: '#e3f2fd' }}>
                    <Text fw={600} mb="sm" size="sm">📊 Activité de l'enchère</Text>
                    <Stack gap="xs">
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">Enchères dans la dernière heure</Text>
                        <Badge color="blue" variant="light" size="sm">3</Badge>
                      </Group>
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">Enchérisseurs uniques</Text>
                        <Badge color="green" variant="light" size="sm">
                          {new Set(bids.map(bid => bid.bidder.id)).size}
                        </Badge>
                      </Group>
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">Augmentation depuis le début</Text>
                        <Badge color="orange" variant="light" size="sm">
                          +{((product.currentBidMAD - product.startingBidMAD) / product.startingBidMAD * 100).toFixed(0)}%
                        </Badge>
                      </Group>
                    </Stack>
                  </Paper>
                  
                  {/* Ask Question */}
                  <div>
                    <Text fw={600} mb="md" size="lg">❓ Poser une question</Text>
                    <AskQuestion productId={product.id} />
                  </div>
                </Stack>
              </Box>
            </Group>

            <Divider my="xl" />
            
            <ShareRow 
              title={product.title}
              url={`/produit/${product.slug}`}
            />
          </Card>

          {/* Product Description */}
          <Card shadow="sm" padding="xl" radius="md" withBorder mb="xl">
            <Title order={2} mb="lg">Description du produit</Title>
            <div 
              style={{ 
                fontSize: '14px', 
                lineHeight: 1.6, 
                color: '#495057' 
              }}
              dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
            />
          </Card>

          {/* Similar Products */}
          <SimilarProducts 
            products={similar}
            categorySlug={product.category.slug}
            categoryName={product.category.name}
          />
        </Container>
      </Box>
      <Footer />
    </>
  );
}