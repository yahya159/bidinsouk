'use client';

import { useState, useEffect } from 'react';
import { 
  Modal, 
  TextInput, 
  Textarea, 
  Select, 
  Button, 
  Stack, 
  Group,
  Alert,
  Text,
  Avatar,
  Card
} from '@mantine/core';
import { IconAlertCircle, IconMessageCircle, IconUser } from '@tabler/icons-react';

interface Vendor {
  id: string;
  name: string;
  avatar?: string;
  storeName: string;
}

interface CreateMessageModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateMessageModal = ({ opened, onClose, onSuccess }: CreateMessageModalProps) => {
  const [formData, setFormData] = useState({
    vendorId: '',
    subject: '',
    message: '',
    productId: ''
  });
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger la liste des vendeurs
  const loadVendors = async () => {
    try {
      setLoadingVendors(true);
      const response = await fetch('/api/vendors?active=true');
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des vendeurs');
      }
      
      const data = await response.json();
      setVendors(data.vendors || []);
    } catch (err) {
      console.error('Erreur chargement vendeurs:', err);
      setVendors([]);
    } finally {
      setLoadingVendors(false);
    }
  };

  // Charger les vendeurs à l'ouverture
  useEffect(() => {
    if (opened) {
      loadVendors();
    }
  }, [opened]);

  // Gérer les changements de formulaire
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Mettre à jour le vendeur sélectionné
    if (field === 'vendorId') {
      const vendor = vendors.find(v => v.id === value);
      setSelectedVendor(vendor || null);
    }
  };

  // Valider le formulaire
  const validateForm = () => {
    if (!formData.vendorId) {
      setError('Veuillez sélectionner un vendeur');
      return false;
    }
    if (!formData.subject.trim()) {
      setError('Le sujet est obligatoire');
      return false;
    }
    if (!formData.message.trim()) {
      setError('Le message est obligatoire');
      return false;
    }
    return true;
  };

  // Soumettre le formulaire
  const handleSubmit = async () => {
    setError(null);
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/messages/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'VENDOR_CHAT',
          vendorId: formData.vendorId,
          subject: formData.subject.trim(),
          initialMessage: formData.message.trim(),
          ...(formData.productId && { productId: formData.productId })
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création du message');
      }

      // Réinitialiser le formulaire
      setFormData({
        vendorId: '',
        subject: '',
        message: '',
        productId: ''
      });
      setSelectedVendor(null);

      onSuccess();
      onClose();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  // Fermer et réinitialiser
  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        vendorId: '',
        subject: '',
        message: '',
        productId: ''
      });
      setSelectedVendor(null);
      setError(null);
      onClose();
    }
  };

  // Préparer les options de vendeurs pour le Select
  const vendorOptions = vendors.map(vendor => ({
    value: vendor.id,
    label: `${vendor.name} - ${vendor.storeName}`
  }));

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="xs">
          <IconMessageCircle size={20} />
          <Text fw={600}>Nouveau message à un vendeur</Text>
        </Group>
      }
      size="lg"
      centered
    >
      <Stack gap="md">
        {/* Erreur */}
        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
            {error}
          </Alert>
        )}

        {/* Sélection du vendeur */}
        <Select
          label="Vendeur"
          placeholder="Sélectionnez un vendeur"
          data={vendorOptions}
          value={formData.vendorId}
          onChange={(value) => handleChange('vendorId', value || '')}
          required
          disabled={isLoading || loadingVendors}
          searchable
          nothingFoundMessage="Aucun vendeur trouvé"
        />

        {/* Informations du vendeur sélectionné */}
        {selectedVendor && (
          <Card p="sm" withBorder>
            <Group gap="sm">
              <Avatar size="sm" radius="xl">
                {selectedVendor.avatar ? (
                  <img src={selectedVendor.avatar} alt={selectedVendor.name} />
                ) : (
                  <IconUser size={16} />
                )}
              </Avatar>
              <div>
                <Text size="sm" fw={500}>
                  {selectedVendor.name}
                </Text>
                <Text size="xs" c="dimmed">
                  {selectedVendor.storeName}
                </Text>
              </div>
            </Group>
          </Card>
        )}

        {/* Sujet */}
        <TextInput
          label="Sujet"
          placeholder="Objet de votre message"
          value={formData.subject}
          onChange={(e) => handleChange('subject', e.target.value)}
          required
          disabled={isLoading}
        />

        {/* Produit concerné (optionnel) */}
        <TextInput
          label="Produit concerné (optionnel)"
          placeholder="ID ou nom du produit"
          value={formData.productId}
          onChange={(e) => handleChange('productId', e.target.value)}
          disabled={isLoading}
        />

        {/* Message */}
        <Textarea
          label="Message"
          placeholder="Tapez votre message..."
          value={formData.message}
          onChange={(e) => handleChange('message', e.target.value)}
          minRows={4}
          maxRows={8}
          autosize
          required
          disabled={isLoading}
        />

        {/* Actions */}
        <Group justify="flex-end" gap="sm">
          <Button
            variant="subtle"
            onClick={handleClose}
            disabled={isLoading}
          >
            Annuler
          </Button>
          
          <Button
            onClick={handleSubmit}
            loading={isLoading}
            leftSection={<IconMessageCircle size={16} />}
          >
            Envoyer le message
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};