'use client'

import { Container, Title, Text, Card, Stack, TextInput, Button, Group, Alert, Loader } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { IconAlertCircle } from '@tabler/icons-react'

export default function CreateStorePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const form = useForm({
    initialValues: {
      name: '',
      email: '',
      phone: '',
      description: '',
    },

    validate: {
      name: (value) => (value.length < 3 ? 'Le nom doit contenir au moins 3 caractères' : null),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Email invalide'),
    },
  })

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true)
    setError(null)
    
    try {
      // Afficher les valeurs envoyées pour le débogage
      console.log('Valeurs envoyées:', values);
      
      // Générer un slug à partir du nom
      const slug = values.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'boutique-' + Date.now();

      // Préparer les données avec le bon format
      const requestData = {
        name: values.name,
        slug: slug,
        email: values.email,
        phone: values.phone,
        address: {
          city: values.description || 'Non spécifié',
          address: values.description || 'Non spécifié',
        }
      };
      
      console.log('Données envoyées:', requestData);

      const response = await fetch('/api/stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      const data = await response.json()
      console.log('Réponse du serveur:', data);
      
      if (response.ok) {
        setSuccess(true)
        // Redirect to vendor dashboard after a short delay
        setTimeout(() => {
          router.push('/vendor-dashboard')
        }, 2000)
      } else {
        if (data.details) {
          // Afficher les détails des erreurs de validation
          const errorMessages = data.details.map((detail: any) => 
            `${detail.field}: ${detail.message}`
          ).join(', ')
          setError(`${data.error}: ${errorMessages}`)
        } else {
          setError(data.error || `Erreur lors de la création de la boutique (code: ${response.status})`)
        }
      }
    } catch (err) {
      console.error('Erreur complète:', err);
      setError(`Erreur de connexion au serveur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container size="sm" py="xl">
      <Stack gap="xl">
        <Title order={1} ta="center">Créer une boutique</Title>
        <Text c="dimmed" ta="center">
          Créez votre boutique pour commencer à vendre des produits et créer des enchères
        </Text>

        {success ? (
          <Alert 
            icon={<IconAlertCircle size={16} />} 
            title="Succès !" 
            color="green"
          >
            Votre boutique a été créée avec succès et est en attente d'approbation. 
            Redirection vers votre tableau de bord...
            <Loader size="sm" mt="md" />
          </Alert>
        ) : (
          <Card 
            shadow="sm" 
            padding="xl" 
            radius="md" 
            withBorder
          >
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="md">
                <TextInput
                  label="Nom de la boutique *"
                  placeholder="Entrez le nom de votre boutique"
                  {...form.getInputProps('name')}
                  required
                />

                <TextInput
                  label="Email de contact *"
                  placeholder="email@votre-boutique.com"
                  {...form.getInputProps('email')}
                  required
                />

                <TextInput
                  label="Téléphone"
                  placeholder="+212 6 00 00 00 00"
                  {...form.getInputProps('phone')}
                />

                <TextInput
                  label="Description/Ville"
                  placeholder="Décrivez votre boutique ou entrez votre ville"
                  {...form.getInputProps('description')}
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

                <Group justify="center" mt="xl">
                  <Button 
                    type="submit" 
                    size="lg" 
                    loading={loading}
                    disabled={loading}
                  >
                    {loading ? 'Création en cours...' : 'Créer la boutique'}
                  </Button>
                </Group>
                
                <Text size="sm" c="dimmed" ta="center">
                  Tous les champs marqués d&apos;un * sont obligatoires
                </Text>
              </Stack>
            </form>
          </Card>
        )}
      </Stack>
    </Container>
  )
}