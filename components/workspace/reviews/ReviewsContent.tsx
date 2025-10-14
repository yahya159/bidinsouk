'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Stack,
  Card,
  Avatar,
  Badge,
  ActionIcon,
  Menu,
  TextInput,
  Select,
  Tabs,
  Pagination,
  Modal,
  Textarea,
  Rating,
  Image,
  Box,
  Center,
  Loader,
  Grid,
  Divider,
  Alert,
} from '@mantine/core';
import {
  Search,
  MoreHorizontal,
  Eye,
  Check,
  X,
  Reply,
  Flag,
  Star,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'CLIENT' | 'VENDOR' | 'ADMIN';
}

interface Review {
  id: string;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED';
  verified: boolean;
  author: {
    name: string;
    avatar?: string;
  };
  product: {
    id: string;
    title: string;
    image: string;
  };
  createdAt: string;
  vendorResponse?: {
    message: string;
    createdAt: string;
  };
  spamScore?: number;
}

interface ReviewStats {
  total: number;
  pending: number;
  approved: number;
  flagged: number;
  rejected: number;
  averageRating: number;
}

interface ReviewsContentProps {
  user: User;
}

export function ReviewsContent({ user }: ReviewsContentProps) {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedRating, setSelectedRating] = useState('');
  const [activeTab, setActiveTab] = useState<string | null>('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [responseText, setResponseText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [detailModalOpened, { open: openDetailModal, close: closeDetailModal }] = useDisclosure(false);
  const [responseModalOpened, { open: openResponseModal, close: closeResponseModal }] = useDisclosure(false);

  const itemsPerPage = 10;

  // Fetch reviews
  const fetchReviews = async () => {
    try {
      setLoading(true);
      
      // Use different API endpoints based on user role
      let apiUrl;
      let headers: HeadersInit = {
        'x-user-id': user.id,
        'x-user-role': user.role,
      };
      
      if (user.role === 'ADMIN') {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
          search: searchQuery,
          status: getStatusForAPI(),
          rating: selectedRating,
        });
        apiUrl = `/api/admin/reviews?${params}`;
      } else if (user.role === 'VENDOR') {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
          search: searchQuery,
          status: getStatusForAPI(),
          rating: selectedRating,
        });
        apiUrl = `/api/vendor/reviews?${params}`;
      } else {
        // If user is not admin or vendor, they don't have permission
        notifications.show({
          title: 'Accès refusé',
          message: 'Vous n\'avez pas les permissions nécessaires pour accéder à cette page.',
          color: 'red',
        });
        setLoading(false);
        return;
      }

      const response = await fetch(apiUrl, { headers });
      if (!response.ok) throw new Error('Failed to fetch reviews');

      const data = await response.json();
      setReviews(data.reviews);
      setStats(data.stats);
      setTotalPages(data.pagination?.totalPages || Math.ceil(data.total / itemsPerPage));
    } catch (error) {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de charger les avis',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusForAPI = () => {
    switch (activeTab) {
      case 'pending': return 'PENDING';
      case 'approved': return 'APPROVED';
      case 'flagged': return 'FLAGGED';
      case 'rejected': return 'REJECTED';
      default: return selectedStatus;
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [currentPage, searchQuery, selectedStatus, selectedRating, activeTab, user.role]);

  const handleReviewAction = async (reviewId: string, action: string, reason?: string) => {
    try {
      setActionLoading(true);
      const response = await fetch(user.role === 'ADMIN' ? '/api/admin/reviews' : '/api/vendor/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          'x-user-role': user.role,
        },
        body: JSON.stringify({
          reviewId,
          action,
          reason,
        }),
      });

      if (!response.ok) throw new Error('Failed to perform action');

      notifications.show({
        title: 'Action effectuée',
        message: `L'avis a été ${action === 'APPROVE' ? 'approuvé' : action === 'REJECT' ? 'rejeté' : 'signalé'}`,
        color: 'green',
      });

      // Refresh reviews
      fetchReviews();
    } catch (error) {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible d\'effectuer cette action',
        color: 'red',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!selectedReview || !responseText.trim()) return;

    try {
      setActionLoading(true);
      const response = await fetch(user.role === 'ADMIN' ? '/api/admin/reviews' : '/api/vendor/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          'x-user-role': user.role,
        },
        body: JSON.stringify({
          reviewId: selectedReview.id,
          action: 'RESPOND',
          response: responseText,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit response');

      notifications.show({
        title: 'Réponse envoyée',
        message: 'Votre réponse a été publiée',
        color: 'green',
      });

      setResponseText('');
      closeResponseModal();
      fetchReviews();
    } catch (error) {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible d\'envoyer la réponse',
        color: 'red',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'orange';
      case 'APPROVED': return 'green';
      case 'REJECTED': return 'red';
      case 'FLAGGED': return 'grape';
      default: return 'gray';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'En attente';
      case 'APPROVED': return 'Approuvé';
      case 'REJECTED': return 'Rejeté';
      case 'FLAGGED': return 'Signalé';
      default: return status;
    }
  };

  if (loading && reviews.length === 0) {
    return (
      <Center style={{ height: 400 }}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <>
      <Container size="xl" py="md">
        <Stack gap="xl">
          {/* Header */}
          <Group justify="space-between">
            <div>
              <Title order={1} size="2rem" mb="xs">
                Avis clients
              </Title>
              <Text c="dimmed" size="lg">
                Gérez et modérez les avis de vos produits
              </Text>
            </div>
          </Group>

          {/* Stats Cards */}
          {stats && (
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Group justify="space-between">
                    <div>
                      <Text c="dimmed" size="sm">Total Avis</Text>
                      <Text fw={700} size="xl">{stats.total}</Text>
                    </div>
                    <MessageSquare size={24} color="var(--mantine-color-blue-6)" />
                  </Group>
                </Card>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Group justify="space-between">
                    <div>
                      <Text c="dimmed" size="sm">En attente</Text>
                      <Text fw={700} size="xl">{stats.pending}</Text>
                    </div>
                    <AlertTriangle size={24} color="var(--mantine-color-orange-6)" />
                  </Group>
                </Card>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Group justify="space-between">
                    <div>
                      <Text c="dimmed" size="sm">Approuvés</Text>
                      <Text fw={700} size="xl">{stats.approved}</Text>
                    </div>
                    <CheckCircle size={24} color="var(--mantine-color-green-6)" />
                  </Group>
                </Card>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Group justify="space-between">
                    <div>
                      <Text c="dimmed" size="sm">Note moyenne</Text>
                      <Text fw={700} size="xl">
                        {stats.averageRating.toFixed(1)}
                      </Text>
                    </div>
                    <Star size={24} color="var(--mantine-color-yellow-6)" />
                  </Group>
                </Card>
              </Grid.Col>
            </Grid>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Tab value="pending">En attente</Tabs.Tab>
              <Tabs.Tab value="approved">Approuvés</Tabs.Tab>
              <Tabs.Tab value="flagged">Signalés</Tabs.Tab>
              <Tabs.Tab value="rejected">Rejetés</Tabs.Tab>
              <Tabs.Tab value="all">Tous</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value={activeTab || 'pending'} pt="md">
              {/* Filters */}
              <Card shadow="sm" padding="lg" radius="md" withBorder mb="md">
                <Group gap="md">
                  <TextInput
                    placeholder="Rechercher dans les avis..."
                    leftSection={<Search size={16} />}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <Select
                    placeholder="Note"
                    data={[
                      { value: '', label: 'Toutes les notes' },
                      { value: '5', label: '5 étoiles' },
                      { value: '4', label: '4 étoiles' },
                      { value: '3', label: '3 étoiles' },
                      { value: '2', label: '2 étoiles' },
                      { value: '1', label: '1 étoile' },
                    ]}
                    value={selectedRating}
                    onChange={(value) => setSelectedRating(value || '')}
                    clearable
                  />
                </Group>
              </Card>

              {/* Reviews List */}
              {reviews.length === 0 ? (
                <Center py="xl">
                  <Stack align="center" gap="md">
                    <MessageSquare size={48} color="gray" />
                    <Text size="lg" c="dimmed">
                      Aucun avis trouvé
                    </Text>
                  </Stack>
                </Center>
              ) : (
                <>
                  <Stack gap="md">
                    {reviews.map((review) => (
                      <Card key={review.id} shadow="sm" padding="lg" radius="md" withBorder>
                        <Stack gap="md">
                          {/* Review Header */}
                          <Group justify="space-between">
                            <Group>
                              <Avatar src={review.author.avatar} size="md" radius="xl">
                                {review.author.name.charAt(0)}
                              </Avatar>
                              <div>
                                <Group gap="xs">
                                  <Text fw={500} size="sm">{review.author.name}</Text>
                                  {review.verified && (
                                    <Badge size="xs" color="green" variant="light" leftSection={<Shield size={10} />}>
                                      Vérifié
                                    </Badge>
                                  )}
                                </Group>
                                <Group gap="xs">
                                  <Rating value={review.rating} readOnly size="sm" />
                                  <Text size="xs" c="dimmed">
                                    {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                                  </Text>
                                </Group>
                              </div>
                            </Group>
                            <Group gap="xs">
                              <Badge color={getStatusColor(review.status)} variant="light">
                                {getStatusLabel(review.status)}
                              </Badge>
                              {review.spamScore && review.spamScore > 0.5 && (
                                <Badge color="red" variant="light">
                                  Spam: {Math.round(review.spamScore * 100)}%
                                </Badge>
                              )}
                            </Group>
                          </Group>

                          {/* Product Info */}
                          <Group gap="sm">
                            <Image
                              src={review.product.image}
                              alt={review.product.title}
                              width={40}
                              height={40}
                              radius="md"
                            />
                            <Text size="sm" c="dimmed">
                              Produit: {review.product.title}
                            </Text>
                          </Group>

                          {/* Review Content */}
                          <div>
                            <Text fw={500} mb="xs">{review.title}</Text>
                            <Text size="sm" mb="md">{review.comment}</Text>
                            
                            {review.images && review.images.length > 0 && (
                              <Group gap="xs" mb="md">
                                {review.images.map((image, index) => (
                                  <Image
                                    key={index}
                                    src={image}
                                    alt={`Review image ${index + 1}`}
                                    width={60}
                                    height={60}
                                    radius="md"
                                  />
                                ))}
                              </Group>
                            )}
                          </div>

                          {/* Vendor Response */}
                          {review.vendorResponse && (
                            <Alert color="blue" variant="light">
                              <Text size="sm" fw={500} mb="xs">Réponse du vendeur:</Text>
                              <Text size="sm">{review.vendorResponse.message}</Text>
                              <Text size="xs" c="dimmed" mt="xs">
                                {new Date(review.vendorResponse.createdAt).toLocaleDateString('fr-FR')}
                              </Text>
                            </Alert>
                          )}

                          {/* Actions */}
                          <Group justify="space-between">
                            <Group gap="xs">
                              {review.status === 'PENDING' && (
                                <>
                                  <Button
                                    size="xs"
                                    variant="light"
                                    color="green"
                                    leftSection={<Check size={14} />}
                                    onClick={() => handleReviewAction(review.id, 'APPROVE')}
                                    loading={actionLoading}
                                  >
                                    Approuver
                                  </Button>
                                  <Button
                                    size="xs"
                                    variant="light"
                                    color="red"
                                    leftSection={<X size={14} />}
                                    onClick={() => handleReviewAction(review.id, 'REJECT')}
                                    loading={actionLoading}
                                  >
                                    Rejeter
                                  </Button>
                                </>
                              )}
                              <Button
                                size="xs"
                                variant="light"
                                color="grape"
                                leftSection={<Flag size={14} />}
                                onClick={() => handleReviewAction(review.id, 'FLAG')}
                                loading={actionLoading}
                              >
                                Signaler
                              </Button>
                            </Group>
                            <Group gap="xs">
                              <Button
                                size="xs"
                                variant="subtle"
                                leftSection={<Eye size={14} />}
                                onClick={() => {
                                  setSelectedReview(review);
                                  openDetailModal();
                                }}
                              >
                                Détails
                              </Button>
                              {!review.vendorResponse && (
                                <Button
                                  size="xs"
                                  variant="subtle"
                                  leftSection={<Reply size={14} />}
                                  onClick={() => {
                                    setSelectedReview(review);
                                    openResponseModal();
                                  }}
                                >
                                  Répondre
                                </Button>
                              )}
                            </Group>
                          </Group>
                        </Stack>
                      </Card>
                    ))}
                  </Stack>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <Group justify="center" mt="xl">
                      <Pagination
                        value={currentPage}
                        onChange={setCurrentPage}
                        total={totalPages}
                        size="sm"
                      />
                    </Group>
                  )}
                </>
              )}
            </Tabs.Panel>
          </Tabs>
        </Stack>
      </Container>

      {/* Detail Modal */}
      <Modal
        opened={detailModalOpened}
        onClose={closeDetailModal}
        title="Détails de l'avis"
        size="lg"
      >
        {selectedReview && (
          <Stack gap="md">
            <Group>
              <Avatar src={selectedReview.author.avatar} size="lg" radius="xl">
                {selectedReview.author.name.charAt(0)}
              </Avatar>
              <div>
                <Group gap="xs">
                  <Text fw={500}>{selectedReview.author.name}</Text>
                  {selectedReview.verified && (
                    <Badge size="xs" color="green" variant="light">
                      Vérifié
                    </Badge>
                  )}
                </Group>
                <Group gap="xs">
                  <Rating value={selectedReview.rating} readOnly />
                  <Text size="sm" c="dimmed">
                    {new Date(selectedReview.createdAt).toLocaleDateString('fr-FR')}
                  </Text>
                </Group>
              </div>
            </Group>

            <Divider />

            <div>
              <Text fw={500} mb="xs">{selectedReview.title}</Text>
              <Text>{selectedReview.comment}</Text>
            </div>

            {selectedReview.images && selectedReview.images.length > 0 && (
              <div>
                <Text fw={500} mb="xs">Images:</Text>
                <Group gap="sm">
                  {selectedReview.images.map((image, index) => (
                    <Image
                      key={index}
                      src={image}
                      alt={`Review image ${index + 1}`}
                      width={100}
                      height={100}
                      radius="md"
                    />
                  ))}
                </Group>
              </div>
            )}

            <Group>
              <Text fw={500}>Produit:</Text>
              <Group gap="sm">
                <Image
                  src={selectedReview.product.image}
                  alt={selectedReview.product.title}
                  width={40}
                  height={40}
                  radius="md"
                />
                <Text>{selectedReview.product.title}</Text>
              </Group>
            </Group>

            {selectedReview.spamScore && (
              <Alert
                color={selectedReview.spamScore > 0.5 ? 'red' : 'yellow'}
                title="Score de spam"
              >
                Ce message a un score de spam de {Math.round(selectedReview.spamScore * 100)}%
              </Alert>
            )}
          </Stack>
        )}
      </Modal>

      {/* Response Modal */}
      <Modal
        opened={responseModalOpened}
        onClose={closeResponseModal}
        title="Répondre à l'avis"
        size="md"
      >
        {selectedReview && (
          <Stack gap="md">
            <Alert color="blue" variant="light">
              <Text size="sm">
                Vous répondez à l'avis de <strong>{selectedReview.author.name}</strong> 
                sur le produit <strong>{selectedReview.product.title}</strong>
              </Text>
            </Alert>

            <div>
              <Text fw={500} mb="xs">Avis original:</Text>
              <Text size="sm" c="dimmed" style={{ fontStyle: 'italic' }}>
                "{selectedReview.comment}"
              </Text>
            </div>

            <Textarea
              label="Votre réponse"
              placeholder="Rédigez votre réponse..."
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              minRows={4}
              required
            />

            <Group justify="flex-end">
              <Button variant="outline" onClick={closeResponseModal}>
                Annuler
              </Button>
              <Button
                onClick={handleSubmitResponse}
                loading={actionLoading}
                disabled={!responseText.trim()}
              >
                Publier la réponse
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </>
  );
}