import { Container, Title, Text, Group, Button, SimpleGrid } from '@mantine/core';
import { AuctionCard } from '@/components/cards/AuctionCard';
import { getLiveAuctions } from '@/lib/homeData';
import Link from 'next/link';

export async function LiveAuctions() {
  const auctions = await getLiveAuctions();

  return (
    <Container size="xl" py={48}>
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} size="2rem" fw={600} mb="xs">
            Enchères en Direct
          </Title>
          <Text c="dimmed" size="lg">
            Participez aux enchères en cours
          </Text>
        </div>
        <Button
          variant="subtle"
          component={Link}
          href="/auctions?status=live"
          size="md"
        >
          Voir tout
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="lg">
        {auctions.map((auction) => (
          <AuctionCard
            key={auction.id}
            id={auction.id}
            title={auction.title}
            imageUrl={auction.image}
            currentBid={auction.currentPrice}
            startPrice={auction.currentPrice}
            reserveMet={true}
            minIncrement={Math.max(1, Math.round(auction.currentPrice * 0.05))}
            endAt={new Date(Date.now() + 90 * 60 * 1000).toISOString()}
            status="RUNNING"
            autoExtend={true}
            bidsCount={auction.bidCount}
            watchersCount={0}
            seller={{ name: auction.seller.name }}
          />
        ))}
      </SimpleGrid>
    </Container>
  );
}
