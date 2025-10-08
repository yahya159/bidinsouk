import { Card, Button, Container, Title, Text, Stack, Group, Avatar, Badge, SimpleGrid } from '@mantine/core'

export default function VendorDashboard() {
  // Placeholder data - in a real app this would come from an API
  const stats = {
    products: 24,
    auctions: 8,
    orders: 15,
    revenue: 42500
  }

  return (
    <Container size="xl" py="xl">
      <Title order={1} mb="xl">Tableau de bord vendeur</Title>
      
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg" mb="xl">
        <Card padding="lg" ta="center">
          <Title order={2}>{stats.products}</Title>
          <Text size="sm" c="dimmed">Produits</Text>
        </Card>
        
        <Card padding="lg" ta="center">
          <Title order={2}>{stats.auctions}</Title>
          <Text size="sm" c="dimmed">Enchères</Text>
        </Card>
        
        <Card padding="lg" ta="center">
          <Title order={2}>{stats.orders}</Title>
          <Text size="sm" c="dimmed">Commandes</Text>
        </Card>
        
        <Card padding="lg" ta="center">
          <Title order={2}>{stats.revenue} MAD</Title>
          <Text size="sm" c="dimmed">Revenus ce mois</Text>
        </Card>
      </SimpleGrid>
      
      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg" mb="xl">
        <Card padding="lg">
          <Title order={3} mb="xs">Commandes récentes</Title>
          <Text size="sm" c="dimmed" mb="lg">Dernières commandes à traiter</Text>
          <Stack gap="md">
            <Group justify="space-between" p="md" style={{ border: '1px solid #dee2e6', borderRadius: '8px' }}>
              <div>
                <Text fw={500}>Commande #12345</Text>
                <Text size="sm" c="dimmed">2 articles - 4,500 MAD</Text>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Badge color="yellow" mb="xs">En attente</Badge>
                <Button variant="outline" size="sm" fullWidth>Voir</Button>
              </div>
            </Group>
            
            <Group justify="space-between" p="md" style={{ border: '1px solid #dee2e6', borderRadius: '8px' }}>
              <div>
                <Text fw={500}>Commande #12344</Text>
                <Text size="sm" c="dimmed">1 article - 2,200 MAD</Text>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Badge color="green" mb="xs">Expédiée</Badge>
                <Button variant="outline" size="sm" fullWidth>Voir</Button>
              </div>
            </Group>
          </Stack>
        </Card>
        
        <Card padding="lg">
          <Title order={3} mb="xs">Enchères en cours</Title>
          <Text size="sm" c="dimmed" mb="lg">Vos enchères actives</Text>
          <Stack gap="md">
            <Group p="md" style={{ border: '1px solid #dee2e6', borderRadius: '8px' }}>
              <Avatar size={64} radius="md" />
              <div style={{ flex: 1 }}>
                <Text fw={500}>iPhone 15 Pro Max</Text>
                <Text size="sm" c="dimmed">Prix actuel: 10,200 MAD</Text>
                <Text size="sm" c="dimmed">Temps restant: 1j 4h</Text>
              </div>
              <Button variant="outline">Voir</Button>
            </Group>
            
            <Group p="md" style={{ border: '1px solid #dee2e6', borderRadius: '8px' }}>
              <Avatar size={64} radius="md" />
              <div style={{ flex: 1 }}>
                <Text fw={500}>MacBook Pro M2</Text>
                <Text size="sm" c="dimmed">Prix actuel: 19,500 MAD</Text>
                <Text size="sm" c="dimmed">Temps restant: 3j 12h</Text>
              </div>
              <Button variant="outline">Voir</Button>
            </Group>
          </Stack>
        </Card>
      </SimpleGrid>
      
      <Group justify="center">
        <Button size="md">Ajouter un produit</Button>
        <Button size="md" variant="outline">Créer une enchère</Button>
      </Group>
    </Container>
  )
}