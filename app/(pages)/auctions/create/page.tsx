'use client';

import { useState, useEffect } from 'react';
import { 
  Container, 
  Title, 
  Text, 
  Card, 
  Stack, 
  TextInput, 
  NumberInput, 
  Button, 
  Group, 
  Alert, 
  Select,
  Textarea,
  Box,
  Input,
  FileInput,
  ActionIcon
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconCheck, IconUpload, IconX } from '@tabler/icons-react';
import { ImageCropper } from '@/components/shared/ImageCropper';
import { useDisclosure } from '@mantine/hooks';
import { SiteHeader } from '@/components/layout/SiteHeader';
import Footer from '@/components/shared/Footer';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

// Catégories de produits prédéfinies
const PRODUCT_CATEGORIES = [
  'Électronique',
  'Mode',
  'Maison et Jardin',
  'Sports et Loisirs',
  'Beauté et Santé',
  'Livres et Médias',
  'Jeux et Jouets',
  'Auto et Moto',
  'Bijoux et Accessoires',
  'Art et Collections',
  'Informatique',
  'Téléphonie'
];

export default function CreateAuctionPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasActiveStore, setHasActiveStore] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [cropperOpened, { open: openCropper, close: closeCropper }] = useDisclosure(false);

  const form = useForm({
    initialValues: {
      title: '',
      description: '',
      category: '',
      storeId: '',
      startPrice: 0,
      reservePrice: 0,
      minIncrement: 10,
      startAt: new Date().toISOString().slice(0, 16), // Format: YYYY-MM-DDTHH:mm
      endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    },

    validate: {
      title: (value) => (value.length < 3 ? 'Le titre doit contenir au moins 3 caractères' : null),
      category: (value) => (value ? null : 'Veuillez sélectionner une catégorie'), // Validation de la catégorie
      // Suppression de la validation du produit
      startPrice: (value) => (value <= 0 ? 'Le prix de départ doit être supérieur à 0' : null),
      minIncrement: (value) => (value <= 0 ? 'L\'incrément minimum doit être supérieur à 0' : null),
    },
  });

  // Vérifier si l'utilisateur est connecté et récupérer ses boutiques
  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }

    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Récupérer les boutiques de l'utilisateur
        const storesResponse = await fetch('/api/stores');
        if (storesResponse.ok) {
          const storesData = await storesResponse.json();
          setStores(storesData.stores || []);
          
          // Vérifier si l'utilisateur a des boutiques actives
          if (storesData.stores && storesData.stores.length > 0) {
            const activeStore = storesData.stores.some((store: any) => store.status === 'ACTIVE');
            setHasActiveStore(activeStore);
          } else {
            // Si l'utilisateur n'a pas de boutiques, il ne peut pas créer d'enchères
            setHasActiveStore(false);
          }
        }
      } catch (err) {
        setError('Erreur lors du chargement des données utilisateur');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [session, status, router]);

  // Cleanup image URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imagePreviewUrls]);

  const handleImageUpload = (files: File[] | null) => {
    if (files && files.length > 0) {
      // Open cropper for the first file
      openCropper();
    }
  };

  const handleCroppedImage = (croppedImageUrl: string) => {
    // Convert base64 to File object
    fetch(croppedImageUrl)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], `cropped-image-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setSelectedImages(prev => [...prev, file]);
        setImagePreviewUrls(prev => [...prev, croppedImageUrl]);
      });
  };

  const removeImage = (index: number) => {
    // Revoke the object URL to prevent memory leaks
    URL.revokeObjectURL(imagePreviewUrls[index]);
    
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    setError(null);
    
    // Note: Store requirement removed - API will auto-create store if needed
    
    try {
      // Valider que la date de fin est après la date de début
      const startAt = new Date(values.startAt);
      const endAt = new Date(values.endAt);
      
      if (endAt <= startAt) {
        setError('La date de fin doit être après la date de début');
        setLoading(false);
        return;
      }
      
      const response = await fetch('/api/auctions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          startPrice: Number(values.startPrice),
          reservePrice: values.reservePrice > 0 ? Number(values.reservePrice) : null,
          minIncrement: Number(values.minIncrement),
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuccess(true);
        // Rediriger vers la page de l'enchère créée après 2 secondes
        setTimeout(() => {
          router.push(`/auction/${data.auction.id}`);
        }, 2000);
      } else {
        setError(data.error || 'Erreur lors de la création de l\'enchère');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <Container size="sm" py="xl">
        <Stack align="center" justify="center" style={{ height: '400px' }}>
          <Text>Chargement...</Text>
        </Stack>
      </Container>
    );
  }

  if (!session) {
    return null; // Redirection en cours
  }

  return (
    <>
      <SiteHeader />
      <Container size="sm" py="xl">
        <Stack gap="xl">
        <Title order={1} ta="center">Déposer une enchère</Title>
        <Text c="dimmed" ta="center">
          Créez une nouvelle enchère pour vendre vos produits
        </Text>

        {success ? (
          <Alert 
            icon={<IconCheck size={16} />} 
            title="Succès !" 
            color="green"
          >
            Votre enchère a été créée avec succès. Redirection en cours...
          </Alert>
        ) : (
          <Card 
            shadow="sm" 
            padding="xl" 
            radius="md" 
            withBorder
          >
            {/* Information message */}
            <Alert 
              icon={<IconCheck size={16} />} 
              title="Création d'enchère simplifiée" 
              color="blue"
              mb="md"
            >
              Une boutique sera automatiquement créée pour vous si vous n'en avez pas encore.
            </Alert>
            
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="md">
                {/* Informations de base */}
                <TextInput
                  label="Titre de l'enchère"
                  placeholder="Entrez un titre attractif pour votre enchère"
                  {...form.getInputProps('title')}
                />

                <Textarea
                  label="Description"
                  placeholder="Décrivez en détail le produit mis aux enchères"
                  minRows={3}
                  {...form.getInputProps('description')}
                />

                {/* Sélection de la catégorie (obligatoire) */}
                <Select
                  label="Catégorie *"
                  placeholder="Sélectionnez une catégorie"
                  data={PRODUCT_CATEGORIES}
                  {...form.getInputProps('category')}
                />

                {/* Sélection de la boutique (facultatif) */}
                <Select
                  label="Boutique (facultatif)"
                  placeholder="Sélectionnez une boutique"
                  data={stores.map((store: any) => ({
                    value: store.id.toString(),
                    label: store.name,
                    disabled: store.status !== 'ACTIVE' // Désactiver les boutiques non actives
                  }))}
                  {...form.getInputProps('storeId')}
                  clearable
                />

                {/* Images du produit */}
                <Box>
                  <FileInput
                    label="Images du produit"
                    placeholder="Cliquez pour ajouter des images"
                    multiple
                    accept="image/*"
                    leftSection={<IconUpload size={16} />}
                    onChange={handleImageUpload}
                    description={`${selectedImages.length} image(s) sélectionnée(s)`}
                  />
                  
                  {imagePreviewUrls.length > 0 && (
                    <Box mt="sm">
                      <Text size="sm" fw={500} mb="xs">Aperçu des images:</Text>
                      <Group gap="xs">
                        {imagePreviewUrls.map((url, index) => (
                          <Box
                            key={index}
                            style={{
                              position: 'relative',
                              width: 80,
                              height: 80,
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
                                top: 4,
                                right: 4
                              }}
                              onClick={() => removeImage(index)}
                            >
                              <IconX size={12} />
                            </ActionIcon>
                          </Box>
                        ))}
                      </Group>
                    </Box>
                  )}
                </Box>

                {/* Paramètres de l'enchère */}
                <Group grow>
                  <NumberInput
                    label="Prix de départ (MAD)"
                    placeholder="0.00"
                    min={0}
                    decimalScale={2}
                    {...form.getInputProps('startPrice')}
                  />
                  
                  <NumberInput
                    label="Prix de réserve (MAD) - Optionnel"
                    placeholder="Laisser à 0 pour aucun prix de réserve"
                    description="Prix minimum pour que l'enchère soit valide"
                    min={0}
                    decimalScale={2}
                    {...form.getInputProps('reservePrice')}
                  />
                </Group>

                <NumberInput
                  label="Incrément minimum (MAD)"
                  placeholder="10.00"
                  min={1}
                  decimalScale={2}
                  {...form.getInputProps('minIncrement')}
                />

                <Input.Wrapper label="Date et heure de début">
                  <Input
                    type="datetime-local"
                    {...form.getInputProps('startAt')}
                  />
                </Input.Wrapper>
                
                <Input.Wrapper label="Date et heure de fin">
                  <Input
                    type="datetime-local"
                    {...form.getInputProps('endAt')}
                  />
                </Input.Wrapper>

                {/* Messages d'erreur */}
                {error && (
                  <Alert 
                    icon={<IconAlertCircle size={16} />} 
                    title="Erreur" 
                    color="red"
                  >
                    {error}
                  </Alert>
                )}

                {/* Bouton de soumission */}
                <Group justify="center" mt="xl">
                  <Button 
                    type="submit" 
                    size="lg" 
                    loading={loading}
                    leftSection={<IconCheck size={16} />}
                  >
                    Créer l'enchère
                  </Button>
                </Group>
              </Stack>
            </form>
          </Card>
        )}

        {/* Image Cropper Modal */}
        <ImageCropper
          opened={cropperOpened}
          onClose={closeCropper}
          onCrop={handleCroppedImage}
          aspectRatio={4/3}
          title="Recadrer l'image du produit"
        />
        </Stack>
      </Container>
      <Footer />
    </>
  );
}