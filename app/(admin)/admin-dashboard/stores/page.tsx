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
  Badge,
  Table,
  ActionIcon
} from '@mantine/core'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { IconCheck, IconX, IconAlertCircle, IconRefresh } from '@tabler/icons-react'

interface PendingStore {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  createdAt: string;
  seller: {
    user: {
      name: string;
      email: string;
    }
  }
}

export default function AdminStoresPage() {
  const router = useRouter()
  const [stores, setStores] = useState<PendingStore[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchPendingStores = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/stores/pending')
      if (response.ok) {
        const data = await response.json()
        setStores(data.stores || [])
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Erreur lors du chargement des boutiques')
      }
    } catch (err) {
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingStores()
  }, [])

  const handleApprove = async (storeId: string) => {
    try {
      setProcessing(storeId)
      setSuccess(null)
      setError(null)
      
      const response = await fetch(`/api/admin/stores/${storeId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (response.ok) {
        setSuccess('Boutique approuvée avec succès')
        // Retirer la boutique de la liste
        setStores(stores.filter(store => store.id !== storeId))
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Erreur lors de l\'approbation')
      }
    } catch (err) {
      setError('Erreur de connexion au serveur')
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (storeId: string) => {
    try {
      setProcessing(storeId)
      setSuccess(null)
      setError(null)
      
      const response = await fetch(`/api/admin/stores/${storeId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (response.ok) {
        setSuccess('Boutique rejetée avec succès')
        // Retirer la boutique de la liste
        setStores(stores.filter(store => store.id !== storeId))
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Erreur lors du rejet')
      }
    } catch (err) {
      setError('Erreur de connexion au serveur')
    } finally {
      setProcessing(null)
    }
  }

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Stack align="center" justify="center" style={{ height: '400px' }}>
          <Loader />
          <Text>Chargement des boutiques en attente...</Text>
        </Stack>
      </Container>
    )
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <Title order={1}>Gestion des boutiques</Title>
        <Text c="dimmed">
          Approuvez ou rejetez les boutiques en attente de validation
        </Text>

        {success && (
          <Alert 
            icon={<IconCheck size={16} />} 
            title="Succès" 
            color="green"
          >
            {success}
          </Alert>
        )}

        {error && (
          <Alert 
            icon={<IconAlertCircle size={16} />} 
            title="Erreur" 
            color="red"
          >
            {error}
          </Alert>
        )}

        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group justify="space-between" mb="md">
            <Title order={3}>Boutiques en attente ({stores.length})</Title>
            <Button 
              leftSection={<IconRefresh size={16} />}
              variant="outline"
              onClick={fetchPendingStores}
            >
              Actualiser
            </Button>
          </Group>

          {stores.length === 0 ? (
            <Text ta="center" py="xl" c="dimmed">
              Aucune boutique en attente d'approbation
            </Text>
          ) : (
            <Table.ScrollContainer minWidth={800}>
              <Table verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Boutique</Table.Th>
                    <Table.Th>Propriétaire</Table.Th>
                    <Table.Th>Contact</Table.Th>
                    <Table.Th>Date de demande</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {stores.map((store) => (
                    <Table.Tr key={store.id}>
                      <Table.Td>
                        <Stack gap={4}>
                          <Text fw={500}>{store.name}</Text>
                          <Badge color="yellow">En attente</Badge>
                        </Stack>
                      </Table.Td>
                      <Table.Td>
                        <Stack gap={0}>
                          <Text size="sm">{store.seller.user.name}</Text>
                          <Text size="xs" c="dimmed">{store.seller.user.email}</Text>
                        </Stack>
                      </Table.Td>
                      <Table.Td>
                        <Stack gap={0}>
                          <Text size="sm">{store.email}</Text>
                          {store.phone && (
                            <Text size="xs" c="dimmed">{store.phone}</Text>
                          )}
                        </Stack>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {new Date(store.createdAt).toLocaleDateString('fr-FR')}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <ActionIcon
                            variant="filled"
                            color="green"
                            onClick={() => handleApprove(store.id)}
                            loading={processing === store.id}
                            title="Approuver"
                          >
                            <IconCheck size={16} />
                          </ActionIcon>
                          <ActionIcon
                            variant="filled"
                            color="red"
                            onClick={() => handleReject(store.id)}
                            loading={processing === store.id}
                            title="Rejeter"
                          >
                            <IconX size={16} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          )}
        </Card>
      </Stack>
    </Container>
  )
}