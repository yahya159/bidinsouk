'use client';

import { useState, useEffect } from 'react';
import {
  Title,
  Text,
  Button,
  Group,
  Stack,
  Card,
  Table,
  Badge,
  Image,
  ActionIcon,
  Menu,
  TextInput,
  Select,
  Pagination,
  Modal,
  Alert,
  Center,
  Loader,
  NumberInput,
  Grid,
  Switch,
  Tooltip,
  Progress,
  Timeline,
  Drawer,
  Textarea,
  Box,
  FileInput,
  Tabs,
  Divider,
  MultiSelect,
} from '@mantine/core';
import {
  Plus,
  Search,
  MoreHorizontal,
  Play,
  Pause,
  Clock,
  Eye,
  Edit,
  Trash2,
  Users,
  AlertCircle,
  Zap,
  TrendingUp,
  Calendar,
  Timer,
  CheckCircle,
  XCircle,
  RotateCcw,
  Save,
  Upload,
  Package,
  Tag,
  DollarSign,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { AuctionBidPanel } from './AuctionBidPanel';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'CLIENT' | 'VENDOR' | 'ADMIN';
}

interface Auction {
  id: string;
  title: string;
  description: string;
  image: string;
  productId?: string;
  status: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'ENDING_SOON' | 'ENDED' | 'CANCELLED';
  startingPrice: number;
  reservePrice?: number;
  currentBid: number;
  increment: number;
  bidCount: number;
  startTime: string;
  endTime: string;
  duration: number; // in hours
  views: number;
  watchers: number;
  autoBidEnabled: boolean;
  antiSnipingEnabled: boolean;
  winnerId?: string;
  winnerName?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuctionsContentProps {
  user: User;
}

// Mock data
const mockAuctions: Auction[] = [
  {
    id: '1',
    title: 'iPhone 14 Pro Max 256GB',
    description: 'iPhone 14 Pro Max en excellent état, 256GB de stockage, couleur noir sidéral.',
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=100&h=100&fit=crop&auto=format',
    productId: 'product-1',
    status: 'ACTIVE',
    startingPrice: 5000,
    reservePrice: 7000,
    currentBid: 8500,
    increment: 100,
    bidCount: 23,
    startTime: '2024-01-15T10:00:00Z',
    endTime: '2024-01-16T18:00:00Z',
    duration: 32,
    views: 156,
    watchers: 12,
    autoBidEnabled: true,
    antiSnipingEnabled: true,
    winnerId: undefined,
    createdAt: '2024-01-14T09:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z',
  },
  {
    id: '2',
    title: 'MacBook Air M2 13"',
    description: 'MacBook Air M2 13 pouces, 8GB RAM, 256GB SSD, état neuf avec garantie.',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=100&h=100&fit=crop&auto=format',
    productId: 'product-2',
    status: 'SCHEDULED',
    startingPrice: 8000,
    reservePrice: 9500,
    currentBid: 8000,
    increment: 200,
    bidCount: 0,
    startTime: '2024-01-17T14:00:00Z',
    endTime: '2024-01-18T20:00:00Z',
    duration: 30,
    views: 89,
    watchers: 8,
    autoBidEnabled: false,
    antiSnipingEnabled: true,
    winnerId: undefined,
    createdAt: '2024-01-16T10:00:00Z',
    updatedAt: '2024-01-16T10:00:00Z',
  },
  {
    id: '3',
    title: 'Montre Rolex Submariner',
    description: 'Rolex Submariner authentique, modèle 116610LN, avec boîte et papiers.',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&h=100&fit=crop&auto=format',
    productId: 'product-3',
    status: 'ENDED',
    startingPrice: 30000,
    reservePrice: 40000,
    currentBid: 45000,
    increment: 500,
    bidCount: 67,
    startTime: '2024-01-10T09:00:00Z',
    endTime: '2024-01-12T21:00:00Z',
    duration: 60,
    views: 342,
    watchers: 28,
    autoBidEnabled: true,
    antiSnipingEnabled: true,
    winnerId: 'user-123',
    winnerName: 'Utilisateur 123',
    createdAt: '2024-01-09T08:00:00Z',
    updatedAt: '2024-01-12T21:00:00Z',
  },
];

const statuses = ['Tous', 'DRAFT', 'SCHEDULED', 'ACTIVE', 'ENDING_SOON', 'ENDED', 'CANCELLED'];

export function AuctionsContent({ user }: AuctionsContentProps) {
  const router = useRouter();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Tous');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Modals and panels
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [bidPanelOpened, { open: openBidPanel, close: closeBidPanel }] = useDisclosure(false);
  const [extendModalOpened, { open: openExtendModal, close: closeExtendModal }] = useDisclosure(false);
  const [convertModalOpened, { open: openConvertModal, close: closeConvertModal }] = useDisclosure(false);
  const [createAuctionDrawerOpened, { open: openCreateAuctionDrawer, close: closeCreateAuctionDrawer }] = useDisclosure(false);
  
  // Selected auction for actions
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [auctionToDelete, setAuctionToDelete] = useState<string | null>(null);
  const [extendMinutes, setExtendMinutes] = useState(15);

  // Create auction form state
  const [newAuction, setNewAuction] = useState({
    title: '',
    description: '',
    images: [] as string[],
    category: '',
    startingPrice: 0,
    reservePrice: 0,
    duration: 24,
    startTime: '',
    autoExtend: true,
    extendMinutes: 5,
  });

  const itemsPerPage = 10;

  // Fetch auctions from API
  const fetchAuctions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(selectedStatus !== 'Tous' && { status: selectedStatus }),
      });

      console.log('Fetching auctions with params:', params.toString());
      const response = await fetch(`/api/vendors/auctions?${params}`);
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API Error:', errorData);
        throw new Error(`API Error: ${errorData.error || 'Failed to fetch auctions'}`);
      }
      
      const data = await response.json();
      console.log('Received data:', data);
      
      setAuctions(data.auctions || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error('Error fetching auctions:', error);
      notifications.show({
        title: 'Erreur',
        message: error instanceof Error ? error.message : 'Impossible de charger les enchères',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedStatus]);

  // Initial load and when filters change
  useEffect(() => {
    fetchAuctions();
  }, [currentPage, debouncedSearch, selectedStatus]);

  // Real-time updates simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setAuctions(prev => prev.map(auction => {
        if (auction.status === 'ACTIVE') {
          const now = new Date();
          const endTime = new Date(auction.endTime);
          const timeLeft = endTime.getTime() - now.getTime();
          
          // Check if auction should end soon
          if (timeLeft <= 60 * 60 * 1000 && timeLeft > 0) { // 1 hour
            return { ...auction, status: 'ENDING_SOON' as const };
          }
          
          // Check if auction should end
          if (timeLeft <= 0) {
            return { ...auction, status: 'ENDED' as const };
          }
          
          // Simulate bid updates occasionally
          if (Math.random() < 0.05) {
            return {
              ...auction,
              currentBid: auction.currentBid + auction.increment,
              bidCount: auction.bidCount + 1,
              updatedAt: new Date().toISOString(),
            };
          }
        }
        return auction;
      }));
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Auctions are already filtered and paginated by the API
  const paginatedAuctions = auctions;
  const totalPages = stats ? Math.ceil(stats.totalAuctions / itemsPerPage) : 1;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'gray';
      case 'SCHEDULED': return 'blue';
      case 'ACTIVE': return 'green';
      case 'ENDING_SOON': return 'orange';
      case 'ENDED': return 'dark';
      case 'CANCELLED': return 'red';
      default: return 'gray';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'Brouillon';
      case 'SCHEDULED': return 'Programmée';
      case 'ACTIVE': return 'En cours';
      case 'ENDING_SOON': return 'Bientôt terminée';
      case 'ENDED': return 'Terminée';
      case 'CANCELLED': return 'Annulée';
      default: return status;
    }
  };

  const handleAuctionAction = async (auctionId: string, action: 'start' | 'pause' | 'extend' | 'close' | 'cancel') => {
    try {
      setLoading(true);
      
      let response;
      
      switch (action) {
        case 'extend':
          response = await fetch(`/api/vendors/auctions/${auctionId}/extend`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hours: extendMinutes / 60 }),
          });
          break;
        case 'cancel':
          response = await fetch(`/api/vendors/auctions/${auctionId}/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: 'Annulée par le vendeur' }),
          });
          break;
        default:
          // For other actions, use the main auction endpoint
          response = await fetch(`/api/vendors/auctions/${auctionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              status: action === 'start' ? 'ACTIVE' : action === 'pause' ? 'DRAFT' : 'ENDED'
            }),
          });
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Action failed');
      }

      const result = await response.json();
      
      // Refresh auctions list
      await fetchAuctions();
      
      switch (action) {
        case 'start':
          notifications.show({
            title: 'Enchère démarrée',
            message: 'L\'enchère a été démarrée avec succès',
            color: 'green',
          });
          break;
        case 'pause':
          notifications.show({
            title: 'Enchère mise en pause',
            message: 'L\'enchère a été mise en pause',
            color: 'orange',
          });
          break;
        case 'extend':
          notifications.show({
            title: 'Enchère prolongée',
            message: result.message || `L'enchère a été prolongée`,
            color: 'blue',
          });
          break;
        case 'cancel':
          notifications.show({
            title: 'Enchère annulée',
            message: result.message || 'L\'enchère a été annulée',
            color: 'orange',
          });
          break;
        case 'close':
          notifications.show({
            title: 'Enchère clôturée',
            message: 'L\'enchère a été clôturée avec succès',
            color: 'green',
          });
          break;
      }
    } catch (error: any) {
      notifications.show({
        title: 'Erreur',
        message: error.message || 'Une erreur est survenue',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExtendAuction = async () => {
    if (selectedAuction) {
      await handleAuctionAction(selectedAuction.id, 'extend');
      closeExtendModal();
    }
  };

  const handleConvertToOrder = async () => {
    if (selectedAuction) {
      try {
        setLoading(true);
        
        // Update auction status and create order
        setAuctions(prev => prev.map(auction => 
          auction.id === selectedAuction.id 
            ? { 
                ...auction, 
                status: 'ENDED' as const,
                endTime: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
            : auction
        ));

        notifications.show({
          title: 'Commande créée',
          message: 'L\'enchère a été convertie en commande avec succès',
          color: 'green',
        });

        closeConvertModal();
      } catch (error) {
        notifications.show({
          title: 'Erreur',
          message: 'Impossible de convertir l\'enchère en commande',
          color: 'red',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const openBidders = (auction: Auction) => {
    setSelectedAuction(auction);
    openBidPanel();
  };

  const openExtendDialog = (auction: Auction) => {
    setSelectedAuction(auction);
    setExtendMinutes(15);
    openExtendModal();
  };

  const openConvertDialog = (auction: Auction) => {
    setSelectedAuction(auction);
    openConvertModal();
  };

  const getTimeRemaining = (endTime: string) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Terminée';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}j ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getProgressPercentage = (startTime: string, endTime: string) => {
    const now = new Date().getTime();
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    return ((now - start) / (end - start)) * 100;
  };

  const handleDeleteAuction = async (auctionId: string) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/vendors/auctions/${auctionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete auction');
      }

      const result = await response.json();
      
      // Refresh auctions list
      await fetchAuctions();
      
      notifications.show({
        title: 'Enchère supprimée',
        message: result.message || 'L\'enchère a été supprimée avec succès',
        color: 'green',
      });
    } catch (error: any) {
      notifications.show({
        title: 'Erreur',
        message: error.message || 'Impossible de supprimer l\'enchère',
        color: 'red',
      });
    } finally {
      setLoading(false);
      closeDeleteModal();
      setAuctionToDelete(null);
    }
  };

  const handleCreateAuction = async () => {
    try {
      setLoading(true);

      // Validate required fields
      if (!newAuction.title || !newAuction.description || !newAuction.category || newAuction.startingPrice <= 0) {
        notifications.show({
          title: 'Erreur de validation',
          message: 'Veuillez remplir tous les champs obligatoires',
          color: 'red',
        });
        return;
      }

      const response = await fetch('/api/vendors/auctions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newAuction,
          reservePrice: newAuction.reservePrice > 0 ? newAuction.reservePrice : null,
          images: newAuction.images.length > 0 ? newAuction.images : ['https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop&auto=format'],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create auction');
      }

      const result = await response.json();
      
      // Reset form
      setNewAuction({
        title: '',
        description: '',
        images: [],
        category: '',
        startingPrice: 0,
        reservePrice: 0,
        duration: 24,
        startTime: '',
        autoExtend: true,
        extendMinutes: 5,
      });

      // Close drawer and refresh list
      closeCreateAuctionDrawer();
      await fetchAuctions();
      
      notifications.show({
        title: 'Enchère créée',
        message: result.message || 'L\'enchère a été créée avec succès',
        color: 'green',
      });
    } catch (error: any) {
      notifications.show({
        title: 'Erreur',
        message: error.message || 'Impossible de créer l\'enchère',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && auctions.length === 0) {
    return (
      <Center style={{ height: 400 }}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <>
      <Stack gap="xl">
        {/* Page Header */}
        <Group justify="space-between">
          <div>
            <Title order={1} size="2rem" mb="xs">
              Enchères
            </Title>
            <Text c="dimmed" size="lg">
              Gérez vos enchères et suivez les enchérisseurs
            </Text>
          </div>
          <Button
            leftSection={<Plus size={16} />}
            onClick={openCreateAuctionDrawer}
          >
            Nouvelle enchère
          </Button>
        </Group>

        {/* Stats Cards */}
        {stats && (
          <Grid>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Group justify="space-between">
                  <div>
                    <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                      Total enchères
                    </Text>
                    <Text fw={700} size="xl">
                      {stats.totalAuctions}
                    </Text>
                  </div>
                  <TrendingUp size={24} color="blue" />
                </Group>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Group justify="space-between">
                  <div>
                    <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                      Actives
                    </Text>
                    <Text fw={700} size="xl" c="green">
                      {stats.activeAuctions}
                    </Text>
                  </div>
                  <Zap size={24} color="green" />
                </Group>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Group justify="space-between">
                  <div>
                    <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                      Bientôt terminées
                    </Text>
                    <Text fw={700} size="xl" c="orange">
                      {stats.endingSoon}
                    </Text>
                  </div>
                  <AlertCircle size={24} color="orange" />
                </Group>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Group justify="space-between">
                  <div>
                    <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                      Revenus totaux
                    </Text>
                    <Text fw={700} size="xl" c="blue">
                      {stats.totalRevenue?.toLocaleString()} MAD
                    </Text>
                  </div>
                  <DollarSign size={24} color="blue" />
                </Group>
              </Card>
            </Grid.Col>
          </Grid>
        )}

          {/* Filters */}
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group gap="md">
              <TextInput
                placeholder="Rechercher une enchère..."
                leftSection={<Search size={16} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1 }}
              />
              <Select
                placeholder="Statut"
                data={statuses}
                value={selectedStatus}
                onChange={(value) => setSelectedStatus(value || 'Tous')}
                clearable={false}
              />
            </Group>
          </Card>

          {/* Auctions Table */}
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            {paginatedAuctions.length === 0 ? (
              <Center py="xl">
                <Stack align="center" gap="md">
                  <AlertCircle size={48} color="gray" />
                  <Text size="lg" c="dimmed">
                    Aucune enchère trouvée
                  </Text>
                  <Button
                    leftSection={<Plus size={16} />}
                    onClick={openCreateAuctionDrawer}
                  >
                    Créer votre première enchère
                  </Button>
                </Stack>
              </Center>
            ) : (
              <>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Visuel</Table.Th>
                      <Table.Th>Produit</Table.Th>
                      <Table.Th>Statut</Table.Th>
                      <Table.Th>Mise de départ</Table.Th>
                      <Table.Th>Prix actuel</Table.Th>
                      <Table.Th>Incrément</Table.Th>
                      <Table.Th>Auto-bid</Table.Th>
                      <Table.Th>Temps restant</Table.Th>
                      <Table.Th>Enchères</Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {paginatedAuctions.map((auction) => (
                      <Table.Tr key={auction.id}>
                        <Table.Td>
                          <Image
                            src={auction.image}
                            alt={auction.title}
                            width={60}
                            height={60}
                            radius="sm"
                          />
                        </Table.Td>
                        <Table.Td>
                          <div>
                            <Text fw={500} size="sm" lineClamp={1}>
                              {auction.title}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {auction.description.substring(0, 50)}...
                            </Text>
                            {auction.reservePrice && (
                              <Text size="xs" c="orange">
                                Réserve: {auction.reservePrice.toLocaleString()} MAD
                              </Text>
                            )}
                          </div>
                        </Table.Td>
                        <Table.Td>
                          <Stack gap={4}>
                            <Badge color={getStatusColor(auction.status)} variant="light">
                              {getStatusLabel(auction.status)}
                            </Badge>
                            {(auction.status === 'ACTIVE' || auction.status === 'ENDING_SOON') && (
                              <Progress
                                value={getProgressPercentage(auction.startTime, auction.endTime)}
                                size="xs"
                                color={auction.status === 'ENDING_SOON' ? 'red' : 'blue'}
                              />
                            )}
                          </Stack>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">
                            {auction.startingPrice.toLocaleString()} MAD
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <div>
                            <Text size="sm" fw={500} c="blue">
                              {auction.currentBid.toLocaleString()} MAD
                            </Text>
                            {auction.winnerId && auction.status === 'ENDED' && (
                              <Text size="xs" c="green">
                                Gagnant: {auction.winnerName}
                              </Text>
                            )}
                          </div>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">
                            {auction.increment} MAD
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <Badge 
                              color={auction.autoBidEnabled ? 'green' : 'gray'} 
                              variant="light"
                              size="sm"
                            >
                              {auction.autoBidEnabled ? 'ON' : 'OFF'}
                            </Badge>
                            {auction.antiSnipingEnabled && (
                              <Tooltip label="Anti-sniping activé">
                                <Badge color="blue" variant="light" size="sm">
                                  <Timer size={10} />
                                </Badge>
                              </Tooltip>
                            )}
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <div>
                            <Text 
                              size="sm" 
                              fw={500}
                              c={auction.status === 'ENDING_SOON' ? 'red' : undefined}
                            >
                              {getTimeRemaining(auction.endTime)}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {new Date(auction.endTime).toLocaleDateString('fr-FR')}
                            </Text>
                          </div>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <Text size="sm" fw={500}>
                              {auction.bidCount}
                            </Text>
                            <ActionIcon
                              variant="subtle"
                              size="sm"
                              onClick={() => openBidders(auction)}
                              disabled={auction.bidCount === 0}
                            >
                              <Users size={14} />
                            </ActionIcon>
                            <Text size="xs" c="dimmed">
                              {auction.watchers} 👁
                            </Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Menu shadow="md" width={250}>
                            <Menu.Target>
                              <ActionIcon variant="subtle">
                                <MoreHorizontal size={16} />
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                              <Menu.Label>Visualisation</Menu.Label>
                              <Menu.Item
                                leftSection={<Eye size={16} />}
                                onClick={() => router.push(`/auctions/${auction.id}`)}
                              >
                                Voir l'enchère publique
                              </Menu.Item>
                              <Menu.Item
                                leftSection={<Users size={16} />}
                                onClick={() => openBidders(auction)}
                                disabled={auction.bidCount === 0}
                              >
                                Voir enchérisseurs ({auction.bidCount})
                              </Menu.Item>
                              
                              <Menu.Divider />
                              <Menu.Label>Actions</Menu.Label>
                              
                              {auction.status === 'DRAFT' && (
                                <Menu.Item
                                  leftSection={<Calendar size={16} />}
                                  color="blue"
                                  onClick={() => router.push(`/workspace/my-auctions/${auction.id}/schedule`)}
                                >
                                  Planifier
                                </Menu.Item>
                              )}
                              
                              {auction.status === 'SCHEDULED' && (
                                <Menu.Item
                                  leftSection={<Play size={16} />}
                                  color="green"
                                  onClick={() => handleAuctionAction(auction.id, 'start')}
                                >
                                  Démarrer maintenant
                                </Menu.Item>
                              )}
                              
                              {(auction.status === 'ACTIVE' || auction.status === 'ENDING_SOON') && (
                                <>
                                  <Menu.Item
                                    leftSection={<Pause size={16} />}
                                    color="orange"
                                    onClick={() => handleAuctionAction(auction.id, 'pause')}
                                  >
                                    Arrêter
                                  </Menu.Item>
                                  <Menu.Item
                                    leftSection={<Clock size={16} />}
                                    color="blue"
                                    onClick={() => openExtendDialog(auction)}
                                  >
                                    Étendre (anti-sniping)
                                  </Menu.Item>
                                  <Menu.Item
                                    leftSection={<XCircle size={16} />}
                                    color="red"
                                    onClick={() => handleAuctionAction(auction.id, 'cancel')}
                                  >
                                    Annuler l'enchère
                                  </Menu.Item>
                                  <Menu.Item
                                    leftSection={<CheckCircle size={16} />}
                                    color="green"
                                    onClick={() => openConvertDialog(auction)}
                                  >
                                    Clôturer et convertir
                                  </Menu.Item>
                                </>
                              )}
                              
                              {auction.status === 'ENDED' && auction.winnerId && (
                                <Menu.Item
                                  leftSection={<DollarSign size={16} />}
                                  color="green"
                                  onClick={() => router.push(`/workspace/orders/create?auction=${auction.id}`)}
                                >
                                  Créer la commande
                                </Menu.Item>
                              )}
                              
                              <Menu.Divider />
                              
                              <Menu.Item
                                leftSection={<Edit size={16} />}
                                onClick={() => router.push(`/workspace/my-auctions/${auction.id}/edit`)}
                                disabled={auction.status === 'ACTIVE' || auction.status === 'ENDING_SOON'}
                              >
                                Modifier
                              </Menu.Item>
                              
                              {auction.status === 'ENDED' && (
                                <Menu.Item
                                  leftSection={<RotateCcw size={16} />}
                                  onClick={() => router.push(`/workspace/my-auctions/create?relistFrom=${auction.id}`)}
                                >
                                  Remettre en vente
                                </Menu.Item>
                              )}
                              
                              <Menu.Item
                                leftSection={<Trash2 size={16} />}
                                color="red"
                                onClick={() => {
                                  setAuctionToDelete(auction.id);
                                  openDeleteModal();
                                }}
                                disabled={auction.status === 'ACTIVE' || auction.status === 'ENDING_SOON'}
                              >
                                Supprimer
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <Group justify="center" mt="md">
                    <Pagination
                      value={currentPage}
                      onChange={setCurrentPage}
                      total={totalPages}
                    />
                  </Group>
                )}
              </>
            )}
          </Card>
      </Stack>

      {/* Bid Panel */}
      {selectedAuction && (
        <AuctionBidPanel
          opened={bidPanelOpened}
          onClose={closeBidPanel}
          auctionId={selectedAuction.id}
          auctionTitle={selectedAuction.title}
          currentBid={selectedAuction.currentBid}
          increment={selectedAuction.increment}
          endTime={selectedAuction.endTime}
        />
      )}

      {/* Extend Auction Modal */}
      <Modal
        opened={extendModalOpened}
        onClose={closeExtendModal}
        title="Étendre l'enchère"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            Étendre la durée de l'enchère pour éviter le sniping et permettre plus d'enchères.
          </Text>
          
          <NumberInput
            label="Minutes à ajouter"
            value={extendMinutes}
            onChange={(value) => setExtendMinutes(value as number)}
            min={5}
            max={120}
            step={5}
          />
          
          <Group justify="flex-end" gap="sm">
            <Button variant="outline" onClick={closeExtendModal}>
              Annuler
            </Button>
            <Button
              leftSection={<Clock size={16} />}
              onClick={handleExtendAuction}
              loading={loading}
            >
              Étendre de {extendMinutes} min
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Create Auction Drawer */}
      <Drawer
        opened={createAuctionDrawerOpened}
        onClose={closeCreateAuctionDrawer}
        title="Nouvelle enchère"
        position="right"
        size="lg"
        padding="md"
      >
        <Stack gap="md">
          <Tabs defaultValue="basic">
            <Tabs.List>
              <Tabs.Tab value="basic" leftSection={<Package size={16} />}>
                Informations de base
              </Tabs.Tab>
              <Tabs.Tab value="pricing" leftSection={<DollarSign size={16} />}>
                Prix et durée
              </Tabs.Tab>
              <Tabs.Tab value="settings" leftSection={<Tag size={16} />}>
                Paramètres
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="basic" pt="md">
              <Stack gap="md">
                <TextInput
                  label="Titre de l'enchère"
                  placeholder="Ex: iPhone 14 Pro Max 256GB"
                  value={newAuction.title}
                  onChange={(e) => setNewAuction(prev => ({ ...prev, title: e.target.value }))}
                  required
                />

                <Textarea
                  label="Description"
                  placeholder="Décrivez votre produit en détail..."
                  value={newAuction.description}
                  onChange={(e) => setNewAuction(prev => ({ ...prev, description: e.target.value }))}
                  minRows={4}
                  required
                />

                <Select
                  label="Catégorie"
                  placeholder="Sélectionnez une catégorie"
                  value={newAuction.category}
                  onChange={(value) => setNewAuction(prev => ({ ...prev, category: value || '' }))}
                  data={[
                    { value: 'electronics', label: 'Électronique' },
                    { value: 'fashion', label: 'Mode' },
                    { value: 'home', label: 'Maison & Jardin' },
                    { value: 'sports', label: 'Sports & Loisirs' },
                    { value: 'books', label: 'Livres' },
                    { value: 'art', label: 'Art & Antiquités' },
                    { value: 'jewelry', label: 'Bijoux & Montres' },
                    { value: 'automotive', label: 'Automobile' },
                    { value: 'other', label: 'Autre' },
                  ]}
                  required
                />

                <div>
                  <FileInput
                    label="Images du produit"
                    placeholder="Cliquez pour ajouter des images"
                    multiple
                    accept="image/*"
                    leftSection={<Upload size={16} />}
                    onChange={(files) => {
                      if (files && files.length > 0) {
                        // Convert files to URLs for preview (in a real app, you'd upload to a service)
                        const fileUrls = Array.from(files).map(file => URL.createObjectURL(file));
                        setNewAuction(prev => ({ ...prev, images: fileUrls }));
                      }
                    }}
                    description={`${newAuction.images.length} image(s) sélectionnée(s)`}
                  />
                  
                  {newAuction.images.length > 0 && (
                    <Box mt="sm">
                      <Text size="sm" fw={500} mb="xs">Aperçu des images:</Text>
                      <Group gap="xs">
                        {newAuction.images.map((url, index) => (
                          <Box
                            key={index}
                            style={{
                              position: 'relative',
                              width: 60,
                              height: 60,
                              borderRadius: 8,
                              overflow: 'hidden',
                              border: '1px solid #e9ecef'
                            }}
                          >
                            <img
                              src={url}
                              alt={`Preview ${index + 1}`}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                            />
                            <ActionIcon
                              size="xs"
                              color="red"
                              variant="filled"
                              style={{
                                position: 'absolute',
                                top: 2,
                                right: 2
                              }}
                              onClick={() => {
                                setNewAuction(prev => ({
                                  ...prev,
                                  images: prev.images.filter((_, i) => i !== index)
                                }));
                              }}
                            >
                              ×
                            </ActionIcon>
                          </Box>
                        ))}
                      </Group>
                    </Box>
                  )}
                </div>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="pricing" pt="md">
              <Stack gap="md">
                <NumberInput
                  label="Prix de départ"
                  placeholder="0"
                  value={newAuction.startingPrice}
                  onChange={(value) => setNewAuction(prev => ({ ...prev, startingPrice: Number(value) || 0 }))}
                  min={1}
                  suffix=" MAD"
                  required
                />

                <NumberInput
                  label="Prix de réserve (optionnel)"
                  placeholder="Laisser vide si aucun prix de réserve"
                  description="Prix minimum pour que l'enchère soit valide. Laisser à 0 pour aucun prix de réserve."
                  value={newAuction.reservePrice || ''}
                  onChange={(value) => setNewAuction(prev => ({ ...prev, reservePrice: Number(value) || 0 }))}
                  min={0}
                  suffix=" MAD"
                />

                <NumberInput
                  label="Durée de l'enchère (heures)"
                  placeholder="24"
                  value={newAuction.duration}
                  onChange={(value) => setNewAuction(prev => ({ ...prev, duration: Number(value) || 24 }))}
                  min={1}
                  max={168}
                  suffix=" heures"
                  required
                />

                <TextInput
                  label="Heure de début (optionnel)"
                  placeholder="Laisser vide pour démarrer immédiatement"
                  type="datetime-local"
                  value={newAuction.startTime}
                  onChange={(e) => setNewAuction(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="settings" pt="md">
              <Stack gap="md">
                <Switch
                  label="Extension automatique"
                  description="Prolonge automatiquement l'enchère si une mise est placée dans les dernières minutes"
                  checked={newAuction.autoExtend}
                  onChange={(e) => setNewAuction(prev => ({ ...prev, autoExtend: e.currentTarget.checked }))}
                />

                {newAuction.autoExtend && (
                  <NumberInput
                    label="Minutes d'extension"
                    placeholder="5"
                    value={newAuction.extendMinutes}
                    onChange={(value) => setNewAuction(prev => ({ ...prev, extendMinutes: Number(value) || 5 }))}
                    min={1}
                    max={30}
                    suffix=" minutes"
                  />
                )}

                <Alert color="blue" title="Informations importantes">
                  <Text size="sm">
                    • L'enchère sera visible publiquement une fois créée
                    • Vous pourrez modifier les détails tant qu'aucune mise n'a été placée
                    • Les frais de commission s'appliquent uniquement en cas de vente
                  </Text>
                </Alert>
              </Stack>
            </Tabs.Panel>
          </Tabs>

          <Divider />

          <Group justify="flex-end" gap="sm">
            <Button
              variant="outline"
              onClick={closeCreateAuctionDrawer}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              leftSection={<Save size={16} />}
              onClick={handleCreateAuction}
              loading={loading}
            >
              Créer l'enchère
            </Button>
          </Group>
        </Stack>
      </Drawer>

      {/* Convert to Order Modal */}
      <Modal
        opened={convertModalOpened}
        onClose={closeConvertModal}
        title="Clôturer et convertir en commande"
        centered
      >
        <Stack gap="md">
          {selectedAuction && (
            <>
              <Alert color="blue" variant="light">
                <Text size="sm">
                  Cette action va clôturer l'enchère et créer automatiquement une commande 
                  pour le gagnant avec le montant de {selectedAuction.currentBid.toLocaleString()} MAD.
                </Text>
              </Alert>
              
              {selectedAuction.winnerId ? (
                <Card shadow="sm" padding="md" withBorder>
                  <Group justify="space-between">
                    <div>
                      <Text fw={500}>Gagnant</Text>
                      <Text size="sm" c="dimmed">{selectedAuction.winnerName || 'Utilisateur anonyme'}</Text>
                    </div>
                    <div>
                      <Text fw={500} c="green">
                        {selectedAuction.currentBid.toLocaleString()} MAD
                      </Text>
                      <Text size="xs" c="dimmed">Prix final</Text>
                    </div>
                  </Group>
                </Card>
              ) : (
                <Alert color="orange" variant="light">
                  <Text size="sm">
                    Aucun gagnant identifié. L'enchère sera clôturée sans créer de commande.
                  </Text>
                </Alert>
              )}
            </>
          )}
          
          <Group justify="flex-end" gap="sm">
            <Button variant="outline" onClick={closeConvertModal}>
              Annuler
            </Button>
            <Button
              leftSection={<CheckCircle size={16} />}
              onClick={handleConvertToOrder}
              loading={loading}
              color="green"
            >
              Clôturer et convertir
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title="Confirmer la suppression"
        centered
      >
        <Alert
          icon={<AlertCircle size={16} />}
          title="Action irréversible"
          color="red"
          mb="md"
        >
          Êtes-vous sûr de vouloir supprimer cette enchère ? Cette action ne peut pas être annulée.
        </Alert>
        <Group justify="flex-end" gap="sm">
          <Button variant="outline" onClick={closeDeleteModal}>
            Annuler
          </Button>
          <Button
            color="red"
            onClick={() => {
              if (auctionToDelete) {
                handleDeleteAuction(auctionToDelete);
              }
            }}
            loading={loading}
          >
            Supprimer
          </Button>
        </Group>
      </Modal>
    </>
  );
}