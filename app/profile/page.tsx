import { getSession } from '@/lib/auth/session'
import { Button, Card, Title, Text, Container, Avatar, Badge, Group, Stack, Box, SimpleGrid } from '@mantine/core';

export default async function ProfilePage() {
  const session = await getSession()
  
  // Placeholder data - in a real app this would come from an API
  const user = {
    id: 1,
    name: "Karim Benamar",
    email: "karim.benamar@example.com",
    role: "CLIENT",
    createdAt: new Date("2024-01-15"),
    avatar: "",
    stats: {
      auctionsWon: 12,
      productsBought: 8,
      reviewsWritten: 5
    }
  }

  return (
    <Container size="xl" py="xl">
      <Title order={1} mb="xl">Mon Profil</Title>
      
      <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="xl">
        {/* Profile Info */}
        <div>
          <Card padding="lg">
            <Stack align="center">
              <Avatar size={96} radius="xl" color="blue">
                {user.name.split(' ').map(n => n[0]).join('')}
              </Avatar>
              <Title order={3}>{user.name}</Title>
              <Text size="sm" c="dimmed">{user.email}</Text>
              <Badge color="blue">{user.role}</Badge>
              
              <Box mt="md" w="100%">
                <Text size="sm" c="dimmed">Membre depuis</Text>
                <Text fw={500}>{user.createdAt.toLocaleDateString('fr-FR')}</Text>
                <Button fullWidth mt="md">Modifier le profil</Button>
              </Box>
            </Stack>
          </Card>
        </div>
        
        {/* Profile Content */}
        <div style={{ gridColumn: 'span 2' }}>
          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg" mb="xl">
            <Card padding="lg" ta="center">
              <Title order={2}>{user.stats.auctionsWon}</Title>
              <Text size="sm" c="dimmed">Enchères gagnées</Text>
            </Card>
            
            <Card padding="lg" ta="center">
              <Title order={2}>{user.stats.productsBought}</Title>
              <Text size="sm" c="dimmed">Produits achetés</Text>
            </Card>
            
            <Card padding="lg" ta="center">
              <Title order={2}>{user.stats.reviewsWritten}</Title>
              <Text size="sm" c="dimmed">Avis écrits</Text>
            </Card>
          </SimpleGrid>
          
          <Card padding="lg">
            <Title order={3} mb="md">Mes activités récentes</Title>
            <Stack gap="md">
              <Group p="md" style={{ border: '1px solid #dee2e6', borderRadius: '8px' }}>
                <Avatar size={64} radius="md" />
                <div>
                  <Text fw={500}>Enchère gagnée: iPhone 15 Pro</Text>
                  <Text size="sm" c="dimmed">2 jours ago</Text>
                </div>
              </Group>
              
              <Group p="md" style={{ border: '1px solid #dee2e6', borderRadius: '8px' }}>
                <Avatar size={64} radius="md" />
                <div>
                  <Text fw={500}>Avis publié: Casque Audio Sony</Text>
                  <Text size="sm" c="dimmed">1 semaine ago</Text>
                </div>
              </Group>
              
              <Group p="md" style={{ border: '1px solid #dee2e6', borderRadius: '8px' }}>
                <Avatar size={64} radius="md" />
                <div>
                  <Text fw={500}>Produit acheté: Montre Apple Watch</Text>
                  <Text size="sm" c="dimmed">2 semaines ago</Text>
                </div>
              </Group>
            </Stack>
          </Card>
        </div>
      </SimpleGrid>
    </Container>
  )
}