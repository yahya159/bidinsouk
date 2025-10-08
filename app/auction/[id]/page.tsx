import { Button, Container, Title, Text, Group, Badge, Box, NumberInput, Card, Table, ActionIcon, Stack, SimpleGrid } from '@mantine/core';
import { IconHeart } from '@tabler/icons-react';

// Placeholder data - in a real app this would come from an API
const auction = {
  id: 1,
  title: "iPhone 15 Pro Max 256GB - Neuf",
  description: "iPhone 15 Pro Max tout neuf, jamais utilisé, avec tous les accessoires d'origine. Garantie 1 an Apple. Boîte d'origine incluse.",
  startPrice: 9500,
  currentPrice: 10200,
  minIncrement: 100,
  startAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Started 1 day ago
  endAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Ends in 2 days
  condition: "NEUF",
  category: "Smartphones",
  brand: "Apple",
  images: ["", "", ""],
  store: {
    id: 1,
    name: "TechStore",
    rating: 4.8,
    reviewCount: 124
  },
  bids: [
    { id: 1, amount: 10200, userId: 5, userName: "Karim B.", timestamp: new Date(Date.now() - 10 * 60 * 1000) },
    { id: 2, amount: 10100, userId: 3, userName: "Youssef M.", timestamp: new Date(Date.now() - 30 * 60 * 1000) },
    { id: 3, amount: 10000, userId: 7, userName: "Fatima Z.", timestamp: new Date(Date.now() - 60 * 60 * 1000) },
  ]
}

export default function AuctionDetailPage() {
  // Format date
  const endDate = new Date(auction.endAt);
  const now = new Date();
  const timeLeft = endDate.getTime() - now.getTime();
  
  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  
  return (
    <Container size="xl" py="xl">
      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl">
        {/* Image Gallery */}
        <div>
          <Box style={{ backgroundColor: '#f1f3f5', border: '2px dashed #dee2e6', borderRadius: '12px', height: '400px' }} mb="md" />
          <SimpleGrid cols={3} spacing="sm">
            <Box style={{ backgroundColor: '#f1f3f5', border: '2px dashed #dee2e6', borderRadius: '12px', height: '100px' }} />
            <Box style={{ backgroundColor: '#f1f3f5', border: '2px dashed #dee2e6', borderRadius: '12px', height: '100px' }} />
            <Box style={{ backgroundColor: '#f1f3f5', border: '2px dashed #dee2e6', borderRadius: '12px', height: '100px' }} />
          </SimpleGrid>
        </div>
        
        {/* Auction Details */}
        <div>
          <Group justify="space-between" mb="md">
            <div>
              <Title order={1} mb="xs">{auction.title}</Title>
              <Group gap="md" mb="md">
                <Badge>{auction.condition}</Badge>
                <Text size="sm" c="dimmed">Par <Text component="span" c="blue" style={{ cursor: 'pointer' }}>{auction.store.name}</Text></Text>
              </Group>
            </div>
            <ActionIcon variant="outline" size="lg">
              <IconHeart size={20} />
            </ActionIcon>
          </Group>
          
          <Text mb="xl">{auction.description}</Text>
          
          <Card padding="lg" mb="xl" style={{ backgroundColor: '#f8f9fa' }}>
            <Group justify="space-between" mb="md">
              <div>
                <Text size="sm" c="dimmed">Prix actuel</Text>
                <Title order={2} c="blue">{auction.currentPrice} MAD</Title>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Text size="sm" c="dimmed">Prochaine enchère</Text>
                <Title order={4}>{auction.currentPrice + auction.minIncrement} MAD</Title>
              </div>
            </Group>
            
            <Box mb="lg">
              <Group justify="space-between" mb="xs">
                <Text size="sm">Temps restant</Text>
                <Text size="sm" fw={500}>
                  {days > 0 ? `${days}j ${hours}h` : `${hours}h ${minutes}m`}
                </Text>
              </Group>
              <div style={{ width: '100%', backgroundColor: '#e9ecef', borderRadius: '10px', height: '12px' }}>
                <div 
                  style={{ 
                    width: `${Math.min(100, Math.max(0, 100 - (timeLeft / (1000 * 60 * 60 * 24 * 10))))}%`,
                    backgroundColor: '#228be6',
                    height: '12px',
                    borderRadius: '10px'
                  }}
                />
              </div>
            </Box>
            
            <SimpleGrid cols={2} spacing="md">
              <NumberInput
                label="Votre enchère (MAD)"
                min={auction.currentPrice + auction.minIncrement}
                defaultValue={auction.currentPrice + auction.minIncrement}
              />
              <Button fullWidth mt={24}>Placer une enchère</Button>
            </SimpleGrid>
          </Card>
          
          <SimpleGrid cols={2} spacing="md">
            <Card padding="md">
              <Text size="sm" c="dimmed">Marque</Text>
              <Text fw={500}>{auction.brand}</Text>
            </Card>
            <Card padding="md">
              <Text size="sm" c="dimmed">Catégorie</Text>
              <Text fw={500}>{auction.category}</Text>
            </Card>
          </SimpleGrid>
        </div>
      </SimpleGrid>
      
      {/* Bid History */}
      <Box mt="xl">
        <Title order={2} mb="xl">Historique des enchères</Title>
        <Card padding={0}>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Utilisateur</Table.Th>
                <Table.Th>Montant</Table.Th>
                <Table.Th>Date</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {auction.bids.map(bid => (
                <Table.Tr key={bid.id}>
                  <Table.Td><Text fw={500}>{bid.userName}</Text></Table.Td>
                  <Table.Td><Text fw={700} c="blue">{bid.amount} MAD</Text></Table.Td>
                  <Table.Td><Text size="sm" c="dimmed">{bid.timestamp.toLocaleString('fr-FR')}</Text></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      </Box>
    </Container>
  )
}