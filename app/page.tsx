import { getSession } from '@/lib/auth/session'
import { Button, Title, Text, Container, Group, SimpleGrid } from '@mantine/core';
import AuctionCard from "@/components/AuctionCard";
import { listAuctions, type AuctionListItem } from "@/lib/services/auctions";
import ModernHero from '@/components/ModernHero';
import Collections from '@/components/Collections';
import ModernFeatures from '@/components/ModernFeatures';
import Testimonials from '@/components/Testimonials';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await getSession()
  
  // Handle role-based redirects on the server side
  if (session?.user) {
    const role = session.user.role;
    if (role === 'ADMIN' || role === 'VENDOR') {
      redirect('/workspace/dashboard');
    }
  }
  
  const [liveAuctionsResult, endingSoonResult] = await Promise.all([
    listAuctions({ status: 'live', page: 1, limit: 8 }),
    listAuctions({ status: 'ending_soon', page: 1, limit: 4 })
  ])
  const liveAuctions = liveAuctionsResult.auctions
  const endingSoon = endingSoonResult.auctions

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* ModernHero Section with gradient background and animated blob elements */}
      <ModernHero />

      {/* FlashDeals Section - "Ending Soon" */}
      <Container size="xl" py="xl">
        <Group justify="space-between" mb="md">
          <div>
            <Title order={2} size="xl">Se termine bientôt</Title>
            <Text c="dimmed">Ne manquez pas ces opportunités</Text>
          </div>
          <Button variant="subtle" component="a" href="/auctions">Voir tout</Button>
        </Group>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
          {endingSoon.map((a: AuctionListItem) => (
            <AuctionCard key={a.id} auction={a} />
          ))}
        </SimpleGrid>
      </Container>

      {/* Collections Section - "Popular categories" */}
      <Collections />

      {/* ModernFeatures Section - "Why Bidinsouk?" */}
      <ModernFeatures />

      {/* Enchères en Direct Section */}
      <Container size="xl" py="xl">
        <Group justify="space-between" mb="md">
          <div>
            <Title order={2} size="xl">Enchères en Direct</Title>
            <Text c="dimmed">Participez aux enchères en cours</Text>
          </div>
          <Button variant="subtle" component="a" href="/auctions">Voir tout</Button>
        </Group>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="lg">
          {liveAuctions.map((a: AuctionListItem) => (
            <AuctionCard key={a.id} auction={a} />
          ))}
        </SimpleGrid>
      </Container>

      {/* Testimonials Section */}
      <Testimonials />

      {/* Call to Action Section */}
      <section style={{ padding: '3rem 0', backgroundColor: '#f9fafb' }}>
        <Container size="xl" style={{ textAlign: 'center' }}>
          <Title order={2} size="xl" mb="sm">Prêt à commencer ?</Title>
          <Text c="dimmed" mb="xl" maw={600} mx="auto">
            Rejoignez des milliers d'acheteurs et vendeurs satisfaits sur Bidinsouk
          </Text>
          <Group justify="center">
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
