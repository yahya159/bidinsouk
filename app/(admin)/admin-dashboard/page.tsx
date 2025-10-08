import { Card, Button, Container, Title, Text, Stack, Group, SimpleGrid } from '@mantine/core'

export default function AdminDashboard() {
  // Placeholder data - in a real app this would come from an API
  const stats = {
    users: 1240,
    vendors: 42,
    products: 856,
    auctions: 128
  }

  return (
    <Container size="xl" py="xl">
      <Title order={1} mb="xl">Tableau de bord administrateur</Title>
      
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg" mb="xl">
        <Card padding="lg" ta="center">
          <Title order={2}>{stats.users}</Title>
          <Text size="sm" c="dimmed">Utilisateurs</Text>
        </Card>
        
        <Card padding="lg" ta="center">
          <Title order={2}>{stats.vendors}</Title>
          <Text size="sm" c="dimmed">Vendeurs</Text>
        </Card>
        
        <Card padding="lg" ta="center">
          <Title order={2}>{stats.products}</Title>
          <Text size="sm" c="dimmed">Produits</Text>
        </Card>
        
        <Card padding="lg" ta="center">
          <Title order={2}>{stats.auctions}</Title>
          <Text size="sm" c="dimmed">Enchères</Text>
        </Card>
      </SimpleGrid>
      
      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
        <Card padding="lg">
          <Title order={3} mb="xs">Demandes de vendeurs</Title>
          <Text size="sm" c="dimmed" mb="lg">À approuver ou rejeter</Text>
          <Stack gap="md">
            <Group justify="space-between" p="md" style={{ border: '1px solid #dee2e6', borderRadius: '8px' }}>
              <div>
                <Text fw={500}>Karim Boutique</Text>
                <Text size="sm" c="dimmed">karim@example.com</Text>
              </div>
              <Group gap="xs">
                <Button variant="outline" size="sm">Approuver</Button>
                <Button variant="outline" size="sm" color="red">Rejeter</Button>
              </Group>
            </Group>
            
            <Group justify="space-between" p="md" style={{ border: '1px solid #dee2e6', borderRadius: '8px' }}>
              <div>
                <Text fw={500}>Fatima Électronique</Text>
                <Text size="sm" c="dimmed">fatima@example.com</Text>
              </div>
              <Group gap="xs">
                <Button variant="outline" size="sm">Approuver</Button>
                <Button variant="outline" size="sm" color="red">Rejeter</Button>
              </Group>
            </Group>
          </Stack>
        </Card>
        
        <Card padding="lg">
          <Title order={3} mb="xs">Signalements</Title>
          <Text size="sm" c="dimmed" mb="lg">Contenu signalé par les utilisateurs</Text>
          <Stack gap="md">
            <Group justify="space-between" p="md" style={{ border: '1px solid #dee2e6', borderRadius: '8px' }}>
              <div>
                <Text fw={500}>Produit suspect</Text>
                <Text size="sm" c="dimmed">Signalé par: Youssef M.</Text>
                <Text size="sm" c="dimmed">Raison: Contrefaçon</Text>
              </div>
              <Button variant="outline">Voir</Button>
            </Group>
            
            <Group justify="space-between" p="md" style={{ border: '1px solid #dee2e6', borderRadius: '8px' }}>
              <div>
                <Text fw={500}>Avis inapproprié</Text>
                <Text size="sm" c="dimmed">Signalé par: Amina K.</Text>
                <Text size="sm" c="dimmed">Raison: Langage offensant</Text>
              </div>
              <Button variant="outline">Voir</Button>
            </Group>
          </Stack>
        </Card>
      </SimpleGrid>
    </Container>
  )
}