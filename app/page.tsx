import { getSession } from '@/lib/auth/session'
import { Button, Card, Title, Text, Container, Group, Stack, SimpleGrid } from '@mantine/core';
import AuctionCard from "@/components/AuctionCard";
import ProductCard from "@/components/ProductCard";
import { listAuctions } from "@/lib/services/auctions";
import ImageCarousel from '@/components/shared/ImageCarousel';

export default async function Home() {
  const session = await getSession()
  const { auctions: liveAuctions } = await listAuctions({ status: 'RUNNING', page: 1, limit: 8 })
  const { auctions: endingSoon } = await listAuctions({ status: 'ENDING_SOON', page: 1, limit: 8 })

  return (
    <div style={{ minHeight: '100vh' }}>
      <section>
        <ImageCarousel
          items={[
            {
              imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1600&auto=format&fit=crop',
              title: 'Découvrez les Meilleures Enchères',
              subtitle: "Trouvez des articles uniques aux meilleurs prix",
              ctaHref: '/auctions',
              ctaLabel: 'ENCHÉRIR',
            },
            {
              imageUrl: 'https://images.unsplash.com/photo-1520975624749-5f59f6dc0460?q=80&w=1600&auto=format&fit=crop',
              title: "C'est le moment de",
              subtitle: 'Déposer une enchère',
              ctaHref: '/auctions',
              ctaLabel: 'Déposer une enchère',
            },
            {
              imageUrl: 'https://images.unsplash.com/photo-1545235617-9465d2a55698?q=80&w=1600&auto=format&fit=crop',
              title: 'Des offres nouvelles chaque jour',
              subtitle: 'Électronique, Mode, Maison et plus',
              ctaHref: '/auctions',
              ctaLabel: 'Parcourir',
            },
          ]}
        />
      </section>

      <Container size="xl" py="xl">
        <Stack gap="xl">
          <section>
            <Group justify="space-between" mb="md">
              <Title order={2} size="xl">Ending Soon</Title>
            </Group>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="lg">
              {endingSoon.map((a: any) => (
                <AuctionCard key={a.id} auction={a} />
              ))}
            </SimpleGrid>
          </section>

          <section>
            <Group justify="space-between" mb="md">
              <Title order={2} size="xl">Enchères en Direct</Title>
            </Group>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="lg">
              {liveAuctions.map((a: any) => (
                <AuctionCard key={a.id} auction={a} />
              ))}
            </SimpleGrid>
          </section>
        </Stack>
      </Container>

      <section style={{ padding: '3rem 0', backgroundColor: '#f9fafb' }}>
        <Container size="xl">
          <Title order={2} size="xl" mb="xl">Catégories populaires</Title>
          <SimpleGrid cols={{ base: 2, sm: 3, md: 5, lg: 5 }} spacing="md">
            {['Femmes','Vins','Chaussures','Livres','Vêtements','Bébé','Maison','Montres','Sport','Art'].map((c) => (
              <Card key={c} padding="md" style={{ textAlign: 'center', cursor: 'pointer' }}>
                <Text size="sm">{c}</Text>
              </Card>
            ))}
          </SimpleGrid>
        </Container>
      </section>

      <Container size="xl" py="xl">
        <Title order={2} size="xl" ta="center" mb="xl">Pourquoi Bidinsouk ?</Title>
        <SimpleGrid cols={{ base: 1, md: 2, lg: 4 }} spacing="lg">
          <Card padding="lg" style={{ height: '100%' }}>
            <Title order={4} mb="sm">Achats sécurisés</Title>
            <Text size="sm">Paiement 100% sécurisé avec protection acheteur</Text>
          </Card>
          <Card padding="lg" style={{ height: '100%' }}>
            <Title order={4} mb="sm">Vendeurs vérifiés</Title>
            <Text size="sm">Nos vendeurs sont authentifiés et notés</Text>
          </Card>
          <Card padding="lg" style={{ height: '100%' }}>
            <Title order={4} mb="sm">Livraison rapide</Title>
            <Text size="sm">Sous 24-48h dans tout le Maroc</Text>
          </Card>
          <Card padding="lg" style={{ height: '100%' }}>
            <Title order={4} mb="sm">Service client</Title>
            <Text size="sm">Support 7/7 en français et arabe</Text>
          </Card>
        </SimpleGrid>
      </Container>

      <section style={{ padding: '3rem 0', backgroundColor: '#f9fafb' }}>
        <Container size="xl">
          <Title order={2} size="xl" ta="center" mb="xl">Avis vérifiés</Title>
          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
            {[1,2,3].map(i => (
              <Card key={i} padding="lg" style={{ height: '100%' }}>
                <Title order={5} mb="xs">Client satisfait #{i}</Title>
                <Text size="sm" c="dimmed" mb="md">03/10/2025</Text>
                <Text size="sm">
                  Excellente plateforme d'enchères. Interface intuitive et processus d'achat sécurisés.
                </Text>
              </Card>
            ))}
          </SimpleGrid>
          <Group justify="center" mt="xl">
            {session?.user ? (
              <Button component="a" href="/auctions" size="lg">
                Parcourir les enchères
              </Button>
            ) : (
              <Group>
                <Button component="a" href="/register" size="lg">
                  Inscrivez-vous maintenant
                </Button>
                <Button component="a" href="/login" size="lg" variant="outline">
                  Se connecter
                </Button>
              </Group>
            )}
          </Group>
        </Container>
      </section>
    </div>
  );
}