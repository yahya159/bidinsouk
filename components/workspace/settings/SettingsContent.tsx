'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Group,
  Stack,
  Card,
  Tabs,
  Button,
  TextInput,
  Textarea,
  FileInput,
  Switch,
  Select,
  PasswordInput,
  Alert,
  Image,
  Grid,
  Divider,
  Badge,
  ActionIcon,
  Modal,
  Checkbox,
} from '@mantine/core';
import {
  Store,
  User,
  Bell,
  Shield,
  CreditCard,
  Upload,
  Save,
  AlertTriangle,
  Check,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'CLIENT' | 'VENDOR' | 'ADMIN';
}

interface StoreSettings {
  name: string;
  description: string;
  logo?: string;
  banner?: string;
  businessHours: {
    [key: string]: {
      open: string;
      close: string;
      closed: boolean;
    };
  };
  shippingPolicy: string;
  returnPolicy: string;
  status: 'ACTIVE' | 'INACTIVE' | 'TEMPORARILY_CLOSED';
}

interface AccountSettings {
  name: string;
  email: string;
  phone: string;
  address: string;
  avatar?: string;
}

interface NotificationSettings {
  emailNotifications: {
    newOrders: boolean;
    newBids: boolean;
    auctionEnding: boolean;
    reviews: boolean;
    marketing: boolean;
  };
  pushNotifications: {
    newOrders: boolean;
    newBids: boolean;
    auctionEnding: boolean;
    reviews: boolean;
  };
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  loginAlerts: boolean;
  sessionTimeout: number;
}

interface SettingsContentProps {
  user: User;
  section?: 'store' | 'account' | 'notifications' | 'security';
}

const daysOfWeek = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' },
];

