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
  ActionIcon,
  Tabs
} from '@mantine/core'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { IconCheck, IconX, IconAlertCircle, IconRefresh, IconUserCheck, IconUserX } from '@tabler/icons-react'
import { SiteHeader } from '@/components/layout/SiteHeader'
import Footer from '@/components/shared/Footer'

interface PendingStore {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  createdAt: string;
  seller: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    }
  }
}

interface PendingVendor {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    createdAt: string;
  };
  stores: {
    id: string;
    name: string;
    status: string;
    sellerId: string;
    createdAt: string;
  }[];
}

export default function AdminStoresPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<string | null>('stores');
  const [stores, setStores] = useState<PendingStore[]>([])
  const [vendors, setVendors] = useState<PendingVendor[]>([])
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

  const fetchPendingVendors = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/vendors/pending')
      const text = await response.text();
      
      if (response.ok) {
        const data = JSON.parse(text)
        setVendors(data.vendors || [])
      } else {
        try {
          const errorData = JSON.parse(text)
          setError(errorData.error || 'Erreur lors du chargement des vendeurs')
        } catch {
          setError('Erreur lors du chargement des vendeurs')
        }
      }
    } catch (err) {
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'stores') {
      fetchPendingStores()
    } else if (activeTab === 'vendors') {
      fetchPendingVendors()
    }
  }, [activeTab])

  const handleApproveStore = async (storeId: string) => {
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
        const data = await response.json()
        setSuccess(data.message || 'Boutique approuvée avec succès')
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

  const handleRejectStore = async (storeId: string) => {
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
        const data = await response.json()
        setSuccess(data.message || 'Boutique rejetée avec succès')
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

  const handleApproveVendor = async (vendorId: string) => {
    try {
      setProcessing(vendorId)
      setSuccess(null)
      setError(null)
      
      const response = await fetch(`/api/admin/vendors/${vendorId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setSuccess(data.message || 'Vendeur approuvé avec succès')
        // Retirer le vendeur de la liste
        setVendors(vendors.filter(vendor => vendor.id !== vendorId))
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Erreur lors de l\'approbation du vendeur')
      }
    } catch (err) {
      setError('Erreur de connexion au serveur')
    } finally {
      setProcessing(null)
    }
  }

  const handleRejectVendor = async (vendorId: string) => {
    try {
      setProcessing(vendorId)
      setSuccess(null)
      setError(null)
      
      const response = await fetch(`/api/admin/vendors/${vendorId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setSuccess(data.message || 'Vendeur rejeté avec succès')
        // Retirer le vendeur de la liste
        setVendors(vendors.filter(vendor => vendor.id !== vendorId))
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Erreur lors du rejet du vendeur')
      }
    } catch (err) {
      setError('Erreur de connexion au serveur')
    } finally {
      setProcessing(null)
    }
  }

  if (loading) {
    return (
      <>
        <SiteHeader />
        <Container size="xl" py="xl">
          <Stack align="center" justify="center" style={{ height: '400px' }}>
            <Loader />
            <Text>Chargement des boutiques en attente...</Text>
          </Stack>
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
          <Title order={1}>Gestion des boutiques et vendeurs</Title>
          <Text c="dimmed">
            Approuvez ou rejetez les boutiques et vendeurs en attente de validation
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

          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Tab value="stores">Boutiques en attente</Tabs.Tab>
              <Tabs.Tab value="vendors">Vendeurs en attente</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="stores" pt="lg">
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
                                  onClick={() => handleApproveStore(store.id)}
                                  loading={processing === store.id}
                                  title="Approuver"
                                >
                                  <IconCheck size={16} />
                                </ActionIcon>
                                <ActionIcon
                                  variant="filled"
                                  color="red"
                                  onClick={() => handleRejectStore(store.id)}
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
            </Tabs.Panel>

            <Tabs.Panel value="vendors" pt="lg">
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Group justify="space-between" mb="md">
                  <Title order={3}>Vendeurs en attente ({vendors.length})</Title>
                  <Button 
                    leftSection={<IconRefresh size={16} />}
                    variant="outline"
                    onClick={fetchPendingVendors}
                  >
                    Actualiser
                  </Button>
                </Group>

                {vendors.length === 0 ? (
                  <Text ta="center" py="xl" c="dimmed">
                    Aucun vendeur en attente d'approbation
                  </Text>
                ) : (
                  <Table.ScrollContainer minWidth={800}>
                    <Table verticalSpacing="sm">
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Vendeur</Table.Th>
                          <Table.Th>Boutique(s)</Table.Th>
                          <Table.Th>Contact</Table.Th>
                          <Table.Th>Date d'inscription</Table.Th>
                          <Table.Th>Actions</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {vendors.map((vendor) => (
                          <Table.Tr key={vendor.id}>
                            <Table.Td>
                              <Stack gap={0}>
                                <Text fw={500}>{vendor.user.name}</Text>
                                <Text size="xs" c="dimmed">{vendor.user.email}</Text>
                              </Stack>
                            </Table.Td>
                            <Table.Td>
                              <Stack gap={4}>
                                {vendor.stores.map(store => (
                                  <Badge key={store.id} color={store.status === 'PENDING' ? 'yellow' : 'blue'}>
                                    {store.name} ({store.status})
                                  </Badge>
                                ))}
                              </Stack>
                            </Table.Td>
                            <Table.Td>
                              <Stack gap={0}>
                                <Text size="sm">{vendor.user.email}</Text>
                                {vendor.user.phone && (
                                  <Text size="xs" c="dimmed">{vendor.user.phone}</Text>
                                )}
                              </Stack>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm">
                                {new Date(vendor.user.createdAt).toLocaleDateString('fr-FR')}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Group gap="xs">
                                <ActionIcon
                                  variant="filled"
                                  color="green"
                                  onClick={() => handleApproveVendor(vendor.id)}
                                  loading={processing === vendor.id}
                                  title="Approuver le vendeur"
                                >
                                  <IconUserCheck size={16} />
                                </ActionIcon>
                                <ActionIcon
                                  variant="filled"
                                  color="red"
                                  onClick={() => handleRejectVendor(vendor.id)}
                                  loading={processing === vendor.id}
                                  title="Rejeter le vendeur"
                                >
                                  <IconUserX size={16} />
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
            </Tabs.Panel>
          </Tabs>
        </Stack>
      </Container>
      <Footer />
    </>
  )
}