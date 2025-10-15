'use client';

import {
  Container,
  Title,
  Text,
  Stack,
  Card,
  Group,
  Button,
  Stepper,
  TextInput,
  Textarea,
  Radio,
  Divider,
  Badge,
  Image,
  Alert,
  Loader,
  ActionIcon
} from '@mantine/core';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  MessageSquare,
  Package,
  CheckCircle,
  Phone,
  Home,
  Building,
  Edit,
  Plus
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
    store: {
      id: string;
      name: string;
    };
  };
}

interface Address {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  isDefault: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [showNewAddress, setShowNewAddress] = useState(false);
  
  // New address form
  const [newAddress, setNewAddress] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    postalCode: '',
  });

  // Delivery notes
  const [deliveryNotes, setDeliveryNotes] = useState('');

  useEffect(() => {
    fetchCheckoutData();
  }, []);

  const fetchCheckoutData = async () => {
    try {
      setLoading(true);

      // Fetch cart
      const cartResponse = await fetch('/api/cart');
      const cartData = await cartResponse.json();
      
      if (cartResponse.ok && cartData.items?.length > 0) {
        setCartItems(cartData.items);
      } else {
        notifications.show({
          title: 'Panier vide',
          message: 'Votre panier est vide',
          color: 'orange',
        });
        router.push('/cart');
        return;
      }

      // Fetch addresses
      const addressResponse = await fetch('/api/users/addresses');
      if (addressResponse.ok) {
        const addressData = await addressResponse.json();
        setAddresses(addressData.addresses || []);
        
        // Select default address
        const defaultAddr = addressData.addresses?.find((a: Address) => a.isDefault);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
        }
      }

    } catch (error) {
      notifications.show({
        title: 'Erreur',
        message: 'Erreur de chargement',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.fullName || !newAddress.phone || !newAddress.addressLine1 || !newAddress.city) {
      notifications.show({
        title: 'Champs requis',
        message: 'Veuillez remplir tous les champs obligatoires',
        color: 'orange',
      });
      return;
    }

    try {
      const response = await fetch('/api/users/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAddress),
      });

      if (response.ok) {
        const data = await response.json();
        setAddresses([...addresses, data.address]);
        setSelectedAddressId(data.address.id);
        setShowNewAddress(false);
        setNewAddress({
          fullName: '',
          phone: '',
          addressLine1: '',
          addressLine2: '',
          city: '',
          postalCode: '',
        });
        notifications.show({
          title: 'Adresse ajoutée',
          message: 'Votre adresse a été enregistrée',
          color: 'green',
        });
        nextStep();
      } else {
        const data = await response.json();
        notifications.show({
          title: 'Erreur',
          message: data.error || 'Impossible d\'ajouter l\'adresse',
          color: 'red',
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Erreur',
        message: 'Erreur de connexion',
        color: 'red',
      });
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      notifications.show({
        title: 'Adresse requise',
        message: 'Veuillez sélectionner une adresse de livraison',
        color: 'orange',
      });
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch('/api/orders/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          addressId: selectedAddressId,
          deliveryNotes: deliveryNotes || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        notifications.show({
          title: 'Demande envoyée!',
          message: 'Votre demande a été envoyée au vendeur',
          color: 'green',
        });

        // Move to success step
        nextStep();
        
        // Clear cart
        await fetch('/api/cart', { method: 'DELETE' });
        
      } else {
        const data = await response.json();
        notifications.show({
          title: 'Erreur',
          message: data.error || 'Impossible de créer la demande',
          color: 'red',
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Erreur',
        message: 'Erreur de connexion',
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () => setActive((current) => (current < 3 ? current + 1 : current));
  const prevStep = () => setActive((current) => (current > 0 ? current - 1 : current));

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

  // Group items by vendor
  const itemsByVendor = cartItems.reduce((acc, item) => {
    const vendorId = item.product.store.id;
    if (!acc[vendorId]) {
      acc[vendorId] = {
        vendor: item.product.store,
        items: []
      };
    }
    acc[vendorId].items.push(item);
    return acc;
  }, {} as Record<string, { vendor: { id: string; name: string }; items: CartItem[] }>);

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Stack align="center" py={50}>
          <Loader size="lg" />
          <Text c="dimmed">Chargement...</Text>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Title order={1} mb="xl">Finaliser la commande</Title>

      <Group align="flex-start" gap="xl">
        {/* Main Content */}
        <div style={{ flex: 1 }}>
          <Stepper active={active} onStepClick={setActive}>
            {/* Step 1: Address */}
            <Stepper.Step
              label="Adresse"
              description="Où livrer?"
              icon={<MapPin size={18} />}
            >
              <Card withBorder padding="lg" mt="md">
                <Title order={3} mb="md">Adresse de livraison</Title>

                {!showNewAddress ? (
                  <Stack gap="md">
                    {addresses.length === 0 ? (
                      <Alert color="blue">
                        Vous n'avez pas d'adresse enregistrée
                      </Alert>
                    ) : (
                      <Radio.Group value={selectedAddressId} onChange={setSelectedAddressId}>
                        <Stack gap="sm">
                          {addresses.map((address) => (
                            <Card key={address.id} withBorder padding="md">
                              <Radio
                                value={address.id}
                                label={
                                  <div>
                                    <Group gap="xs" mb="xs">
                                      <Text fw={600}>{address.fullName}</Text>
                                      {address.isDefault && (
                                        <Badge size="sm" variant="light">Par défaut</Badge>
                                      )}
                                    </Group>
                                    <Text size="sm" c="dimmed">{address.addressLine1}</Text>
                                    {address.addressLine2 && (
                                      <Text size="sm" c="dimmed">{address.addressLine2}</Text>
                                    )}
                                    <Text size="sm" c="dimmed">
                                      {address.city}, {address.postalCode}
                                    </Text>
                                    <Text size="sm" c="dimmed">
                                      <Phone size={14} style={{ display: 'inline', marginRight: 4 }} />
                                      {address.phone}
                                    </Text>
                                  </div>
                                }
                              />
                            </Card>
                          ))}
                        </Stack>
                      </Radio.Group>
                    )}

                    <Button
                      variant="light"
                      leftSection={<Plus size={18} />}
                      onClick={() => setShowNewAddress(true)}
                    >
                      Ajouter une nouvelle adresse
                    </Button>

                    {selectedAddressId && (
                      <Button onClick={nextStep} size="lg">
                        Continuer
                      </Button>
                    )}
                  </Stack>
                ) : (
                  <Stack gap="md">
                    <TextInput
                      label="Nom complet"
                      placeholder="Ex: Ahmed Benali"
                      required
                      value={newAddress.fullName}
                      onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                      leftSection={<Home size={18} />}
                    />

                    <TextInput
                      label="Téléphone"
                      placeholder="Ex: +212 6 12 34 56 78"
                      required
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                      leftSection={<Phone size={18} />}
                    />

                    <TextInput
                      label="Adresse"
                      placeholder="Ex: 123 Rue Mohammed V"
                      required
                      value={newAddress.addressLine1}
                      onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                      leftSection={<MapPin size={18} />}
                    />

                    <TextInput
                      label="Complément d'adresse (optionnel)"
                      placeholder="Ex: Appartement 5, Bâtiment B"
                      value={newAddress.addressLine2}
                      onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                    />

                    <Group grow>
                      <TextInput
                        label="Ville"
                        placeholder="Ex: Casablanca"
                        required
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        leftSection={<Building size={18} />}
                      />

                      <TextInput
                        label="Code postal"
                        placeholder="Ex: 20000"
                        value={newAddress.postalCode}
                        onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                      />
                    </Group>

                    <Group>
                      <Button variant="light" onClick={() => setShowNewAddress(false)}>
                        Annuler
                      </Button>
                      <Button onClick={handleAddAddress}>
                        Enregistrer et continuer
                      </Button>
                    </Group>
                  </Stack>
                )}
              </Card>
            </Stepper.Step>

            {/* Step 2: Review Order */}
            <Stepper.Step
              label="Vérification"
              description="Vérifier la commande"
              icon={<Package size={18} />}
            >
              <Card withBorder padding="lg" mt="md">
                <Title order={3} mb="md">Vérifier votre commande</Title>

                <Alert color="blue" mb="md" icon={<MessageSquare />}>
                  <Text fw={600} size="sm" mb="xs">
                    Paiement via messagerie
                  </Text>
                  <Text size="sm">
                    Après validation, le vendeur vous contactera pour convenir du paiement et de la livraison.
                  </Text>
                </Alert>

                {/* Items by Vendor */}
                <Stack gap="md" mb="lg">
                  {Object.values(itemsByVendor).map(({ vendor, items }) => (
                    <Card key={vendor.id} withBorder padding="md">
                      <Text fw={600} mb="sm">Vendeur: {vendor.name}</Text>
                      <Stack gap="xs">
                        {items.map((item) => (
                          <Group key={item.id} wrap="nowrap">
                            <Image
                              src={item.product.images[0]?.url || ''}
                              width={50}
                              height={50}
                              fit="cover"
                              radius="sm"
                              alt={item.product.title}
                            />
                            <div style={{ flex: 1 }}>
                              <Text size="sm" fw={500}>{item.product.title}</Text>
                              <Text size="xs" c="dimmed">Quantité: {item.quantity}</Text>
                            </div>
                            <Text fw={600}>{formatPrice(item.price * item.quantity)} د.م</Text>
                          </Group>
                        ))}
                      </Stack>
                    </Card>
                  ))}
                </Stack>

                {/* Delivery Notes */}
                <Textarea
                  label="Notes de livraison (optionnel)"
                  placeholder="Instructions spéciales pour le vendeur..."
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  mb="md"
                  rows={3}
                />

                <Group>
                  <Button variant="light" onClick={prevStep}>
                    Retour
                  </Button>
                  <Button onClick={handlePlaceOrder} loading={submitting}>
                    Envoyer la demande
                  </Button>
                </Group>
              </Card>
            </Stepper.Step>

            {/* Step 3: Success */}
            <Stepper.Completed>
              <Card withBorder padding="xl" mt="md">
                <Stack align="center" py={40}>
                  <CheckCircle size={64} color="var(--mantine-color-green-6)" />
                  <Title order={2}>Demande envoyée!</Title>
                  <Text c="dimmed" ta="center" maw={500}>
                    Votre demande a été envoyée au vendeur. Il vous contactera via la messagerie pour convenir des modalités de paiement et de livraison.
                  </Text>

                  <Group mt="xl">
                    <Button
                      component={Link}
                      href="/messages"
                      size="lg"
                      leftSection={<MessageSquare size={20} />}
                    >
                      Voir mes messages
                    </Button>
                    <Button
                      component={Link}
                      href="/orders"
                      variant="light"
                      size="lg"
                    >
                      Mes commandes
                    </Button>
                  </Group>
                </Stack>
              </Card>
            </Stepper.Completed>
          </Stepper>
        </div>

        {/* Order Summary Sidebar */}
        <Card withBorder padding="lg" style={{ width: 350, position: 'sticky', top: 20 }}>
          <Title order={4} mb="md">Résumé</Title>

          <Stack gap="xs">
            <Group justify="space-between">
              <Text c="dimmed">Sous-total</Text>
              <Text fw={500}>{formatPrice(subtotal)} د.م</Text>
            </Group>

            <Group justify="space-between">
              <Text c="dimmed">Livraison</Text>
              <Text fw={500} c={shipping === 0 ? 'green' : undefined}>
                {shipping === 0 ? 'À convenir' : `${formatPrice(shipping)} د.م`}
              </Text>
            </Group>

            <Divider my="sm" />

            <Group justify="space-between">
              <Text fw={600} size="lg">Total estimé</Text>
              <Text fw={700} size="xl" c="blue">
                {formatPrice(total)} د.م
              </Text>
            </Group>

            <Alert color="blue" variant="light" mt="md" p="xs">
              <Text size="xs">
                Le montant final sera confirmé avec le vendeur
              </Text>
            </Alert>
          </Stack>

          <Divider my="lg" />

          <Stack gap="xs">
            <Text size="sm" fw={500}>Articles ({cartItems.length})</Text>
            {cartItems.slice(0, 3).map((item) => (
              <Group key={item.id} gap="xs" wrap="nowrap">
                <Image
                  src={item.product.images[0]?.url || ''}
                  width={40}
                  height={40}
                  fit="cover"
                  radius="sm"
                  alt={item.product.title}
                />
                <Text size="xs" lineClamp={1} style={{ flex: 1 }}>
                  {item.product.title}
                </Text>
                <Text size="xs" fw={500}>
                  x{item.quantity}
                </Text>
              </Group>
            ))}
            {cartItems.length > 3 && (
              <Text size="xs" c="dimmed">
                +{cartItems.length - 3} autre{cartItems.length - 3 > 1 ? 's' : ''}
              </Text>
            )}
          </Stack>
        </Card>
      </Group>
    </Container>
  );
}

