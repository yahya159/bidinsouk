'use client';

import { useState } from 'react';
import { 
  Modal, 
  TextInput, 
  Textarea, 
  Select, 
  Button, 
  Stack, 
  Group,
  Alert,
  Text
} from '@mantine/core';
import { IconAlertCircle, IconLifebuoy } from '@tabler/icons-react';

interface CreateTicketModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateTicketModal = ({ opened, onClose, onSuccess }: CreateTicketModalProps) => {
  const [formData, setFormData] = useState({
    subject: '',
    category: '',
    priority: 'NORMAL',
    description: '',
    orderId: '',
    productId: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Options de catégorie
  const categoryOptions = [
    { value: 'ORDER', label: 'Problème de commande' },
    { value: 'PRODUCT', label: 'Question sur un produit' },
    { value: 'TECHNICAL', label: 'Problème technique' },
    { value: 'OTHER', label: 'Autre demande' }
  ];

  // Options de priorité
  const priorityOptions = [
    { value: 'LOW', label: 'Basse' },
    { value: 'NORMAL', label: 'Normale' },
    { value: 'HIGH', label: 'Haute' },
    { value: 'URGENT', label: 'Urgente' }
  ];

  // Gérer les changements de formulaire
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Valider le formulaire
  const validateForm = () => {
    if (!formData.subject.trim()) {
      setError('Le sujet est obligatoire');
      return false;
    }
    if (!formData.category) {
      setError('Veuillez sélectionner une catégorie');
      return false;
    }
    if (!formData.description.trim()) {
      setError('La description est obligatoire');
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
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subject: formData.subject.trim(),
          category: formData.category,
          priority: formData.priority,
          description: formData.description.trim(),
          ...(formData.orderId && { orderId: formData.orderId }),
          ...(formData.productId && { productId: formData.productId })
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création du ticket');
      }

      // Réinitialiser le formulaire
      setFormData({
        subject: '',
        category: '',
        priority: 'NORMAL',
        description: '',
        orderId: '',
        productId: ''
      });

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
        subject: '',
        category: '',
        priority: 'NORMAL',
        description: '',
        orderId: '',
        productId: ''
      });
      setError(null);
      onClose();
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="xs">
          <IconLifebuoy size={20} />
          <Text fw={600}>Nouvelle demande de support</Text>
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

        {/* Formulaire */}
        <TextInput
          label="Sujet"
          placeholder="Décrivez brièvement votre demande"
          value={formData.subject}
          onChange={(e) => handleChange('subject', e.target.value)}
          required
          disabled={isLoading}
        />

        <Group grow>
          <Select
            label="Catégorie"
            placeholder="Sélectionnez une catégorie"
            data={categoryOptions}
            value={formData.category}
            onChange={(value) => handleChange('category', value || '')}
            required
            disabled={isLoading}
          />

          <Select
            label="Priorité"
            data={priorityOptions}
            value={formData.priority}
            onChange={(value) => handleChange('priority', value || 'NORMAL')}
            disabled={isLoading}
          />
        </Group>

        <Group grow>
          <TextInput
            label="Numéro de commande (optionnel)"
            placeholder="ex: CMD-123456"
            value={formData.orderId}
            onChange={(e) => handleChange('orderId', e.target.value)}
            disabled={isLoading}
          />

          <TextInput
            label="ID Produit (optionnel)"
            placeholder="ex: PROD-789"
            value={formData.productId}
            onChange={(e) => handleChange('productId', e.target.value)}
            disabled={isLoading}
          />
        </Group>

        <Textarea
          label="Description détaillée"
          placeholder="Décrivez votre problème ou votre question en détail..."
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
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
            leftSection={<IconLifebuoy size={16} />}
          >
            Créer la demande
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};