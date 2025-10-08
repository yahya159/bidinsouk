import AuctionCard from '@/components/AuctionCard'
import { Container, Title, Text, SimpleGrid, Button, Group, Stack } from '@mantine/core'

// Placeholder data - in a real app this would come from an API
const auctions = [
  {
    id: 1,
    title: "iPhone 15 Pro Max 256GB - Neuf",
    description: "iPhone 15 Pro Max tout neuf, jamais utilisé, avec tous les accessoires d'origine.",
    startPrice: 9500,
    currentPrice: 10200,
    endAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    image: ""
  },
  {
    id: 2,
    title: "MacBook Pro M2 16 pouces",
    description: "MacBook Pro M2 16 pouces avec 16GB RAM et 512GB SSD, acheté en janvier 2024.",
    startPrice: 18000,
    currentPrice: 19500,
    endAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    image: ""
  },
  {
    id: 3,
    title: "Téléviseur Samsung 65 pouces QLED",
    description: "Téléviseur Samsung 65 pouces QLED 4K Smart TV, acheté en décembre 2023.",
    startPrice: 6500,
    currentPrice: 7200,
    endAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
    image: ""
  },
  {
    id: 4,
    title: "Vélo électrique Xiaomi Pro 2",
    description: "Vélo électrique Xiaomi Pro 2 avec batterie amovible de 48V, peu utilisé.",
    startPrice: 3200,
    currentPrice: 3800,
    endAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    image: ""
  },
  {
    id: 5,
    title: "Appareil photo Canon EOS R5",
    description: "Canon EOS R5 avec objectif 24-105mm, peu utilisé, tous accessoires inclus.",
    startPrice: 12000,
    currentPrice: 13500,
    endAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
    image: ""
  },
  {
    id: 6,
    title: "Console PlayStation 5",
    description: "PlayStation 5 avec lecteur disque, état neuf, avec manette supplémentaire.",
    startPrice: 4500,
    currentPrice: 5100,
    endAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
    image: ""
  }
]

export default function AuctionsPage() {
  return (
    <Container size="xl" py="xl">
      <Stack gap="md" mb="md">
        <Title order={1}>Enchères en cours</Title>
        <Text c="dimmed">Découvrez les meilleures offres et participez aux enchères en temps réel</Text>
      </Stack>
      
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
        {auctions.map(auction => (
          <AuctionCard key={auction.id} auction={auction} />
        ))}
      </SimpleGrid>
      
      <Group justify="center" mt="xl">
        <Button variant="default">Voir plus d'enchères</Button>
      </Group>
    </Container>
  )
}