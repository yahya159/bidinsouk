'use client'

import { 
  Container, 
  Title, 
  Text, 
  Card, 
  Stack, 
  SimpleGrid, 
  Button,
  ThemeIcon
} from '@mantine/core'
import { useRouter } from 'next/navigation'
import { IconUsers, IconBuildingStore, IconReport, IconChartBar, IconBell, IconSettings } from '@tabler/icons-react'

export default function AdminDashboard() {
  const router = useRouter()

  const adminSections = [
    {
      title: 'Gestion des clients',
      description: 'Gérer tous les clients de la plateforme',
      icon: IconUsers,
      path: '/admin-dashboard/clients',
      color: 'blue'
    },
    {
      title: 'Gestion des vendeurs',
      description: 'Approuver ou rejeter les demandes de nouveaux vendeurs',
      icon: IconUsers,
      path: '/admin-dashboard/vendors',
      color: 'blue'
    },
    {
      title: 'Gestion des boutiques',
      description: 'Approuver ou rejeter les boutiques en attente',
      icon: IconBuildingStore,
      path: '/admin-dashboard/stores',
      color: 'green'
    },
    {
      title: 'Signalements',
      description: 'Gérer les signalements d\'utilisateurs ou de contenu',
      icon: IconReport,
      path: '/admin-dashboard/reports',
      color: 'red'
    },
    {
      title: 'Statistiques',
      description: 'Consulter les statistiques de la plateforme',
      icon: IconChartBar,
      path: '/admin-dashboard/analytics',
      color: 'violet'
    },
    {
      title: 'Notifications',
      description: 'Envoyer des notifications aux utilisateurs',
      icon: IconBell,
      path: '/admin-dashboard/notifications',
      color: 'orange'
    },
    {
      title: 'Paramètres',
      description: 'Configurer les paramètres de la plateforme',
      icon: IconSettings,
      path: '/admin-dashboard/settings',
      color: 'gray'
    }
  ]

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <Title order={1}>Tableau de bord administrateur</Title>
        <Text c="dimmed">
          Gérez votre plateforme de vente aux enchères
        </Text>

        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {adminSections.map((section, index) => (
            <Card 
              key={index}
              padding="lg" 
              radius="md" 
              withBorder
              style={{ cursor: 'pointer' }}
              onClick={() => router.push(section.path)}
            >
              <Stack align="center" gap="md">
                <ThemeIcon size={48} radius="md" color={section.color}>
                  <section.icon size={24} />
                </ThemeIcon>
                <Title order={3} ta="center">{section.title}</Title>
                <Text ta="center" c="dimmed" size="sm">
                  {section.description}
                </Text>
                <Button 
                  variant="light" 
                  color={section.color}
                  fullWidth
                  mt="sm"
                >
                  Accéder
                </Button>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      </Stack>
    </Container>
  )
}