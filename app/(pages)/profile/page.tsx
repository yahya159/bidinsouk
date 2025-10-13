'use client';

import { 
  Button, 
  Card, 
  Title, 
  Text, 
  Container, 
  Avatar, 
  Badge, 
  Group, 
  Stack, 
  Box, 
  SimpleGrid,
  TextInput,
  Textarea,
  FileInput,
  Grid,
  Divider,
  ActionIcon,
  Modal,
  Tabs
} from '@mantine/core';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Edit, 
  Save, 
  Upload,
  Calendar,
  Trophy,
  ShoppingBag,
  Star,
  Activity
} from 'lucide-react';
import { useState } from 'react';

import { useSession } from 'next-auth/react';

export default function ProfilePage() {
  const { data: session } = useSession()
  
  // Utility function to format numbers consistently
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  }
  
  // Enhanced user data - in a real app this would come from an API
  const user = {
    id: 1,
    name: "Karim Benamar",
    email: "karim.benamar@example.com",
    phone: "+212 6 12 34 56 78",
    address: "123 Rue Mohammed V, Casablanca, Maroc",
    role: "CLIENT",
    createdAt: new Date("2024-01-15"),
    avatar: "",
    bio: "Passionné de technologie et collectionneur d'objets vintage. J'aime participer aux enchères pour trouver des pièces uniques.",
    stats: {
      auctionsWon: 12,
      productsBought: 8,
      reviewsWritten: 5,
      totalSpent: 15420,
      membershipDays: 302 // Static value to avoid hydration issues
    },
    preferences: {
      notifications: true,
      newsletter: false,
      publicProfile: true
    }
  }

  return (
    <Container size="xl" py="xl">
        <Group justify="space-between" align="center" mb="xl">
          <div>
            <Title order={1} size="2rem" mb="xs">
              Mon Profil
            </Title>
            <Text c="dimmed" size="lg">
              Gérez vos informations personnelles et votre activité
            </Text>
          </div>
          <Button leftSection={<Edit size={16} />} variant="outline">
            Modifier le profil
          </Button>
        </Group>
        
        <Tabs defaultValue="overview">
          <Tabs.List mb="xl">
            <Tabs.Tab value="overview" leftSection={<User size={16} />}>
              Vue d'ensemble
            </Tabs.Tab>
            <Tabs.Tab value="personal" leftSection={<User size={16} />}>
              Informations personnelles
            </Tabs.Tab>
            <Tabs.Tab value="activity" leftSection={<Activity size={16} />}>
              Activité
            </Tabs.Tab>
          </Tabs.List>

          {/* Overview Tab */}
          <Tabs.Panel value="overview">
            <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="xl">
              {/* Profile Card */}
              <Card shadow="sm" padding="xl" radius="md" withBorder>
                <Stack align="center">
                  <Avatar size={120} radius="xl" color="blue">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </Avatar>
                  <div style={{ textAlign: 'center' }}>
                    <Title order={2} mb="xs">{user.name}</Title>
                    <Text size="sm" c="dimmed" mb="xs">{user.email}</Text>
                    <Badge color="blue" size="lg">{user.role}</Badge>
                  </div>
                  
                  <Divider w="100%" />
                  
                  <Box w="100%">
                    <Group justify="space-between" mb="xs">
                      <Text size="sm" c="dimmed">Membre depuis</Text>
                      <Text fw={500}>{user.stats.membershipDays} jours</Text>
                    </Group>
                    <Group justify="space-between" mb="xs">
                      <Text size="sm" c="dimmed">Total dépensé</Text>
                      <Text fw={500} c="green">{formatNumber(user.stats.totalSpent)} MAD</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Statut</Text>
                      <Badge color="green" variant="light">Actif</Badge>
                    </Group>
                  </Box>
                </Stack>
              </Card>
              
              {/* Stats Grid */}
              <div style={{ gridColumn: 'span 2' }}>
                <SimpleGrid cols={{ base: 2, md: 4 }} spacing="lg" mb="xl">
                  <Card padding="lg" ta="center" withBorder>
                    <Trophy size={32} style={{ margin: '0 auto 8px', color: '#ffd43b' }} />
                    <Title order={2} c="orange">{user.stats.auctionsWon}</Title>
                    <Text size="sm" c="dimmed">Enchères gagnées</Text>
                  </Card>
                  
                  <Card padding="lg" ta="center" withBorder>
                    <ShoppingBag size={32} style={{ margin: '0 auto 8px', color: '#51cf66' }} />
                    <Title order={2} c="green">{user.stats.productsBought}</Title>
                    <Text size="sm" c="dimmed">Produits achetés</Text>
                  </Card>
                  
                  <Card padding="lg" ta="center" withBorder>
                    <Star size={32} style={{ margin: '0 auto 8px', color: '#339af0' }} />
                    <Title order={2} c="blue">{user.stats.reviewsWritten}</Title>
                    <Text size="sm" c="dimmed">Avis écrits</Text>
                  </Card>
                  
                  <Card padding="lg" ta="center" withBorder>
                    <Calendar size={32} style={{ margin: '0 auto 8px', color: '#9775fa' }} />
                    <Title order={2} c="violet">{user.stats.membershipDays}</Title>
                    <Text size="sm" c="dimmed">Jours membre</Text>
                  </Card>
                </SimpleGrid>
                
                {/* Recent Activity */}
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Title order={3} mb="md">Activités récentes</Title>
                  <Stack gap="md">
                    <Group p="md" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                      <Avatar size={48} radius="md" color="green">
                        <Trophy size={24} />
                      </Avatar>
                      <div>
                        <Text fw={500}>Enchère gagnée: iPhone 15 Pro</Text>
                        <Text size="sm" c="dimmed">Remporté pour 8,500 MAD • Il y a 2 jours</Text>
                      </div>
                    </Group>
                    
                    <Group p="md" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                      <Avatar size={48} radius="md" color="blue">
                        <Star size={24} />
                      </Avatar>
                      <div>
                        <Text fw={500}>Avis publié: Casque Audio Sony</Text>
                        <Text size="sm" c="dimmed">Note: 5/5 étoiles • Il y a 1 semaine</Text>
                      </div>
                    </Group>
                    
                    <Group p="md" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                      <Avatar size={48} radius="md" color="orange">
                        <ShoppingBag size={24} />
                      </Avatar>
                      <div>
                        <Text fw={500}>Produit acheté: Montre Apple Watch</Text>
                        <Text size="sm" c="dimmed">Achat immédiat pour 3,200 MAD • Il y a 2 semaines</Text>
                      </div>
                    </Group>
                  </Stack>
                </Card>
              </div>
            </SimpleGrid>
          </Tabs.Panel>

          {/* Personal Information Tab */}
          <Tabs.Panel value="personal">
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Title order={3} mb="md">Informations personnelles</Title>
                
                <Stack gap="md">
                  <TextInput
                    label="Nom complet"
                    value={user.name}
                    leftSection={<User size={16} />}
                    readOnly
                  />
                  
                  <TextInput
                    label="Email"
                    value={user.email}
                    leftSection={<Mail size={16} />}
                    readOnly
                  />
                  
                  <TextInput
                    label="Téléphone"
                    value={user.phone}
                    leftSection={<Phone size={16} />}
                    readOnly
                  />
                  
                  <Textarea
                    label="Adresse"
                    value={user.address}
                    leftSection={<MapPin size={16} />}
                    minRows={2}
                    readOnly
                  />
                  
                  <Textarea
                    label="Biographie"
                    value={user.bio}
                    minRows={3}
                    readOnly
                  />
                </Stack>
              </Card>
              
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Title order={3} mb="md">Photo de profil</Title>
                
                <Stack align="center" gap="md">
                  <Avatar size={120} radius="xl" color="blue">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </Avatar>
                  
                  <FileInput
                    placeholder="Choisir une nouvelle photo"
                    leftSection={<Upload size={16} />}
                    accept="image/*"
                    w="100%"
                  />
                  
                  <Text size="xs" c="dimmed" ta="center">
                    Formats acceptés: JPG, PNG, GIF (max 5MB)
                  </Text>
                </Stack>
                
                <Divider my="md" />
                
                <Title order={4} mb="md">Préférences</Title>
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="sm">Profil public</Text>
                    <Badge color={user.preferences.publicProfile ? 'green' : 'gray'}>
                      {user.preferences.publicProfile ? 'Activé' : 'Désactivé'}
                    </Badge>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm">Notifications</Text>
                    <Badge color={user.preferences.notifications ? 'green' : 'gray'}>
                      {user.preferences.notifications ? 'Activées' : 'Désactivées'}
                    </Badge>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm">Newsletter</Text>
                    <Badge color={user.preferences.newsletter ? 'green' : 'gray'}>
                      {user.preferences.newsletter ? 'Abonné' : 'Non abonné'}
                    </Badge>
                  </Group>
                </Stack>
              </Card>
            </SimpleGrid>
          </Tabs.Panel>

          {/* Activity Tab */}
          <Tabs.Panel value="activity">
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Title order={3} mb="md">Enchères récentes</Title>
                <Stack gap="md">
                  <Group justify="space-between" p="sm" style={{ backgroundColor: '#e7f5ff', borderRadius: '6px' }}>
                    <div>
                      <Text fw={500}>iPhone 15 Pro 256GB</Text>
                      <Text size="sm" c="dimmed">Enchère gagnée</Text>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Text fw={600} c="green">8,500 MAD</Text>
                      <Text size="xs" c="dimmed">Il y a 2 jours</Text>
                    </div>
                  </Group>
                  
                  <Group justify="space-between" p="sm" style={{ backgroundColor: '#fff0f6', borderRadius: '6px' }}>
                    <div>
                      <Text fw={500}>MacBook Pro M3</Text>
                      <Text size="sm" c="dimmed">Enchère perdue</Text>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Text fw={600} c="red">15,200 MAD</Text>
                      <Text size="xs" c="dimmed">Il y a 1 semaine</Text>
                    </div>
                  </Group>
                  
                  <Group justify="space-between" p="sm" style={{ backgroundColor: '#e7f5ff', borderRadius: '6px' }}>
                    <div>
                      <Text fw={500}>Apple Watch Series 9</Text>
                      <Text size="sm" c="dimmed">Enchère gagnée</Text>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Text fw={600} c="green">3,200 MAD</Text>
                      <Text size="xs" c="dimmed">Il y a 2 semaines</Text>
                    </div>
                  </Group>
                </Stack>
              </Card>
              
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Title order={3} mb="md">Avis récents</Title>
                <Stack gap="md">
                  <Box p="sm" style={{ backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                    <Group justify="space-between" mb="xs">
                      <Text fw={500}>Casque Sony WH-1000XM5</Text>
                      <Group gap={2}>
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} size={14} style={{ color: '#ffd43b', fill: '#ffd43b' }} />
                        ))}
                      </Group>
                    </Group>
                    <Text size="sm" c="dimmed">
                      "Excellent casque, qualité audio exceptionnelle et réduction de bruit parfaite."
                    </Text>
                    <Text size="xs" c="dimmed" mt="xs">Il y a 1 semaine</Text>
                  </Box>
                  
                  <Box p="sm" style={{ backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                    <Group justify="space-between" mb="xs">
                      <Text fw={500}>iPhone 14 Pro Max</Text>
                      <Group gap={2}>
                        {[1,2,3,4].map(i => (
                          <Star key={i} size={14} style={{ color: '#ffd43b', fill: '#ffd43b' }} />
                        ))}
                        <Star size={14} style={{ color: '#dee2e6' }} />
                      </Group>
                    </Group>
                    <Text size="sm" c="dimmed">
                      "Très bon état, conforme à la description. Livraison rapide."
                    </Text>
                    <Text size="xs" c="dimmed" mt="xs">Il y a 3 semaines</Text>
                  </Box>
                </Stack>
              </Card>
            </SimpleGrid>
          </Tabs.Panel>
        </Tabs>
    </Container>
  )
}