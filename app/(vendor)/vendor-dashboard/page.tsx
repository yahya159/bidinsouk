'use client'

import { Card, Button, Container, Title, Text, Stack, Group, Avatar, Badge, SimpleGrid, Alert, Loader } from '@mantine/core'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { IconInfoCircle, IconAlertCircle, IconRefresh, IconHome, IconCheck, IconX } from '@tabler/icons-react'

interface Store {
  id: string | number; // Accepter à la fois string et number
  name: string;
  status: string;
  // Ajoutez d'autres propriétés si nécessaire
}

export default function VendorDashboard() {
  const router = useRouter()
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [vendorStatus, setVendorStatus] = useState<string>('pending') // 'pending', 'approved', 'rejected'
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const fetchStores = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('=== Tentative de récupération des magasins ===');
      console.log('URL de la requête:', '/api/stores');
      
      const response = await fetch('/api/stores', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Ajout d'un timeout pour éviter les requêtes infinies
        signal: AbortSignal.timeout(10000) // 10 secondes timeout
      })
      
      console.log('Réponse reçue:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json()
        console.log('Données reçues:', data);
        // S'assurer que les IDs sont du bon type
        const processedStores = (data.stores || []).map((store: any) => ({
          ...store,
          id: typeof store.id === 'string' ? parseInt(store.id) || store.id : store.id
        }));
        setStores(processedStores)
        setVendorStatus('approved')
      } else if (response.status === 403) {
        // L'utilisateur est un vendeur mais en attente d'approbation
        setVendorStatus('pending')
      } else if (response.status === 401) {
        // L'utilisateur n'est pas authentifié
        router.push('/login')
      } else {
        // Autre erreur
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = `Erreur ${response.status}: ${errorData.error || response.statusText}`
        console.error('Erreur détaillée:', errorMessage);
        setError(errorMessage)
      }
    } catch (error: any) {
      console.error('=== ERREUR DE CONNEXION ===');
      console.error('Type d\'erreur:', Object.prototype.toString.call(error));
      
      if (error.name === 'AbortError') {
        console.error('Timeout de la requête');
        setError('La requête a expiré. Veuillez vérifier votre connexion internet.')
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('Erreur de réseau');
        setError('Impossible de se connecter au serveur. Veuillez vérifier votre connexion internet.')
      } else {
        console.error('Erreur inconnue:', error.message);
        setError(`Erreur de connexion: ${error.message || 'Erreur inconnue'}`)
      }
    } finally {
      setLoading(false)
    }
  };

  // Fetch vendor stores
  useEffect(() => {
    fetchStores();
  }, [retryCount]) // Dépendance sur retryCount pour réessayer

  // Placeholder data - in a real app this would come from an API
  const stats = {
    products: stores.length > 0 ? 24 : 0,
    auctions: stores.length > 0 ? 8 : 0,
    orders: stores.length > 0 ? 15 : 0,
    revenue: stores.length > 0 ? 42500 : 0
  }

  if (error) {
    return (
      <Container size="xl" py="xl">
        <Alert 
          icon={<IconAlertCircle size={20} />} 
          title="Problème de chargement" 
          color="red" 
          mb="xl"
        >
          <Text mb="sm">
            Nous n'avons pas pu charger les informations de votre boutique. 
            Cela peut être dû à une connexion internet instable ou à un problème technique temporaire.
          </Text>
          
          <Text size="sm" c="dimmed" mb="md">
            Détails de l'erreur: {error}
          </Text>
          
          <Group mt="md">
            <Button 
              leftSection={<IconRefresh size={16} />}
              onClick={() => setRetryCount(prev => prev + 1)}
              color="red"
            >
              Réessayer
            </Button>
            <Button 
              variant="outline" 
              leftSection={<IconHome size={16} />}
              onClick={() => router.push('/')}
            >
              Retour à l'accueil
            </Button>
          </Group>
          
          <Text size="sm" c="dimmed" mt="md">
            Si le problème persiste, vous pouvez également essayer de vous déconnecter et de vous reconnecter.
          </Text>
        </Alert>
      </Container>
    )
  }

  return (
    <Container size="xl" py="xl">
      <Title order={1} mb="xl">Tableau de bord vendeur</Title>
      
      {/* Store status information */}
      {loading ? (
        <Alert 
          mb="xl" 
          p="md"
          style={{ 
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            backgroundColor: '#f8f9fa'
          }}
        >
          <Group>
            <Loader size="sm" />
            <div>
              <Text fw={500} size="lg">Chargement de vos informations...</Text>
              <Text size="sm" c="dimmed">Veuillez patienter quelques instants</Text>
            </div>
          </Group>
          <Text size="xs" c="dimmed" mt="sm">
            Tentative {retryCount > 0 ? `${retryCount + 1}/3` : '1/3'}
          </Text>
        </Alert>
      ) : vendorStatus === 'pending' ? (
        <Alert 
          icon={<IconInfoCircle size={20} />} 
          title="En attente d'approbation" 
          color="yellow" 
          mb="xl"
        >
          <Text mb="sm">
            Votre compte vendeur est en attente d'approbation par l'administrateur.
          </Text>
          <Text size="sm">
            Vous recevrez une notification par email une fois votre compte approuvé.
          </Text>
        </Alert>
      ) : stores.length === 0 ? (
        <Alert 
          icon={<IconInfoCircle size={20} />} 
          title="Boutique requise" 
          color="blue" 
          mb="xl"
        >
          <Text mb="sm">
            Pour vendre des produits et créer des enchères, vous devez d'abord créer une boutique.
          </Text>
          <Group mt="md">
            <Button 
              size="md" 
              onClick={() => router.push('/stores/create')}
              leftSection={<IconInfoCircle size={16} />}
            >
              Créer votre boutique
            </Button>
          </Group>
        </Alert>
      ) : stores.some(store => store.status === 'PENDING') && !stores.some(store => store.status === 'ACTIVE') ? (
        <Alert 
          icon={<IconInfoCircle size={20} />} 
          title="Boutique en attente d'approbation" 
          color="yellow" 
          mb="xl"
        >
          <Text mb="sm">
            Votre boutique "{stores.find(s => s.status === 'PENDING')?.name}" est actuellement en attente d'approbation par un administrateur.
          </Text>
          <Text size="sm" mb="sm">
            Processus d'approbation :
          </Text>
          <Stack gap="xs" ml="md">
            <Group gap="xs">
              <IconCheck size={16} color="yellow" />
              <Text size="sm">Validation par l'administrateur : Un administrateur examine votre demande</Text>
            </Group>
            <Group gap="xs">
              <IconCheck size={16} color="gray" />
              <Text size="sm" c="dimmed">Activation : Une fois approuvée, votre boutique passera au statut 'ACTIVE'</Text>
            </Group>
            <Group gap="xs">
              <IconCheck size={16} color="gray" />
              <Text size="sm" c="dimmed">Vente possible : Vous pourrez alors créer des produits et des enchères</Text>
            </Group>
          </Stack>
          <Text size="sm" mt="sm">
            Vous recevrez une notification par email lorsque votre boutique sera active.
          </Text>
        </Alert>
      ) : stores.some(store => store.status === 'SUSPENDED') ? (
        <Alert 
          icon={<IconX size={20} />} 
          title="Boutique rejetée" 
          color="red" 
          mb="xl"
        >
          <Text mb="sm">
            Votre boutique "{stores.find(s => s.status === 'SUSPENDED')?.name}" a été rejetée par l'administrateur.
          </Text>
          <Text size="sm" mb="sm">
            Raisons possibles :
          </Text>
          <Stack gap="xs" ml="md">
            <Text size="sm">• Informations incomplètes ou incorrectes</Text>
            <Text size="sm">• Non-conformité aux conditions du service</Text>
            <Text size="sm">• Problèmes de vérification</Text>
          </Stack>
          <Group mt="md">
            <Button 
              variant="outline"
              onClick={() => router.push('/stores/create')}
            >
              Créer une nouvelle boutique
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.push('/contact')}
            >
              Contacter le support
            </Button>
          </Group>
        </Alert>
      ) : null}
      
      {/* Statistiques - seulement si les données sont chargées */}
      {!loading && stores.length > 0 && stores.some(store => store.status === 'ACTIVE') && (
        <>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg" mb="xl">
            <Card padding="lg" ta="center" shadow="sm" radius="md">
              <Title order={2}>{stats.products}</Title>
              <Text size="sm" c="dimmed">Produits</Text>
            </Card>
            
            <Card padding="lg" ta="center" shadow="sm" radius="md">
              <Title order={2}>{stats.auctions}</Title>
              <Text size="sm" c="dimmed">Enchères</Text>
            </Card>
            
            <Card padding="lg" ta="center" shadow="sm" radius="md">
              <Title order={2}>{stats.orders}</Title>
              <Text size="sm" c="dimmed">Commandes</Text>
            </Card>
            
            <Card padding="lg" ta="center" shadow="sm" radius="md">
              <Title order={2}>{stats.revenue} MAD</Title>
              <Text size="sm" c="dimmed">Revenus ce mois</Text>
            </Card>
          </SimpleGrid>
          
          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg" mb="xl">
            <Card padding="lg" shadow="sm" radius="md">
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
            
            <Card padding="lg" shadow="sm" radius="md">
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
          
          <Group justify="center" mt="xl">
            <Button 
              size="md" 
              onClick={() => router.push('/products/create')}
              disabled={!stores.some(store => store.status === 'ACTIVE')}
              leftSection={<IconInfoCircle size={16} />}
            >
              Ajouter un produit
            </Button>
            <Button 
              size="md" 
              variant="outline" 
              onClick={() => router.push('/auctions/create')}
              disabled={!stores.some(store => store.status === 'ACTIVE')}
              leftSection={<IconInfoCircle size={16} />}
            >
              Créer une enchère
            </Button>
          </Group>
        </>
      )}
    </Container>
  )
}