export function SettingsContent({ user, section = 'store' }: SettingsContentProps) {
  const [activeTab, setActiveTab] = useState(section);
  const [loading, setLoading] = useState(false);
  const [changePasswordModalOpened, { open: openChangePasswordModal, close: closeChangePasswordModal }] = useDisclosure(false);

  // Store settings form
  const storeForm = useForm<StoreSettings>({
    initialValues: {
      name: 'Ma Boutique',
      description: 'Description de ma boutique...',
      logo: '',
      banner: '',
      businessHours: {
        monday: { open: '09:00', close: '18:00', closed: false },
        tuesday: { open: '09:00', close: '18:00', closed: false },
        wednesday: { open: '09:00', close: '18:00', closed: false },
        thursday: { open: '09:00', close: '18:00', closed: false },
        friday: { open: '09:00', close: '18:00', closed: false },
        saturday: { open: '09:00', close: '17:00', closed: false },
        sunday: { open: '10:00', close: '16:00', closed: true },
      },
      shippingPolicy: 'Livraison gratuite pour les commandes supérieures à 500 MAD.',
      returnPolicy: 'Retours acceptés dans les 14 jours suivant la réception.',
      status: 'ACTIVE',
    },
  });

  // Account settings form
  const accountForm = useForm<AccountSettings>({
    initialValues: {
      name: user.name,
      email: user.email,
      phone: '',
      address: '',
      avatar: '',
    },
  });

  // Notification settings form
  const notificationForm = useForm<NotificationSettings>({
    initialValues: {
      emailNotifications: {
        newOrders: true,
        newBids: true,
        auctionEnding: true,
        reviews: true,
        marketing: false,
      },
      pushNotifications: {
        newOrders: true,
        newBids: true,
        auctionEnding: true,
        reviews: false,
      },
    },
  });

  // Security settings form
  const securityForm = useForm<SecuritySettings>({
    initialValues: {
      twoFactorEnabled: false,
      loginAlerts: true,
      sessionTimeout: 30,
    },
  });

  // Password change form
  const passwordForm = useForm({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validate: {
      newPassword: (value) => (value.length < 8 ? 'Le mot de passe doit contenir au moins 8 caractères' : null),
      confirmPassword: (value, values) => 
        value !== values.newPassword ? 'Les mots de passe ne correspondent pas' : null,
    },
  });

  const handleSaveStoreSettings = async (values: StoreSettings) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/vendors/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'store',
          data: values,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save store settings');
      }

      const result = await response.json();
      
      notifications.show({
        title: 'Paramètres sauvegardés',
        message: result.message || 'Les paramètres de votre boutique ont été mis à jour',
        color: 'green',
      });
    } catch (error: any) {
      notifications.show({
        title: 'Erreur',
        message: error.message || 'Impossible de sauvegarder les paramètres',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAccountSettings = async (values: AccountSettings) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/vendors/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'account',
          data: values,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save account settings');
      }

      const result = await response.json();
      
      notifications.show({
        title: 'Profil mis à jour',
        message: result.message || 'Vos informations personnelles ont été mises à jour',
        color: 'green',
      });
    } catch (error: any) {
      notifications.show({
        title: 'Erreur',
        message: error.message || 'Impossible de mettre à jour le profil',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotificationSettings = async (values: NotificationSettings) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/vendors/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'notifications',
          data: values,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save notification settings');
      }

      const result = await response.json();
      
      notifications.show({
        title: 'Préférences sauvegardées',
        message: result.message || 'Vos préférences de notification ont été mises à jour',
        color: 'green',
      });
    } catch (error: any) {
      notifications.show({
        title: 'Erreur',
        message: error.message || 'Impossible de sauvegarder les préférences',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSecuritySettings = async (values: SecuritySettings) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/vendors/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'security',
          data: values,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save security settings');
      }

      const result = await response.json();
      
      notifications.show({
        title: 'Sécurité mise à jour',
        message: result.message || 'Vos paramètres de sécurité ont été mis à jour',
        color: 'green',
      });
    } catch (error: any) {
      notifications.show({
        title: 'Erreur',
        message: error.message || 'Impossible de mettre à jour la sécurité',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (values: any) => {
    try {
      setLoading(true);
      // API call would go here
      console.log('Changing password');
      
      notifications.show({
        title: 'Mot de passe modifié',
        message: 'Votre mot de passe a été mis à jour avec succès',
        color: 'green',
      });
      
      passwordForm.reset();
      closeChangePasswordModal();
    } catch (error) {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de modifier le mot de passe',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between">
          <div>
            <Title order={1} size="2rem" mb="xs">
              Paramètres
            </Title>
            <Text c="dimmed" size="lg">
              Gérez vos paramètres de boutique et de compte
            </Text>
          </div>
        </Group>

          {/* Settings Tabs */}
          <Tabs value={activeTab} onChange={(value) => setActiveTab(value as typeof activeTab)}>
            <Tabs.List>
              {user.role === 'VENDOR' && (
                <Tabs.Tab value="store" leftSection={<Store size={16} />}>
                  Boutique
                </Tabs.Tab>
              )}
              <Tabs.Tab value="account" leftSection={<User size={16} />}>
                Compte
              </Tabs.Tab>
              <Tabs.Tab value="notifications" leftSection={<Bell size={16} />}>
                Notifications
              </Tabs.Tab>
              <Tabs.Tab value="security" leftSection={<Shield size={16} />}>
                Sécurité
              </Tabs.Tab>
              {user.role === 'VENDOR' && (
                <Tabs.Tab value="payment" leftSection={<CreditCard size={16} />}>
                  Paiements
                </Tabs.Tab>
              )}
            </Tabs.List>

            {/* Store Settings */}
            {user.role === 'VENDOR' && (
              <Tabs.Panel value="store" pt="md">
                <Stack gap="lg">
                  {/* Boutique Creation Section */}
                  <Card shadow="sm" padding="lg" radius="md" withBorder style={{ background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)' }}>
                    <Group justify="space-between" align="center">
                      <div>
                        <Title order={3} mb="xs" c="blue">
                          🏪 Créer une nouvelle boutique
                        </Title>
                        <Text size="sm" c="dimmed" mb="md">
                          Lancez votre boutique en ligne et commencez à vendre vos produits sur Bidinsouk
                        </Text>
                        <Group gap="xs">
                          <Badge color="green" variant="light">Gratuit</Badge>
                          <Badge color="blue" variant="light">Configuration rapide</Badge>
                          <Badge color="orange" variant="light">Support inclus</Badge>
                        </Group>
                      </div>
                      <Button
                        size="lg"
                        variant="gradient"
                        gradient={{ from: 'blue', to: 'purple' }}
                        leftSection={<Store size={20} />}
                        onClick={() => {
                          // Navigate to boutique creation
                          window.location.href = '/vendors/apply';
                        }}
                      >
                        Créer ma boutique
                      </Button>
                    </Group>
                  </Card>

                  <form onSubmit={storeForm.onSubmit(handleSaveStoreSettings)}>
                    <Stack gap="lg">
                      <Card shadow="sm" padding="lg" radius="md" withBorder>
                        <Title order={3} mb="md">Informations de la boutique</Title>
                      
                      <Grid>
                        <Grid.Col span={{ base: 12, md: 6 }}>
                          <TextInput
                            label="Nom de la boutique"
                            placeholder="Ma Boutique"
                            required
                            {...storeForm.getInputProps('name')}
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 6 }}>
                          <Select
                            label="Statut de la boutique"
                            data={[
                              { value: 'ACTIVE', label: 'Active' },
                              { value: 'INACTIVE', label: 'Inactive' },
                              { value: 'TEMPORARILY_CLOSED', label: 'Temporairement fermée' },
                            ]}
                            {...storeForm.getInputProps('status')}
                          />
                        </Grid.Col>
                      </Grid>

                      <Textarea
                        label="Description"
                        placeholder="Décrivez votre boutique..."
                        minRows={3}
                        mt="md"
                        {...storeForm.getInputProps('description')}
                      />

                      <Grid mt="md">
                        <Grid.Col span={{ base: 12, md: 6 }}>
                          <FileInput
                            label="Logo de la boutique"
                            placeholder="Choisir un fichier"
                            leftSection={<Upload size={16} />}
                            accept="image/*"
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 6 }}>
                          <FileInput
                            label="Bannière de la boutique"
                            placeholder="Choisir un fichier"
                            leftSection={<Upload size={16} />}
                            accept="image/*"
                          />
                        </Grid.Col>
                      </Grid>
                    </Card>

                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                      <Title order={3} mb="md">Horaires d'ouverture</Title>
                      
                      <Stack gap="md">
                        {daysOfWeek.map((day) => (
                          <Group key={day.key} justify="space-between">
                            <Text fw={500} style={{ minWidth: 100 }}>
                              {day.label}
                            </Text>
                            <Group gap="sm">
                              <Switch
                                label="Fermé"
                                checked={storeForm.values.businessHours[day.key]?.closed}
                                onChange={(event) =>
                                  storeForm.setFieldValue(
                                    `businessHours.${day.key}.closed`,
                                    event.currentTarget.checked
                                  )
                                }
                              />
                              {!storeForm.values.businessHours[day.key]?.closed && (
                                <>
                                  <TextInput
                                    type="time"
                                    placeholder="09:00"
                                    value={storeForm.values.businessHours[day.key]?.open}
                                    onChange={(event) =>
                                      storeForm.setFieldValue(
                                        `businessHours.${day.key}.open`,
                                        event.currentTarget.value
                                      )
                                    }
                                  />
                                  <Text>à</Text>
                                  <TextInput
                                    type="time"
                                    placeholder="18:00"
                                    value={storeForm.values.businessHours[day.key]?.close}
                                    onChange={(event) =>
                                      storeForm.setFieldValue(
                                        `businessHours.${day.key}.close`,
                                        event.currentTarget.value
                                      )
                                    }
                                  />
                                </>
                              )}
                            </Group>
                          </Group>
                        ))}
                      </Stack>
                    </Card>

                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                      <Title order={3} mb="md">Politiques</Title>
                      
                      <Textarea
                        label="Politique de livraison"
                        placeholder="Décrivez votre politique de livraison..."
                        minRows={3}
                        mb="md"
                        {...storeForm.getInputProps('shippingPolicy')}
                      />

                      <Textarea
                        label="Politique de retour"
                        placeholder="Décrivez votre politique de retour..."
                        minRows={3}
                        {...storeForm.getInputProps('returnPolicy')}
                      />
                    </Card>

                      <Group justify="flex-end">
                        <Button
                          type="submit"
                          leftSection={<Save size={16} />}
                          loading={loading}
                        >
                          Sauvegarder les paramètres
                        </Button>
                      </Group>
                    </Stack>
                  </form>
                </Stack>
              </Tabs.Panel>
            )}

            {/* Account Settings */}
            <Tabs.Panel value="account" pt="md">
              <form onSubmit={accountForm.onSubmit(handleSaveAccountSettings)}>
                <Stack gap="lg">
                  <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Title order={3} mb="md">Informations personnelles</Title>
                    
                    <Grid>
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <TextInput
                          label="Nom complet"
                          placeholder="Votre nom"
                          required
                          {...accountForm.getInputProps('name')}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <TextInput
                          label="Email"
                          placeholder="votre@email.com"
                          required
                          type="email"
                          {...accountForm.getInputProps('email')}
                        />
                      </Grid.Col>
                    </Grid>

                    <Grid mt="md">
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <TextInput
                          label="Téléphone"
                          placeholder="+212 6XX XXX XXX"
                          {...accountForm.getInputProps('phone')}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <FileInput
                          label="Photo de profil"
                          placeholder="Choisir une photo"
                          leftSection={<Upload size={16} />}
                          accept="image/*"
                        />
                      </Grid.Col>
                    </Grid>

                    <Textarea
                      label="Adresse"
                      placeholder="Votre adresse complète"
                      minRows={2}
                      mt="md"
                      {...accountForm.getInputProps('address')}
                    />
                  </Card>

                  <Group justify="flex-end">
                    <Button
                      type="submit"
                      leftSection={<Save size={16} />}
                      loading={loading}
                    >
                      Mettre à jour le profil
                    </Button>
                  </Group>
                </Stack>
              </form>
            </Tabs.Panel>

            {/* Notification Settings */}
            <Tabs.Panel value="notifications" pt="md">
              <form onSubmit={notificationForm.onSubmit(handleSaveNotificationSettings)}>
                <Stack gap="lg">
                  <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Title order={3} mb="md">Notifications par email</Title>
                    
                    <Stack gap="md">
                      <Checkbox
                        label="Nouvelles commandes"
                        description="Recevoir un email pour chaque nouvelle commande"
                        {...notificationForm.getInputProps('emailNotifications.newOrders', { type: 'checkbox' })}
                      />
                      <Checkbox
                        label="Nouvelles enchères"
                        description="Recevoir un email pour chaque nouvelle enchère sur vos produits"
                        {...notificationForm.getInputProps('emailNotifications.newBids', { type: 'checkbox' })}
                      />
                      <Checkbox
                        label="Enchères se terminant"
                        description="Recevoir un email quand vos enchères se terminent bientôt"
                        {...notificationForm.getInputProps('emailNotifications.auctionEnding', { type: 'checkbox' })}
                      />
                      <Checkbox
                        label="Nouveaux avis"
                        description="Recevoir un email pour chaque nouvel avis client"
                        {...notificationForm.getInputProps('emailNotifications.reviews', { type: 'checkbox' })}
                      />
                      <Checkbox
                        label="Emails marketing"
                        description="Recevoir nos newsletters et offres promotionnelles"
                        {...notificationForm.getInputProps('emailNotifications.marketing', { type: 'checkbox' })}
                      />
                    </Stack>
                  </Card>

                  <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Title order={3} mb="md">Notifications push</Title>
                    
                    <Stack gap="md">
                      <Checkbox
                        label="Nouvelles commandes"
                        description="Recevoir une notification push pour chaque nouvelle commande"
                        {...notificationForm.getInputProps('pushNotifications.newOrders', { type: 'checkbox' })}
                      />
                      <Checkbox
                        label="Nouvelles enchères"
                        description="Recevoir une notification push pour chaque nouvelle enchère"
                        {...notificationForm.getInputProps('pushNotifications.newBids', { type: 'checkbox' })}
                      />
                      <Checkbox
                        label="Enchères se terminant"
                        description="Recevoir une notification push quand vos enchères se terminent bientôt"
                        {...notificationForm.getInputProps('pushNotifications.auctionEnding', { type: 'checkbox' })}
                      />
                      <Checkbox
                        label="Nouveaux avis"
                        description="Recevoir une notification push pour chaque nouvel avis client"
                        {...notificationForm.getInputProps('pushNotifications.reviews', { type: 'checkbox' })}
                      />
                    </Stack>
                  </Card>

                  <Group justify="flex-end">
                    <Button
                      type="submit"
                      leftSection={<Save size={16} />}
                      loading={loading}
                    >
                      Sauvegarder les préférences
                    </Button>
                  </Group>
                </Stack>
              </form>
            </Tabs.Panel>

            {/* Security Settings */}
            <Tabs.Panel value="security" pt="md">
              <form onSubmit={securityForm.onSubmit(handleSaveSecuritySettings)}>
                <Stack gap="lg">
                  <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Title order={3} mb="md">Mot de passe</Title>
                    
                    <Group justify="space-between">
                      <div>
                        <Text fw={500}>Changer le mot de passe</Text>
                        <Text size="sm" c="dimmed">
                          Dernière modification il y a 30 jours
                        </Text>
                      </div>
                      <Button variant="outline" onClick={openChangePasswordModal}>
                        Modifier
                      </Button>
                    </Group>
                  </Card>

                  <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Title order={3} mb="md">Authentification à deux facteurs</Title>
                    
                    <Group justify="space-between" mb="md">
                      <div>
                        <Text fw={500}>Authentification à deux facteurs (2FA)</Text>
                        <Text size="sm" c="dimmed">
                          Ajoutez une couche de sécurité supplémentaire à votre compte
                        </Text>
                      </div>
                      <Switch
                        size="lg"
                        {...securityForm.getInputProps('twoFactorEnabled', { type: 'checkbox' })}
                      />
                    </Group>

                    {securityForm.values.twoFactorEnabled && (
                      <Alert color="green" variant="light">
                        <Text size="sm">
                          L'authentification à deux facteurs est activée. Vous recevrez un code par SMS à chaque connexion.
                        </Text>
                      </Alert>
                    )}
                  </Card>

                  <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Title order={3} mb="md">Sécurité de session</Title>
                    
                    <Stack gap="md">
                      <Group justify="space-between">
                        <div>
                          <Text fw={500}>Alertes de connexion</Text>
                          <Text size="sm" c="dimmed">
                            Recevoir un email lors de nouvelles connexions
                          </Text>
                        </div>
                        <Switch
                          {...securityForm.getInputProps('loginAlerts', { type: 'checkbox' })}
                        />
                      </Group>

                      <div>
                        <Text fw={500} mb="xs">Délai d'expiration de session</Text>
                        <Select
                          data={[
                            { value: '15', label: '15 minutes' },
                            { value: '30', label: '30 minutes' },
                            { value: '60', label: '1 heure' },
                            { value: '120', label: '2 heures' },
                            { value: '480', label: '8 heures' },
                          ]}
                          {...securityForm.getInputProps('sessionTimeout')}
                        />
                      </div>
                    </Stack>
                  </Card>

                  <Group justify="flex-end">
                    <Button
                      type="submit"
                      leftSection={<Save size={16} />}
                      loading={loading}
                    >
                      Sauvegarder la sécurité
                    </Button>
                  </Group>
                </Stack>
              </form>
            </Tabs.Panel>

            {/* Payment Settings */}
            {user.role === 'VENDOR' && (
              <Tabs.Panel value="payment" pt="md">
                <Stack gap="lg">
                  <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Title order={3} mb="md">Méthodes de paiement</Title>
                    
                    <Alert color="blue" variant="light" mb="md">
                      <Text size="sm">
                        Configurez vos méthodes de paiement pour recevoir vos revenus de vente.
                      </Text>
                    </Alert>

                    <Stack gap="md">
                      <TextInput
                        label="Numéro de compte bancaire"
                        placeholder="IBAN ou RIB"
                      />
                      <TextInput
                        label="Nom de la banque"
                        placeholder="Nom de votre banque"
                      />
                      <TextInput
                        label="Code SWIFT/BIC"
                        placeholder="Code SWIFT"
                      />
                    </Stack>
                  </Card>

                  <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Title order={3} mb="md">Informations fiscales</Title>
                    
                    <Stack gap="md">
                      <TextInput
                        label="Numéro d'identification fiscale"
                        placeholder="Votre NIF"
                      />
                      <TextInput
                        label="Registre de commerce"
                        placeholder="Numéro RC"
                      />
                      <Textarea
                        label="Adresse de facturation"
                        placeholder="Adresse complète pour la facturation"
                        minRows={2}
                      />
                    </Stack>
                  </Card>

                  <Group justify="flex-end">
                    <Button leftSection={<Save size={16} />}>
                      Sauvegarder les informations
                    </Button>
                  </Group>
                </Stack>
              </Tabs.Panel>
            )}
          </Tabs>
      </Stack>

      {/* Change Password Modal */}
      <Modal
        opened={changePasswordModalOpened}
        onClose={closeChangePasswordModal}
        title="Changer le mot de passe"
        size="md"
      >
        <form onSubmit={passwordForm.onSubmit(handleChangePassword)}>
          <Stack gap="md">
            <PasswordInput
              label="Mot de passe actuel"
              placeholder="Votre mot de passe actuel"
              required
              {...passwordForm.getInputProps('currentPassword')}
            />
            
            <PasswordInput
              label="Nouveau mot de passe"
              placeholder="Nouveau mot de passe"
              required
              {...passwordForm.getInputProps('newPassword')}
            />
            
            <PasswordInput
              label="Confirmer le nouveau mot de passe"
              placeholder="Confirmez le nouveau mot de passe"
              required
              {...passwordForm.getInputProps('confirmPassword')}
            />

            <Group justify="flex-end" gap="sm">
              <Button variant="outline" onClick={closeChangePasswordModal}>
                Annuler
              </Button>
              <Button type="submit" loading={loading}>
                Changer le mot de passe
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}