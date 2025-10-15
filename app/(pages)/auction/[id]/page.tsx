'use client';

import { Container, Title, Text, Alert, Button, Stack, Card, Badge, Group, Image, NumberInput, Divider, Avatar, SimpleGrid, Tabs, Breadcrumbs, Anchor, Loader } from '@mantine/core';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Clock, Gavel, Heart, Share2, Store, TrendingUp, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { Countdown } from '@/components/auction/Countdown';
import { RecentBids } from '@/components/auction/RecentBids';

interface Auction {
  id: string;
  title: string;
  description: string;
  currentBid: number;
  startPrice: number;
  minIncrement: number;
  reservePrice: number;
  endAt: string;
  startAt: string;
  status: string;
  condition: string;
  category: string;
  images: Array<{ url: string }>;
  bidsCount: number;
  watchers: number;
  store: {
    id: string;
    name: string;
    rating: number;
  };
}

interface Bid {
  id: string;
  amount: number;
  bidder: {
    id: string;
    displayName: string;
    avatarUrl?: string;
    isSeller: boolean;
  };
  placedAtISO: string;
  amountMAD: number;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
};

export default function AuctionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [placingBid, setPlacingBid] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const fetchAuction = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/auctions/${params.id}`);
        const data = await response.json();

        if (response.ok) {
          setAuction(data);
          setBidAmount((data.currentBid || data.startPrice) + data.minIncrement);
          
          // Fetch bids
          const bidsResponse = await fetch(`/api/auctions/${params.id}/bids`);
          if (bidsResponse.ok) {
            const bidsData = await bidsResponse.json();
            setBids(bidsData.bids || []);
          }
        } else {
          setError(data.error || 'Enchère non trouvée');
        }
      } catch (err) {
        setError('Erreur de connexion au serveur');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchAuction();
    }
  }, [params.id]);

  const handlePlaceBid = async () => {
    if (!auction) return;

    const minAllowedBid = (auction.currentBid || auction.startPrice) + auction.minIncrement;
    if (bidAmount < minAllowedBid) {
      notifications.show({
        title: 'Enchère invalide',
        message: `Votre enchère doit être d'au moins ${formatPrice(minAllowedBid)} د.م`,
        color: 'red',
      });
      return;
    }

    try {
      setPlacingBid(true);

      const response = await fetch(`/api/auctions/${params.id}/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: bidAmount }),
      });

      if (response.ok) {
        notifications.show({
          title: 'Enchère placée!',
          message: `Votre enchère de ${formatPrice(bidAmount)} د.م a été enregistrée`,
          color: 'green',
        });

        // Refresh auction data
        const auctionResponse = await fetch(`/api/auctions/${params.id}`);
        if (auctionResponse.ok) {
          const data = await auctionResponse.json();
          setAuction(data);
          setBidAmount(data.currentBid + data.minIncrement);
        }

        // Refresh bids
        const bidsResponse = await fetch(`/api/auctions/${params.id}/bids`);
        if (bidsResponse.ok) {
          const bidsData = await bidsResponse.json();
          setBids(bidsData.bids || []);
        }
      } else {
        const data = await response.json();
        notifications.show({
          title: 'Erreur',
          message: data.error || 'Impossible de placer l\'enchère',
          color: 'red',
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Erreur',
        message: 'Erreur de connexion',
        color: 'red',
      });
    } finally {
      setPlacingBid(false);
    }
  };

  const handleQuickBid = (increment: number) => {
    if (!auction) return;
    const newAmount = (auction.currentBid || auction.startPrice) + increment;
    setBidAmount(newAmount);
  };

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Stack align="center" py={50}>
          <Loader size="lg" />
          <Text c="dimmed">Chargement de l'enchère...</Text>
        </Stack>
      </Container>
    );
  }

  if (error || !auction) {
    return (
      <Container size="xl" py="xl">
        <Alert color="red" title="Erreur">
          {error || 'Enchère non trouvée'}
        </Alert>
        <Button mt="md" variant="light" onClick={() => router.back()}>
          Retour
        </Button>
      </Container>
    );
  }
  
  const reserveMet = auction.reservePrice > 0 ? auction.currentBid >= auction.reservePrice : true;
  const hasEnded = new Date(auction.endAt) <= new Date();
  const minAllowedBid = (auction.currentBid || auction.startPrice) + auction.minIncrement;
  
  const breadcrumbs = [
    { title: 'Accueil', href: '/' },
    { title: 'Enchères', href: '/auctions' },
    { title: auction.category, href: `/auctions?cat=${auction.category}` },
    { title: auction.title, href: '#' },
  ];

  return (
    <Container size="xl" py="xl">
      {/* Breadcrumbs */}
      <Breadcrumbs mb="lg">
        {breadcrumbs.map((item, index) => (
          <Anchor
            key={index}
            component={Link}
            href={item.href}
            c={index === breadcrumbs.length - 1 ? 'dimmed' : undefined}
          >
            {item.title}
          </Anchor>
        ))}
      </Breadcrumbs>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '32px' }}>
        {/* Main Content */}
        <div>
          {/* Image Gallery */}
          <Card shadow="sm" padding="xs" radius="md" withBorder mb="lg">
            <Image
              src={
                auction.images && Array.isArray(auction.images) && auction.images.length > 0
                  ? auction.images[selectedImage]?.url || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800'
                  : 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800'
              }
              alt={auction.title}
              height={450}
              fit="contain"
            />
            <Badge 
              color={hasEnded ? 'red' : 'green'} 
              style={{ position: 'absolute', top: '24px', right: '24px' }}
              size="lg"
            >
              {hasEnded ? 'Terminé' : 'En cours'}
            </Badge>
          </Card>

          {/* Thumbnails */}
          {auction.images && Array.isArray(auction.images) && auction.images.length > 1 && (
            <SimpleGrid cols={4} spacing="xs" mb="lg">
              {auction.images.map((image, index) => (
                <Card
                  key={index}
                  padding="xs"
                  withBorder
                  style={{
                    cursor: 'pointer',
                    border: selectedImage === index ? '2px solid var(--mantine-color-blue-6)' : undefined,
                  }}
                  onClick={() => setSelectedImage(index)}
                >
                  <Image src={image.url} height={80} fit="cover" alt={`${auction.title} - Image ${index + 1}`} />
                </Card>
              ))}
            </SimpleGrid>
          )}
          
          {/* Product Details */}
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Tabs defaultValue="details">
              <Tabs.List>
                <Tabs.Tab value="details">Détails</Tabs.Tab>
                <Tabs.Tab value="bids">Enchères ({bids.length})</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="details" pt="md">
                <Stack gap="md">
                  <div>
                    <Title order={2} mb="sm">{auction.title}</Title>
                    <Group gap="md" mb="md">
                      <Badge color="blue">{auction.category}</Badge>
                      <Badge color={auction.condition === 'NEW' ? 'green' : 'orange'}>
                        {auction.condition === 'NEW' ? 'Neuf' : 'Occasion'}
                      </Badge>
                    </Group>
                    <Text c="dimmed">{auction.description}</Text>
                  </div>

                  <Divider />

                  {/* Seller Info */}
                  <Card withBorder padding="md">
                    <Group>
                      <Avatar size="md" color="blue">
                        <Store size={20} />
                      </Avatar>
                      <div style={{ flex: 1 }}>
                        <Text fw={600}>{auction.store?.name || 'Vendeur'}</Text>
                        <Text size="sm" c="dimmed">Vendeur vérifié</Text>
                      </div>
                      <Button size="xs" variant="light" component={Link} href={`/stores/${auction.store?.id}`}>
                        Voir la boutique
                      </Button>
                    </Group>
                  </Card>
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="bids" pt="md">
                {bids.length > 0 ? (
                  <RecentBids bids={bids} />
                ) : (
                  <Text c="dimmed" ta="center" py={40}>
                    Aucune enchère pour le moment. Soyez le premier à enchérir!
                  </Text>
                )}
              </Tabs.Panel>
            </Tabs>
          </Card>
        </div>
        
        {/* Sidebar - Bidding Panel */}
        <div>
          <Card shadow="sm" padding="lg" radius="md" withBorder mb="lg" style={{ position: 'sticky', top: '20px' }}>
            <Stack gap="md">
              {/* Countdown */}
              <div>
                <Text size="sm" c="dimmed" mb="xs">Temps restant</Text>
                <Countdown endsAt={auction.endAt} timezone="Africa/Casablanca" />
              </div>

              <Divider />

              {/* Current Bid */}
              <div>
                <Text size="sm" c="dimmed">Enchère actuelle</Text>
                <Title order={2} c="orange">
                  {formatPrice(auction.currentBid || auction.startPrice)} د.م
                </Title>
              </div>
              
              {/* Reserve Status */}
              {auction.reservePrice > 0 && (
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Prix de réserve:</Text>
                  <Badge color={reserveMet ? 'green' : 'gray'}>
                    {reserveMet ? 'Atteint' : 'Non atteint'}
                  </Badge>
                </Group>
              )}

              {/* Stats */}
              <SimpleGrid cols={2} spacing="xs">
                <div>
                  <Group gap={4}>
                    <Gavel size={16} />
                    <Text size="sm">{auction.bidsCount || 0} enchères</Text>
                  </Group>
                </div>
                <div>
                  <Group gap={4}>
                    <Users size={16} />
                    <Text size="sm">{auction.watchers || 0} observateurs</Text>
                  </Group>
                </div>
              </SimpleGrid>

              {!hasEnded && (
                <>
                  <Divider />

                  {/* Quick Bid Buttons */}
                  <SimpleGrid cols={2} spacing="xs">
                    <Button
                      variant="light"
                      size="sm"
                      onClick={() => handleQuickBid(auction.minIncrement)}
                    >
                      +{formatPrice(auction.minIncrement)} د.م
                    </Button>
                    <Button
                      variant="light"
                      size="sm"
                      onClick={() => handleQuickBid(auction.minIncrement * 2)}
                    >
                      +{formatPrice(auction.minIncrement * 2)} د.م
                    </Button>
                  </SimpleGrid>

                  {/* Custom Bid Input */}
                  <div>
                    <Text size="sm" mb="xs">Votre enchère</Text>
                    <NumberInput
                      value={bidAmount}
                      onChange={(value) => setBidAmount(Number(value))}
                      min={minAllowedBid}
                      step={auction.minIncrement}
                      suffix=" د.م"
                    />
                    <Text size="xs" c="dimmed" mt="xs">
                      Minimum: {formatPrice(minAllowedBid)} د.م
                    </Text>
                  </div>

                  {/* Place Bid Button */}
                  <Button
                    size="lg"
                    fullWidth
                    leftSection={<Gavel size={20} />}
                    loading={placingBid}
                    onClick={handlePlaceBid}
                  >
                    Placer l'enchère
                  </Button>
                </>
              )}

              {hasEnded && (
                <Alert color="red">
                  Cette enchère est terminée
                </Alert>
              )}

              {/* Secondary Actions */}
              <Group>
                <Button variant="outline" flex={1} leftSection={<Heart size={16} />}>
                  Favoris
                </Button>
                <Button variant="outline" flex={1} leftSection={<Share2 size={16} />}>
                  Partager
                </Button>
              </Group>
            </Stack>
          </Card>

          {/* Info Card */}
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Text fw={600} mb="md">Informations</Text>
            <Stack gap="sm">
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Prix de départ:</Text>
                <Text size="sm" fw={500}>{formatPrice(auction.startPrice)} د.م</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Incrément:</Text>
                <Text size="sm" fw={500}>{formatPrice(auction.minIncrement)} د.م</Text>
              </Group>
              {auction.reservePrice > 0 && (
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Prix de réserve:</Text>
                  <Text size="sm" fw={500}>{formatPrice(auction.reservePrice)} د.م</Text>
                </Group>
              )}
            </Stack>
          </Card>
        </div>
      </div>
    </Container>
  );
}