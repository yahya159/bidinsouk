import { Card, Button, Container, Title, Text, Stack, Group, Avatar, SimpleGrid } from '@mantine/core'

export default function ClientDashboard() {
  // Placeholder data - in a real app this would come from an API
  const stats = {
    activeBids: 3,
    watchlistItems: 12,
    orders: 5,
    savedSearches: 4
  }

  return (
    <Container size="xl" py="xl">
      <Title order={1} mb="xl">Tableau de bord client</Title>
      
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg" mb="xl">
        <Card padding="lg" ta="center">
          <Title order={2}>{stats.activeBids}</Title>
          <Text size="sm" c="dimmed">Enchères actives</Text>
        </Card>
        
        <Card padding="lg" ta="center">
          <Title order={2}>{stats.watchlistItems}</Title>
          <Text size="sm" c="dimmed">Articles surveillés</Text>
        </Card>
        
        <Card padding="lg" ta="center">
          <Title order={2}>{stats.orders}</Title>
          <Text size="sm" c="dimmed">Commandes</Text>
        </Card>
        
        <Card padding="lg" ta="center">
          <Title order={2}>{stats.savedSearches}</Title>
          <Text size="sm" c="dimmed">Recherches sauvegardées</Text>
        </Card>
      </SimpleGrid>
      
      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
        <Card padding="lg">
          <Title order={3} mb="xs">Enchères actives</Title>
          <Text size="sm" c="dimmed" mb="lg">Vos enchères en cours</Text>
          <Stack gap="md">
            <Group p="md" style={{ border: '1px solid #dee2e6', borderRadius: '8px' }}>
              <Avatar size={64} radius="md" />
              <div style={{ flex: 1 }}>
                <Text fw={500}>iPhone 15 Pro Max</Text>
                <Text size="sm" c="dimmed">Votre enchère: 10,200 MAD</Text>
                <Text size="sm" c="dimmed">Temps restant: 1j 4h</Text>
              </div>
              <Button variant="outline">Voir</Button>
            </Group>
            
            <Group p="md" style={{ border: '1px solid #dee2e6', borderRadius: '8px' }}>
              <Avatar size={64} radius="md" />
              <div style={{ flex: 1 }}>
                <Text fw={500}>MacBook Pro M2</Text>
                <Text size="sm" c="dimmed">Votre enchère: 19,500 MAD</Text>
                <Text size="sm" c="dimmed">Temps restant: 3j 12h</Text>
              </div>
              <Button variant="outline">Voir</Button>
            </Group>
          </Stack>
        </Card>
        
        <Card padding="lg">
          <Title order={3} mb="xs">Articles surveillés</Title>
          <Text size="sm" c="dimmed" mb="lg">Vos articles favoris</Text>
          <Stack gap="md">
            <Group p="md" style={{ border: '1px solid #dee2e6', borderRadius: '8px' }}>
              <Avatar size={64} radius="md" />
              <div style={{ flex: 1 }}>
                <Text fw={500}>Casque Audio Sony</Text>
                <Text size="sm" c="dimmed">Prix: 2,200 MAD</Text>
                <Text size="sm" c="green">En stock</Text>
              </div>
              <Button variant="outline">Voir</Button>
            </Group>
            
            <Group p="md" style={{ border: '1px solid #dee2e6', borderRadius: '8px' }}>
              <Avatar size={64} radius="md" />
              <div style={{ flex: 1 }}>
                <Text fw={500}>Montre Apple Watch</Text>
                <Text size="sm" c="dimmed">Prix: 2,800 MAD</Text>
                <Text size="sm" c="green">En stock</Text>
              </div>
              <Button variant="outline">Voir</Button>
            </Group>
          </Stack>
        </Card>
      </SimpleGrid>
    </Container>
  )
}
