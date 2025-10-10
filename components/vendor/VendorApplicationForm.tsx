'use client'

import { useState } from 'react'
import { Button, Stack, TextInput, Textarea, Select, Checkbox, Text, Alert } from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconAlertCircle } from '@tabler/icons-react'

interface VendorApplicationFormProps {
  onSuccess?: () => void;
}

export function VendorApplicationForm({ onSuccess }: VendorApplicationFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const form = useForm({
    initialValues: {
      name: '',
      email: '',
      phone: '',
      businessName: '',
      businessType: '',
      description: '',
      acceptTerms: false,
    },

    validate: {
      name: (value) => (value.length < 1 ? 'Le nom est requis' : null),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Email invalide'),
      phone: (value) => (value.length < 1 ? 'Le numéro de téléphone est requis' : null),
      businessName: (value) => (value.length < 1 ? 'Le nom de votre entreprise est requis' : null),
      businessType: (value) => (value.length < 1 ? 'Le type de votre entreprise est requis' : null),
      description: (value) => (value.length < 1 ? 'Une description de votre activité est requise' : null),
      acceptTerms: (value) => (value === true ? null : 'Vous devez accepter les conditions'),
    },
  })

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/vendors/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSuccess(true)
        if (onSuccess) {
          // Attendre un peu pour que l'utilisateur voie le message de succès
          setTimeout(onSuccess, 2000)
        }
      } else {
        setError(data.error || 'Erreur lors de la soumission du formulaire')
      }
    } catch (err) {
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Alert 
        icon={<IconAlertCircle size={16} />} 
        title="Succès !" 
        color="green"
      >
        Votre demande pour devenir vendeur a été soumise avec succès !
        {onSuccess ? "Fermeture automatique..." : "Vous pouvez fermer cette fenêtre."}
      </Alert>
    )
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <Stack gap="xs">
          <Text fw={500}>Informations personnelles</Text>
          <Stack gap="sm">
            <TextInput
              label="Nom complet *"
              placeholder="Votre nom complet"
              {...form.getInputProps('name')}
            />

            <TextInput
              label="Email *"
              placeholder="votre@email.com"
              {...form.getInputProps('email')}
            />

            <TextInput
              label="Téléphone *"
              placeholder="+212 6 00 00 00 00"
              {...form.getInputProps('phone')}
            />
          </Stack>
        </Stack>

        <Stack gap="xs">
          <Text fw={500}>Informations sur l'entreprise</Text>
          <Stack gap="sm">
            <TextInput
              label="Nom de l'entreprise *"
              placeholder="Nom de votre entreprise"
              {...form.getInputProps('businessName')}
            />

            <Select
              label="Type d'entreprise *"
              placeholder="Sélectionnez un type"
              data={[
                { value: 'individual', label: 'Particulier' },
                { value: 'sarl', label: 'SARL' },
                { value: 'sas', label: 'SAS' },
                { value: 'sasu', label: 'SASU' },
                { value: 'sa', label: 'SA' },
                { value: 'other', label: 'Autre' },
              ]}
              {...form.getInputProps('businessType')}
            />

            <Textarea
              label="Description de votre activité *"
              placeholder="Décrivez votre activité, les produits que vous souhaitez vendre..."
              rows={4}
              {...form.getInputProps('description')}
            />
          </Stack>
        </Stack>

        <Checkbox
          label="J'accepte les conditions générales *"
          {...form.getInputProps('acceptTerms', { type: 'checkbox' })}
        />

        {error && (
          <Alert 
            icon={<IconAlertCircle size={16} />} 
            title="Erreur" 
            color="red"
          >
            {error}
          </Alert>
        )}

        <Button 
          type="submit" 
          loading={loading}
          fullWidth
          size="md"
        >
          Soumettre la demande
        </Button>
      </Stack>
    </form>
  )
}

export default VendorApplicationForm