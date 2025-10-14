'use client'

import { 
  Container, 
  Title, 
  Text, 
  Card, 
  Stack, 
  Group, 
  Button, 
  Alert, 
  Loader,
  Center,
  Box
} from '@mantine/core'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { IconAlertCircle, IconRefresh, IconUsers } from '@tabler/icons-react'
import { SiteHeader } from '@/components/layout/SiteHeader'
import Footer from '@/components/shared/Footer'
import { UsersContent } from '@/components/admin/users/UsersContent'

interface User {
  id: string;
  name: string;
  email: string;
  role: 'CLIENT' | 'VENDOR' | 'ADMIN';
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/session')
        if (response.ok) {
          const session = await response.json()
          if (session?.user) {
            setUser(session.user)
          } else {
            router.push('/login')
          }
        } else {
          router.push('/login')
        }
      } catch (err) {
        setError('Erreur de chargement de la session')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [router])

  if (loading) {
    return (
      <>
        <SiteHeader />
        <Container size="xl" py="xl">
          <Stack align="center" justify="center" style={{ height: '400px' }}>
            <Loader />
            <Text>Chargement...</Text>
          </Stack>
        </Container>
        <Footer />
      </>
    )
  }

  if (error) {
    return (
      <>
        <SiteHeader />
        <Container size="xl" py="xl">
          <Alert 
            icon={<IconAlertCircle size={16} />} 
            title="Erreur" 
            color="red"
          >
            {error}
          </Alert>
        </Container>
        <Footer />
      </>
    )
  }

  if (!user) {
    return null
  }

  // Vérifier que l'utilisateur est un administrateur
  if (user.role !== 'ADMIN') {
    return (
      <>
        <SiteHeader />
        <Container size="xl" py="xl">
          <Alert 
            icon={<IconAlertCircle size={16} />} 
            title="Accès refusé" 
            color="red"
          >
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </Alert>
        </Container>
        <Footer />
      </>
    )
  }

  return (
    <>
      <SiteHeader />
      <Container size="xl" py="xl">
        <Stack gap="xl">
          <Group justify="space-between">
            <div>
              <Title order={1}>Gestion des utilisateurs</Title>
              <Text c="dimmed">
                Liste de tous les utilisateurs de la plateforme
              </Text>
            </div>
            <Button 
              leftSection={<IconRefresh size={16} />}
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Actualiser
            </Button>
          </Group>
          
          <UsersContent user={user} />
        </Stack>
      </Container>
      <Footer />
    </>
  )
}