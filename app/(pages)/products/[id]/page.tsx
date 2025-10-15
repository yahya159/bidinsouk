'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Container,
  Grid,
  Title,
  Text,
  Button,
  Image,
  Badge,
  Card,
  Group,
  Stack,
  NumberInput,
  Divider,
  Tabs,
  Avatar,
  Rating,
  SimpleGrid,
  Loader,
  Alert,
  Breadcrumbs,
  Anchor
} from '@mantine/core';
import {
  ShoppingCart,
  Heart,
  Share2,
  Store,
  Package,
  Shield,
  Truck,
  Star,
  ChevronLeft
} from 'lucide-react';
import { notifications } from '@mantine/notifications';
import Link from 'next/link';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: 'NEW' | 'USED';
  images: Array<{ url: string }>;
  stock: number;
  store: {
    id: string;
    name: string;
    rating: number;
  };
  specifications?: Record<string, string>;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/products/${params.id}`);
        const result = await response.json();

        if (response.ok) {
          // The API returns { success: true, data: {...} }
          setProduct(result.data || result);
        } else {
          setError(result.error || 'Produit non trouvé');
        }
      } catch (err) {
        setError('Erreur de connexion au serveur');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  const handleAddToCart = async () => {
    try {
      setAddingToCart(true);

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product?.id,
          quantity,
        }),
      });

      if (response.ok) {
        notifications.show({
          title: 'Succès!',
          message: 'Produit ajouté au panier',
          color: 'green',
        });
      } else {
        const data = await response.json();
        if (response.status === 401 && data.redirectTo) {
          // Redirect to login page
          router.push('/login');
        } else {
          notifications.show({
            title: 'Erreur',
            message: data.error || 'Impossible d\'ajouter au panier',
            color: 'red',
          });
        }
      }
    } catch (error) {
      notifications.show({
        title: 'Erreur',
        message: 'Erreur de connexion',
        color: 'red',
      });
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    router.push('/cart');
  };

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Stack align="center" py={50}>
          <Loader size="lg" />
          <Text c="dimmed">Chargement du produit...</Text>
        </Stack>
      </Container>
    );
  }

  if (error || !product) {
    return (
      <Container size="xl" py="xl">
        <Alert color="red" title="Erreur">
          {error || 'Produit non trouvé'}
        </Alert>
        <Button
          mt="md"
          variant="light"
          leftSection={<ChevronLeft size={16} />}
          onClick={() => router.back()}
        >
          Retour
        </Button>
      </Container>
    );
  }

  const breadcrumbs = [
    { title: 'Accueil', href: '/' },
    { title: 'Produits', href: '/products' },
    { title: product.category, href: `/products?cat=${product.category}` },
    { title: product.title, href: '#' },
  ];

  return (
    <Container size="xl" py="xl">
      {/* Breadcrumbs */}
      <Breadcrumbs mb="lg">
        {breadcrumbs.map((item, index) => (
          <Anchor
            key={index}
            component={Link}
            href={item.href}
            c={index === breadcrumbs.length - 1 ? 'dimmed' : undefined}
          >
            {item.title}
          </Anchor>
        ))}
      </Breadcrumbs>

      <Grid gutter="xl">
        {/* Left Side - Images */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Stack>
            {/* Main Image */}
            <Card padding="xs" withBorder>
              <Image
                src={product.images?.[selectedImage]?.url || product.images?.[0]?.url || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800'}
                alt={product.title}
                height={400}
                fit="contain"
                style={{ cursor: 'zoom-in' }}
              />
            </Card>

            {/* Thumbnail Images */}
            {product.images && Array.isArray(product.images) && product.images.length > 1 && (
              <SimpleGrid cols={4} spacing="xs">
                {product.images.map((image, index) => (
                  <Card
                    key={index}
                    padding="xs"
                    withBorder
                    style={{
                      cursor: 'pointer',
                      border: selectedImage === index ? '2px solid var(--mantine-color-blue-6)' : undefined,
                    }}
                    onClick={() => setSelectedImage(index)}
                  >
                    <Image
                      src={image.url}
                      alt={`${product.title} - ${index + 1}`}
                      height={80}
                      fit="cover"
                    />
                  </Card>
                ))}
              </SimpleGrid>
            )}
          </Stack>
        </Grid.Col>

        {/* Right Side - Product Info */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Stack gap="md">
            {/* Title & Badge */}
            <div>
              <Group gap="xs" mb="xs">
                <Badge color={product.condition === 'NEW' ? 'blue' : 'gray'}>
                  {product.condition === 'NEW' ? 'Neuf' : 'Occasion'}
                </Badge>
                <Badge variant="light">{product.category}</Badge>
              </Group>
              <Title order={1} mb="xs">{product.title}</Title>
              <Text c="dimmed" size="sm">
                Référence: #{product.id}
              </Text>
            </div>

            {/* Price */}
            <Card withBorder padding="md">
              <Group justify="space-between" align="center">
                <div>
                  <Text size="xs" c="dimmed">Prix</Text>
                  <Title order={2} c="blue">
                    {product.price.toLocaleString('fr-FR')} د.م
                  </Title>
                </div>
                <div>
                  <Text size="xs" c="dimmed" ta="right">Stock</Text>
                  <Text fw={600} c={product.stock > 0 ? 'green' : 'red'}>
                    {product.stock > 0 ? `${product.stock} disponible${product.stock > 1 ? 's' : ''}` : 'Rupture'}
                  </Text>
                </div>
              </Group>
            </Card>

            {/* Quantity Selector */}
            {product.stock > 0 && (
              <div>
                <Text size="sm" fw={500} mb="xs">Quantité</Text>
                <NumberInput
                  value={quantity}
                  onChange={(value) => setQuantity(Number(value) || 1)}
                  min={1}
                  max={product.stock}
                  style={{ maxWidth: 120 }}
                />
              </div>
            )}

            {/* Action Buttons */}
            <Group grow>
              <Button
                size="lg"
                leftSection={<ShoppingCart size={20} />}
                disabled={product.stock === 0}
                loading={addingToCart}
                onClick={handleAddToCart}
              >
                Ajouter au panier
              </Button>
              <Button
                size="lg"
                variant="light"
                disabled={product.stock === 0}
                onClick={handleBuyNow}
              >
                Acheter maintenant
              </Button>
            </Group>

            {/* Secondary Actions */}
            <Group>
              <Button variant="subtle" leftSection={<Heart size={18} />}>
                Ajouter aux favoris
              </Button>
              <Button variant="subtle" leftSection={<Share2 size={18} />}>
                Partager
              </Button>
            </Group>

            <Divider />

            {/* Seller Info */}
            <Card withBorder padding="md">
              <Group>
                <Avatar size="md" color="blue">
                  <Store size={20} />
                </Avatar>
                <div style={{ flex: 1 }}>
                  <Text fw={600}>{product.store.name}</Text>
                  <Group gap={4}>
                    <Rating value={product.store.rating} fractions={2} readOnly size="xs" />
                    <Text size="xs" c="dimmed">({product.store.rating})</Text>
                  </Group>
                </div>
                <Button size="xs" variant="light" component={Link} href={`/stores/${product.store.id}`}>
                  Voir la boutique
                </Button>
              </Group>
            </Card>

            {/* Trust Badges */}
            <SimpleGrid cols={3} spacing="xs">
              <Card withBorder padding="sm" ta="center">
                <Shield size={24} style={{ margin: '0 auto 8px' }} />
                <Text size="xs">Paiement sécurisé</Text>
              </Card>
              <Card withBorder padding="sm" ta="center">
                <Truck size={24} style={{ margin: '0 auto 8px' }} />
                <Text size="xs">Livraison rapide</Text>
              </Card>
              <Card withBorder padding="sm" ta="center">
                <Package size={24} style={{ margin: '0 auto 8px' }} />
                <Text size="xs">Retour gratuit</Text>
              </Card>
            </SimpleGrid>
          </Stack>
        </Grid.Col>
      </Grid>

      {/* Product Details Tabs */}
      <Card mt="xl" withBorder>
        <Tabs defaultValue="description">
          <Tabs.List>
            <Tabs.Tab value="description">Description</Tabs.Tab>
            <Tabs.Tab value="specifications">Spécifications</Tabs.Tab>
            <Tabs.Tab value="reviews">Avis (0)</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="description" pt="md">
            <Text>{product.description || 'Aucune description disponible.'}</Text>
          </Tabs.Panel>

          <Tabs.Panel value="specifications" pt="md">
            {product.specifications && Object.keys(product.specifications).length > 0 ? (
              <Stack gap="xs">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <Group key={key} justify="space-between">
                    <Text fw={500}>{key}</Text>
                    <Text c="dimmed">{value}</Text>
                  </Group>
                ))}
              </Stack>
            ) : (
              <Text c="dimmed">Aucune spécification disponible.</Text>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="reviews" pt="md">
            <Text c="dimmed" ta="center" py={40}>
              Aucun avis pour le moment. Soyez le premier à laisser un avis!
            </Text>
          </Tabs.Panel>
        </Tabs>
      </Card>

      {/* Related Products - Coming Soon */}
      <Card mt="xl" withBorder>
        <Title order={3} mb="md">Produits similaires</Title>
        <Text c="dimmed" ta="center" py={40}>
          Les produits similaires seront affichés ici.
        </Text>
      </Card>
    </Container>
  );
}

