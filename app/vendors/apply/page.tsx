'use client'

import { Container, Title, Text, Paper, Stack, Button, Alert, Loader } from '@mantine/core'
import { useForm, isNotEmpty } from '@mantine/form'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function VendorApplicationPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

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
      name: isNotEmpty('Le nom est requis'),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Email invalide'),
      phone: isNotEmpty('Le numéro de téléphone est requis'),
      businessName: isNotEmpty('Le nom de votre entreprise est requis'),
      businessType: isNotEmpty('Le type de votre entreprise est requis'),
      description: isNotEmpty('Une description de votre activité est requise'),
      acceptTerms: (value) => (value ? null : 'Vous devez accepter les conditions'),
    },
  })

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true)
    setError(null)
    
    try {
      // In a real application, you would send the form data to your API
      // For now, we'll simulate the API call
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
        // Redirect to vendor dashboard after a short delay
        setTimeout(() => {
          router.push('/vendor-dashboard')
        }, 2000)
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
      <Container size="sm" py="xl">
        <Paper shadow="md" p="xl" radius="md">
          <Stack align="center">
            <Title order={2} ta="center">Demande soumise avec succès!</Title>
            <Text ta="center">
              Votre demande pour devenir vendeur a été soumise. 
              Vous serez redirigé vers votre tableau de bord.
            </Text>
            <Loader />
          </Stack>
        </Paper>
      </Container>
    )
  }

  return (
    <Container size="sm" py="xl">
      <Paper shadow="md" p="xl" radius="md">
        <Stack>
          <Title order={1} ta="center">Devenir vendeur</Title>
          <Text c="dimmed" ta="center">
            Remplissez le formulaire ci-dessous pour soumettre votre demande
          </Text>

          {error && (
            <Alert title="Erreur" color="red">
              {error}
            </Alert>
          )}

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              <Stack gap="xs">
                <Text fw={500}>Informations personnelles</Text>
                <Stack gap="sm">
                  <Stack gap="xs">
                    <label htmlFor="name">Nom complet *</label>
                    <input
                      id="name"
                      {...form.getInputProps('name')}
                      placeholder="Votre nom complet"
                      style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                  </Stack>

                  <Stack gap="xs">
                    <label htmlFor="email">Email *</label>
                    <input
                      id="email"
                      {...form.getInputProps('email')}
                      placeholder="votre@email.com"
                      style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                  </Stack>

                  <Stack gap="xs">
                    <label htmlFor="phone">Téléphone *</label>
                    <input
                      id="phone"
                      {...form.getInputProps('phone')}
                      placeholder="+212 6 00 00 00 00"
                      style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                  </Stack>
                </Stack>
              </Stack>

              <Stack gap="xs">
                <Text fw={500}>Informations sur l'entreprise</Text>
                <Stack gap="sm">
                  <Stack gap="xs">
                    <label htmlFor="businessName">Nom de l'entreprise *</label>
                    <input
                      id="businessName"
                      {...form.getInputProps('businessName')}
                      placeholder="Nom de votre entreprise"
                      style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                  </Stack>

                  <Stack gap="xs">
                    <label htmlFor="businessType">Type d'entreprise *</label>
                    <select
                      id="businessType"
                      {...form.getInputProps('businessType')}
                      style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    >
                      <option value="">Sélectionnez un type</option>
                      <option value="individual">Particulier</option>
                      <option value="sarl">SARL</option>
                      <option value="sas">SAS</option>
                      <option value="sasu">SASU</option>
                      <option value="sa">SA</option>
                      <option value="other">Autre</option>
                    </select>
                  </Stack>

                  <Stack gap="xs">
                    <label htmlFor="description">Description de votre activité *</label>
                    <textarea
                      id="description"
                      {...form.getInputProps('description')}
                      placeholder="Décrivez votre activité, les produits que vous souhaitez vendre..."
                      rows={4}
                      style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                  </Stack>
                </Stack>
              </Stack>

              <Stack gap="xs">
                <label>
                  <input
                    type="checkbox"
                    {...form.getInputProps('acceptTerms', { type: 'checkbox' })}
                    style={{ marginRight: '8px' }}
                  />
                  J'accepte les <a href="/terms" target="_blank">conditions générales</a> *
                </label>
              </Stack>

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
        </Stack>
      </Paper>
    </Container>
  )
}