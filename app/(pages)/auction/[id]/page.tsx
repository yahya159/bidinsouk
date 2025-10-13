import { Container, Title, Text, Alert, Button, Stack, Card, Badge, Group, Image } from '@mantine/core';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Clock, Gavel, Heart, Share2 } from 'lucide-react';

interface AuctionDetailPageProps {
  params: Promise<{ id: string }>
}

// Fetch auction data from API
const getAuctionData = async (id: string) => {
  try {
    const response = await fetch(`${process.env.NEXTJS_URL || 'http://localhost:3000'}/api/auctions/${id}`, {
      cache: 'no-store' // Always fetch fresh data for auctions
    });
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching auction:', error);
    return null;
  }
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
};

const formatTimeLeft = (endsAt: string) => {
  const now = new Date();
  const endTime = new Date(endsAt);
  const diff = endTime.getTime() - now.getTime();
  
  if (diff <= 0) return 'Terminé';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}j ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

export default async function AuctionDetailPage({ params }: AuctionDetailPageProps) {
  const { id } = await params;
  const auction = await getAuctionData(id);
  
  if (!auction) {
    notFound();
  }
  
  const reserveMet = auction.reservePrice > 0 ? auction.currentBid >= auction.reservePrice : true;
  
  return (
    <Container size="xl" py="xl">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '32px' }}>
        {/* Main Content */}
        <div>
          {/* Image */}
          <Card shadow="sm" padding={0} radius="md" withBorder mb="lg">
            <div style={{ position: 'relative', height: '400px', backgroundColor: '#f8f9fa' }}>
              <Image
                src={
                  auction.images && Array.isArray(auction.images) && auction.images.length > 0
                    ? auction.images[0].url || auction.images[0]
                    : 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800'
                }
                alt={auction.title}
                height={400}
                fit="cover"
              />
              <Badge 
                color="green" 
                style={{ position: 'absolute', top: '16px', right: '16px' }}
                size="lg"
              >
                En cours
              </Badge>
            </div>
          </Card>
          
          {/* Details */}
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="md">
              <div>
                <Title order={1} mb="sm">{auction.title}</Title>
                <Text c="dimmed" mb="md">{auction.description}</Text>
                
                <Group gap="md">
                  <Badge color="blue">{auction.category}</Badge>
                  <Badge color={auction.condition === 'NEW' ? 'green' : 'orange'}>
                    {auction.condition === 'NEW' ? 'Neuf' : 'Occasion'}
                  </Badge>
                </Group>
              </div>
              
              <div>
                <Text size="sm" c="dimmed" mb="xs">Vendu par</Text>
                <Text fw={500}>{auction.seller?.name || 'Vendeur anonyme'}</Text>
              </div>
            </Stack>
          </Card>
        </div>
        
        {/* Sidebar */}
        <div>
          {/* Bidding Panel */}
          <Card shadow="sm" padding="lg" radius="md" withBorder mb="lg">
            <Stack gap="md">
              <div>
                <Text size="sm" c="dimmed">Enchère actuelle</Text>
                <Text size="xl" fw={700} c="orange">
                  {formatPrice(auction.currentBid)} د.م
                </Text>
              </div>
              
              {auction.reservePrice > 0 && (
                <div>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Statut de réserve:</Text>
                    <Badge color={reserveMet ? "green" : "gray"}>
                      {reserveMet ? "Atteinte" : "Non atteinte"}
                    </Badge>
                  </Group>
                </div>
              )}
              
              <div>
                <Group gap="xs" align="center">
                  <Clock size={16} />
                  <Text size="sm" fw={500}>
                    Se termine dans {formatTimeLeft(auction.endAt)}
                  </Text>
                </Group>
              </div>
              
              <div>
                <Group justify="space-between">
                  <Group gap="xs">
                    <Gavel size={16} />
                    <Text size="sm">{auction.bidsCount || 0} enchère{(auction.bidsCount || 0) > 1 ? 's' : ''}</Text>
                  </Group>
                  <Group gap="xs">
                    <Heart size={16} />
                    <Text size="sm">{auction.watchers || 0} observateur{(auction.watchers || 0) > 1 ? 's' : ''}</Text>
                  </Group>
                </Group>
              </div>
              
              <Button size="lg" fullWidth leftSection={<Gavel size={20} />}>
                Enchérir maintenant
              </Button>
              
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
          
          {/* Quick Info */}
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="sm">
              <Text fw={600} mb="sm">Informations</Text>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Prix de départ:</Text>
                <Text size="sm">{formatPrice(auction.startPrice)} د.م</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Incrément minimum:</Text>
                <Text size="sm">{formatPrice(auction.minIncrement)} د.م</Text>
              </Group>
              {auction.reservePrice > 0 && (
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Prix de réserve:</Text>
                  <Text size="sm">{formatPrice(auction.reservePrice)} د.م</Text>
                </Group>
              )}
            </Stack>
          </Card>
        </div>
      </div>
      
      {/* Enhanced Experience Notice */}
      <Alert title="Expérience améliorée disponible !" color="blue" mt="xl">
        <Text mb="md">
          Découvrez notre nouvelle page produit avec une expérience d'enchère complète incluant 
          le système d'enchères en temps réel, l'historique des enchères, et bien plus encore.
        </Text>
        
        <Button 
          component={Link} 
          href="/fr/produit/casque-enfant-sans-fil-citytek"
          variant="light"
        >
          Voir la page produit complète
        </Button>
      </Alert>
    </Container>
  );
}