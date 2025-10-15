'use client';

import {
  Container,
  Title,
  Text,
  Stack,
  Loader,
  Alert,
  Card,
  Group,
  Button,
  NumberInput,
  Image,
  ActionIcon,
  Divider,
  Badge,
  SimpleGrid,
  Box
} from '@mantine/core';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Package
} from 'lucide-react';
import { notifications } from '@mantine/notifications';
import Link from 'next/link';

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    title: string;
    images: Array<{ url: string }>;
    condition: 'NEW' | 'USED';
    stock: number;
  };
}

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cart');
      const data = await response.json();
      
      if (response.ok) {
        setCartItems(data.items || []);
      } else {
        setError(data.error || 'Erreur lors du chargement du panier');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, productId: string, newQuantity: number, stock: number) => {
    if (newQuantity <= 0) {
      await removeFromCart(itemId);
      return;
    }

    if (newQuantity > stock) {
      notifications.show({
        title: 'Stock insuffisant',
        message: `Seulement ${stock} articles disponibles`,
        color: 'orange',
      });
      return;
    }

    try {
      setUpdatingItemId(itemId);
      
      const response = await fetch(`/api/cart/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      if (response.ok) {
        setCartItems(cartItems.map(item => 
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        ));
        notifications.show({
          title: 'Quantité mise à jour',
          message: 'Votre panier a été mis à jour',
          color: 'green',
        });
      } else {
        const data = await response.json();
        notifications.show({
          title: 'Erreur',
          message: data.error || 'Impossible de mettre à jour la quantité',
          color: 'red',
        });
      }
    } catch (err) {
      notifications.show({
        title: 'Erreur',
        message: 'Erreur de connexion',
        color: 'red',
      });
    } finally {
      setUpdatingItemId(null);
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const response = await fetch(`/api/cart/items/${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCartItems(cartItems.filter(item => item.id !== itemId));
        notifications.show({
          title: 'Article retiré',
          message: 'L\'article a été retiré du panier',
          color: 'green',
        });
      } else {
        const data = await response.json();
        notifications.show({
          title: 'Erreur',
          message: data.error || 'Impossible de retirer l\'article',
          color: 'red',
        });
      }
    } catch (err) {
      notifications.show({
        title: 'Erreur',
        message: 'Erreur de connexion',
        color: 'red',
      });
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    router.push('/checkout');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 0 ? (subtotal > 500 ? 0 : 30) : 0;
  const total = subtotal + shipping;

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Stack align="center" justify="center" style={{ minHeight: '400px' }}>
          <Loader size="lg" />
          <Text c="dimmed">Chargement de votre panier...</Text>
        </Stack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="xl" py="xl">
        <Alert title="Erreur" color="red" icon={<ShoppingCart />}>
          {error}
        </Alert>
        <Button mt="md" variant="light" onClick={() => router.push('/products')}>
          Retour aux produits
        </Button>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      {/* Header */}
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={1}>
            <Group gap="xs">
              <ShoppingCart size={32} />
              Mon panier
            </Group>
          </Title>
          <Text c="dimmed" mt="xs">
            {cartItems.length > 0
              ? `${cartItems.length} article${cartItems.length > 1 ? 's' : ''} dans votre panier`
              : 'Votre panier est vide'}
          </Text>
        </div>
        <Button
          component={Link}
          href="/products"
          variant="light"
          leftSection={<Package size={20} />}
        >
          Continuer mes achats
        </Button>
      </Group>

      {cartItems.length === 0 ? (
        // Empty Cart State
        <Card withBorder padding="xl" radius="md">
          <Stack align="center" py={60}>
            <ShoppingBag size={64} strokeWidth={1.5} color="var(--mantine-color-gray-5)" />
            <Title order={3} c="dimmed">Votre panier est vide</Title>
            <Text c="dimmed" ta="center" maw={400}>
              Découvrez nos produits et enchères pour commencer vos achats
            </Text>
            <Group mt="md">
              <Button component={Link} href="/products" size="lg">
                Voir les produits
              </Button>
              <Button component={Link} href="/auctions" variant="light" size="lg">
                Voir les enchères
              </Button>
            </Group>
          </Stack>
        </Card>
      ) : (
        <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="lg">
          {/* Cart Items */}
          <Box style={{ gridColumn: 'span 2' }}>
            <Stack gap="md">
              {cartItems.map((item) => (
                <Card key={item.id} withBorder padding="md" radius="md">
                  <Group align="flex-start" wrap="nowrap">
                    {/* Product Image */}
                    <Card withBorder padding={0} radius="sm" style={{ width: 100, height: 100, overflow: 'hidden' }}>
                      <Image
                        src={
                          item.product.images && item.product.images.length > 0
                            ? item.product.images[0].url
                            : 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200'
                        }
                        alt={item.product.title}
                        height={100}
                        fit="cover"
                      />
                    </Card>

                    {/* Product Info */}
                    <div style={{ flex: 1 }}>
                      <Group justify="space-between" align="flex-start" mb="xs">
                        <div>
                          <Text
                            component={Link}
                            href={`/products/${item.productId}`}
                            fw={600}
                            size="lg"
                            style={{ textDecoration: 'none', color: 'inherit' }}
                            className="hover:underline"
                          >
                            {item.product.title}
                          </Text>
                          <Group gap="xs" mt={4}>
                            <Badge size="sm" color={item.product.condition === 'NEW' ? 'blue' : 'gray'}>
                              {item.product.condition === 'NEW' ? 'Neuf' : 'Occasion'}
                            </Badge>
                            <Text size="sm" c="dimmed">
                              Stock: {item.product.stock}
                            </Text>
                          </Group>
                        </div>

                        {/* Remove Button */}
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => removeFromCart(item.id)}
                          size="lg"
                        >
                          <Trash2 size={18} />
                        </ActionIcon>
                      </Group>

                      {/* Price and Quantity */}
                      <Group justify="space-between" mt="md">
                        <div>
                          <Text size="sm" c="dimmed">Prix unitaire</Text>
                          <Text fw={600} size="lg">
                            {formatPrice(item.price)} د.م
                          </Text>
                        </div>

                        {/* Quantity Controls */}
                        <Group gap="xs">
                          <ActionIcon
                            variant="default"
                            onClick={() => updateQuantity(item.id, item.productId, item.quantity - 1, item.product.stock)}
                            disabled={item.quantity <= 1 || updatingItemId === item.id}
                            size="lg"
                          >
                            <Minus size={16} />
                          </ActionIcon>

                          <NumberInput
                            value={item.quantity}
                            onChange={(value) => updateQuantity(item.id, item.productId, Number(value) || 1, item.product.stock)}
                            min={1}
                            max={item.product.stock}
                            w={60}
                            disabled={updatingItemId === item.id}
                            hideControls
                            styles={{ input: { textAlign: 'center' } }}
                          />

                          <ActionIcon
                            variant="default"
                            onClick={() => updateQuantity(item.id, item.productId, item.quantity + 1, item.product.stock)}
                            disabled={item.quantity >= item.product.stock || updatingItemId === item.id}
                            size="lg"
                          >
                            <Plus size={16} />
                          </ActionIcon>
                        </Group>

                        <div style={{ textAlign: 'right' }}>
                          <Text size="sm" c="dimmed">Sous-total</Text>
                          <Text fw={700} size="xl" c="blue">
                            {formatPrice(item.price * item.quantity)} د.م
                          </Text>
                        </div>
                      </Group>
                    </div>
                  </Group>
                </Card>
              ))}
            </Stack>
          </Box>

          {/* Order Summary */}
          <Box>
            <Card withBorder padding="lg" radius="md" style={{ position: 'sticky', top: 20 }}>
              <Title order={3} mb="md">Résumé de la commande</Title>

              <Stack gap="sm">
                <Group justify="space-between">
                  <Text c="dimmed">Sous-total</Text>
                  <Text fw={500}>{formatPrice(subtotal)} د.م</Text>
                </Group>

                <Group justify="space-between">
                  <Text c="dimmed">Livraison</Text>
                  <Text fw={500} c={shipping === 0 ? 'green' : undefined}>
                    {shipping === 0 ? 'Gratuite' : `${formatPrice(shipping)} د.م`}
                  </Text>
                </Group>

                {subtotal > 0 && subtotal < 500 && (
                  <Alert color="blue" variant="light" p="xs">
                    <Text size="xs">
                      Plus que {formatPrice(500 - subtotal)} د.م pour la livraison gratuite!
                    </Text>
                  </Alert>
                )}

                <Divider my="sm" />

                <Group justify="space-between">
                  <Text fw={600} size="lg">Total</Text>
                  <Text fw={700} size="xl" c="blue">
                    {formatPrice(total)} د.م
                  </Text>
                </Group>

                <Button
                  size="lg"
                  fullWidth
                  rightSection={<ArrowRight size={20} />}
                  onClick={handleCheckout}
                  mt="md"
                >
                  Procéder au paiement
                </Button>

                <Button
                  variant="light"
                  fullWidth
                  component={Link}
                  href="/products"
                >
                  Continuer mes achats
                </Button>
              </Stack>

              <Divider my="lg" />

              {/* Trust Badges */}
              <Stack gap="xs">
                <Text size="sm" fw={500}>Garanties</Text>
                <Group gap="xs">
                  <Badge variant="light" color="green">Paiement sécurisé</Badge>
                  <Badge variant="light" color="blue">Retour gratuit</Badge>
                </Group>
              </Stack>
            </Card>
          </Box>
        </SimpleGrid>
      )}
    </Container>
  );
}
