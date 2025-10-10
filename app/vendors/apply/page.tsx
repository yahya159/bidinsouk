'use client'

import { Container, Title, Text, Paper, Stack, Button, Alert, Loader } from '@mantine/core'
import { useForm, isNotEmpty } from '@mantine/form'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function VendorApplicationPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const { data: session, status } = useSession()
  const [redirectToDashboard, setRedirectToDashboard] = useState(false)

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
      acceptTerms: (value) => (value === true ? null : 'Vous devez accepter les conditions'),
    },
  })

  // Rediriger les utilisateurs non authentifiés vers la page de connexion
  // et pré-remplir le formulaire avec les informations de l'utilisateur
  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
    } else {
      // Ne pré-remplir le formulaire que s'il est vide
      if (!form.values.name && !form.values.email) {
        form.setValues({
          name: session.user?.name || '',
          email: session.user?.email || '',
          phone: '',
          businessName: '',
          businessType: '',
          description: '',
          acceptTerms: false,
        })
      }
    }
  }, [session, status, router]) // Supprimé 'form' des dépendances

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true)
    setError(null)
    
    // Validation supplémentaire côté client
    if (!values.acceptTerms) {
      form.setFieldError('acceptTerms', 'Vous devez accepter les conditions');
      setLoading(false);
      return;
    }
    
    // Vérifier que tous les champs requis sont remplis
    const requiredFields = ['name', 'email', 'phone', 'businessName', 'businessType', 'description'];
    let hasMissingField = false;
    
    requiredFields.forEach(field => {
      if (!values[field as keyof typeof values]) {
        form.setFieldError(field, `Le champ ${field} est requis`);
        hasMissingField = true;
      }
    });
    
    if (hasMissingField) {
      setError('Veuillez remplir tous les champs obligatoires');
      setLoading(false);
      return;
    }
    
    try {
      // Log des valeurs du formulaire pour le débogage
      console.log('Valeurs du formulaire:', values);
      
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
      console.log('Réponse de l\'API:', data);
      
      if (response.ok) {
        setSuccess(true)
        // Redirect to vendor dashboard after a short delay
        setTimeout(() => {
          router.push('/vendor-dashboard')
        }, 2000)
      } else {
        if (data.error === 'Vous êtes déjà un vendeur avec ce compte') {
          setError('Vous êtes déjà enregistré comme vendeur. Vous allez être redirigé vers votre tableau de bord.')
          setRedirectToDashboard(true)
          // Rediriger automatiquement vers le tableau de bord vendeur
          setTimeout(() => {
            router.push('/vendor-dashboard')
          }, 3000)
        } else if (data.details) {
          // Afficher les détails des erreurs de validation
          const errorMessages = data.details.map((detail: any) => 
            `${detail.field}: ${detail.message}`
          ).join(', ')
          setError(`${data.error}: ${errorMessages}`)
        } else {
          setError(data.error || 'Erreur lors de la soumission du formulaire')
        }
      }
    } catch (err) {
      console.error('Erreur de connexion:', err);
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  // Rediriger automatiquement si nécessaire
  useEffect(() => {
    if (redirectToDashboard) {
      const timer = setTimeout(() => {
        router.push('/vendor-dashboard')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [redirectToDashboard, router])

  // Afficher un indicateur de chargement pendant l'authentification
  if (status === 'loading') {
    return (
      <Container size="sm" py="xl">
        <Paper shadow="md" p="xl" radius="md">
          <Stack align="center">
            <Title order={2} ta="center">Chargement...</Title>
            <Loader />
          </Stack>
        </Paper>
      </Container>
    )
  }

  // Si l'utilisateur n'est pas connecté, il sera redirigé
  if (!session) {
    return null
  }

  if (success || redirectToDashboard) {
    return (
      <Container size="sm" py="xl">
        <Paper shadow="md" p="xl" radius="md">
          <Stack align="center">
            <Title order={2} ta="center">
              {redirectToDashboard 
                ? "Redirection vers votre tableau de bord..." 
                : "Demande soumise avec succès!"}
            </Title>
            <Text ta="center">
              {redirectToDashboard
                ? "Vous êtes déjà enregistré comme vendeur. Redirection vers votre tableau de bord..."
                : "Votre demande pour devenir vendeur a été soumise. Vous serez redirigé vers votre tableau de bord."}
            </Text>
            <Text ta="center" mt="md">
              {redirectToDashboard
                ? "Vous n'avez pas encore de boutique ? Créez-en une depuis votre tableau de bord."
                : "Une fois approuvé, vous devrez créer votre boutique depuis votre tableau de bord vendeur."}
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
                      style={{ 
                        padding: '12px', 
                        borderRadius: '8px', 
                        border: `1px solid ${form.errors.name ? '#fa5252' : '#ced4da'}`,
                        backgroundColor: form.errors.name ? '#fff5f5' : 'white'
                      }}
                    />
                    {form.errors.name && (
                      <Text size="sm" c="red">{form.errors.name}</Text>
                    )}
                  </Stack>

                  <Stack gap="xs">
                    <label htmlFor="email">Email *</label>
                    <input
                      id="email"
                      {...form.getInputProps('email')}
                      placeholder="votre@email.com"
                      style={{ 
                        padding: '12px', 
                        borderRadius: '8px', 
                        border: `1px solid ${form.errors.email ? '#fa5252' : '#ced4da'}`,
                        backgroundColor: form.errors.email ? '#fff5f5' : 'white'
                      }}
                    />
                    {form.errors.email && (
                      <Text size="sm" c="red">{form.errors.email}</Text>
                    )}
                  </Stack>

                  <Stack gap="xs">
                    <label htmlFor="phone">Téléphone *</label>
                    <input
                      id="phone"
                      {...form.getInputProps('phone')}
                      placeholder="+212 6 00 00 00 00"
                      style={{ 
                        padding: '12px', 
                        borderRadius: '8px', 
                        border: `1px solid ${form.errors.phone ? '#fa5252' : '#ced4da'}`,
                        backgroundColor: form.errors.phone ? '#fff5f5' : 'white'
                      }}
                    />
                    {form.errors.phone && (
                      <Text size="sm" c="red">{form.errors.phone}</Text>
                    )}
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
                      style={{ 
                        padding: '12px', 
                        borderRadius: '8px', 
                        border: `1px solid ${form.errors.businessName ? '#fa5252' : '#ced4da'}`,
                        backgroundColor: form.errors.businessName ? '#fff5f5' : 'white'
                      }}
                    />
                    {form.errors.businessName && (
                      <Text size="sm" c="red">{form.errors.businessName}</Text>
                    )}
                  </Stack>

                  <Stack gap="xs">
                    <label htmlFor="businessType">Type d'entreprise *</label>
                    <select
                      id="businessType"
                      {...form.getInputProps('businessType')}
                      style={{ 
                        padding: '12px', 
                        borderRadius: '8px', 
                        border: `1px solid ${form.errors.businessType ? '#fa5252' : '#ced4da'}`,
                        backgroundColor: form.errors.businessType ? '#fff5f5' : 'white'
                      }}
                    >
                      <option value="">Sélectionnez un type</option>
                      <option value="individual">Particulier</option>
                      <option value="sarl">SARL</option>
                      <option value="sas">SAS</option>
                      <option value="sasu">SASU</option>
                      <option value="sa">SA</option>
                      <option value="other">Autre</option>
                    </select>
                    {form.errors.businessType && (
                      <Text size="sm" c="red">{form.errors.businessType}</Text>
                    )}
                  </Stack>

                  <Stack gap="xs">
                    <label htmlFor="description">Description de votre activité *</label>
                    <textarea
                      id="description"
                      {...form.getInputProps('description')}
                      placeholder="Décrivez votre activité, les produits que vous souhaitez vendre..."
                      rows={4}
                      style={{ 
                        padding: '12px', 
                        borderRadius: '8px', 
                        border: `1px solid ${form.errors.description ? '#fa5252' : '#ced4da'}`,
                        backgroundColor: form.errors.description ? '#fff5f5' : 'white'
                      }}
                    />
                    {form.errors.description && (
                      <Text size="sm" c="red">{form.errors.description}</Text>
                    )}
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
                {form.errors.acceptTerms && (
                  <Text size="sm" c="red" mt={4}>
                    {form.errors.acceptTerms}
                  </Text>
                )}
              </Stack>

              <Button 
                type="submit" 
                loading={loading}
                fullWidth
                size="md"
                style={{ 
                  backgroundColor: '#228be6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1c7ed6'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#228be6'}
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