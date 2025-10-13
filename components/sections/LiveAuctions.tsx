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

      <SimpleGrid
        cols={{ base: 1, sm: 2, md: 3, lg: 4 }}
        spacing="lg"
      >
        {auctions.map((auction) => (
          <AuctionCard key={auction.id} auction={auction} />
        ))}
      </SimpleGrid>
    </Container>
  );
}