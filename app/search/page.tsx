import { Button, Card, Container, Title, Text, Group, Badge, SimpleGrid, Stack, Pagination, Chip } from '@mantine/core'

// Placeholder data - in a real app this would come from an API
const searchResults = {
  auctions: [
    {
      id: 1,
      title: "iPhone 15 Pro Max 256GB - Neuf",
      description: "iPhone 15 Pro Max tout neuf, jamais utilisé",
      startPrice: 9500,
      currentPrice: 10200,
      endAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      image: ""
    },
    {
      id: 2,
      title: "MacBook Pro M2 16 pouces",
      description: "MacBook Pro M2 16 pouces avec 16GB RAM",
      startPrice: 18000,
      currentPrice: 19500,
      endAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      image: ""
    }
  ],
  products: [
    {
      id: 1,
      title: "Casque Audio Sony WH-1000XM5",
      description: "Casque audio sans fil premium avec annulation de bruit",
      price: 2200,
      condition: "NEUF",
      storeName: "TechStore",
      image: ""
    },
    {
      id: 2,
      title: "Montre Apple Watch Series 8",
      description: "Montre connectée avec suivi santé avancé",
      price: 2800,
      condition: "NEUF",
      storeName: "AppleShop",
      image: ""
    }
  ]
}

export default function SearchPage() {
  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={1} mb={4}>Résultats de recherche</Title>
          <Text c="dimmed">25 résultats pour "iPhone"</Text>
        </div>

        <Group>
          <Chip defaultChecked> Tous </Chip>
          <Chip> Enchères </Chip>
          <Chip> Produits </Chip>
        </Group>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
          <div>
            <Title order={2} mb="md">Enchères ({searchResults.auctions.length})</Title>
            <Stack>
              {searchResults.auctions.map(auction => (
                <Card key={auction.id} withBorder>
                  <Group>
                    <div style={{ background: '#f1f3f5', border: '2px dashed #dee2e6', borderRadius: 12, width: 96, height: 96 }} />
                    <div style={{ flex: 1 }}>
                      <Title order={4} mb={4}>{auction.title}</Title>
                      <Text size="sm" c="dimmed" mb="sm" lineClamp={1}>{auction.description}</Text>
                      <Group justify="space-between">
                        <div>
                          <Text size="sm" c="dimmed">Actuellement</Text>
                          <Text fw={700}>{auction.currentPrice} MAD</Text>
                        </div>
                        <Button>Enchérir</Button>
                      </Group>
                    </div>
                  </Group>
                </Card>
              ))}
            </Stack>
          </div>

          <div>
            <Title order={2} mb="md">Produits ({searchResults.products.length})</Title>
            <Stack>
              {searchResults.products.map(product => (
                <Card key={product.id} withBorder>
                  <Group>
                    <div style={{ background: '#f1f3f5', border: '2px dashed #dee2e6', borderRadius: 12, width: 96, height: 96 }} />
                    <div style={{ flex: 1 }}>
                      <Group justify="space-between" align="start">
                        <Title order={4} mb={4}>{product.title}</Title>
                        <Badge color="blue" variant="light">{product.condition}</Badge>
                      </Group>
                      <Text size="sm" c="dimmed" mb="sm" lineClamp={1}>{product.description}</Text>
                      <Group justify="space-between">
                        <div>
                          <Text size="sm" c="dimmed">Prix</Text>
                          <Text fw={700}>{product.price} MAD</Text>
                        </div>
                        <Button>Acheter</Button>
                      </Group>
                    </div>
                  </Group>
                </Card>
              ))}
            </Stack>
          </div>
        </SimpleGrid>

        <Group justify="center">
          <Pagination total={5} defaultValue={1} />
        </Group>
      </Stack>
    </Container>
  )
}