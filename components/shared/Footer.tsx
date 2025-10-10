import { Container, Title, Text, SimpleGrid, Group, Anchor, Divider, TextInput, Button } from '@mantine/core'
import { IconBrandFacebook, IconBrandTwitter, IconBrandInstagram, IconBrandYoutube } from '@tabler/icons-react'

export default function Footer() {
  return (
    <footer style={{ backgroundColor: '#212529', color: 'white' }}>
      <Container size="xl" py="xl">
        {/* Four-column layout */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="xl">
          {/* Quick links */}
          <div>
            <Title order={4} mb="sm" c="white">Navigation rapide</Title>
            <Group gap={6} style={{ display: 'block' }}>
              <Anchor c="dimmed" href="/search">Recherche</Anchor>
              <Anchor c="dimmed" href="/verify">Vérifier les annonces</Anchor>
              <Anchor c="dimmed" href="/profile">Mon compte</Anchor>
              <Anchor c="dimmed" href="/watchlist">Favoris</Anchor>
              <Anchor c="dimmed" href="/orders">Mes commandes</Anchor>
            </Group>
          </div>

          {/* Categories links */}
          <div>
            <Title order={4} mb="sm" c="white">Catégories</Title>
            <Group gap={6} style={{ display: 'block' }}>
              <Anchor c="dimmed" href="/category/auto">Auto</Anchor>
              <Anchor c="dimmed" href="/category/telephones">Téléphones</Anchor>
              <Anchor c="dimmed" href="/category/femmes">Femmes</Anchor>
              <Anchor c="dimmed" href="/category/vins">Vins</Anchor>
              <Anchor c="dimmed" href="/category/chaussures">Chaussures</Anchor>
              <Anchor c="dimmed" href="/category/livres">Livres</Anchor>
              <Anchor c="dimmed" href="/category/maison">Maison</Anchor>
              <Anchor c="dimmed" href="/category/montres">Montres</Anchor>
            </Group>
          </div>

          {/* Legal links */}
          <div>
            <Title order={4} mb="sm" c="white">Légal</Title>
            <Group gap={6} style={{ display: 'block' }}>
              <Anchor c="dimmed" href="/terms">Conditions d'utilisation</Anchor>
              <Anchor c="dimmed" href="/privacy">Politique de confidentialité</Anchor>
              <Anchor c="dimmed" href="/cookies">Cookies</Anchor>
              <Anchor c="dimmed" href="/about">À propos</Anchor>
              <Anchor c="dimmed" href="/help">Aide</Anchor>
              <Anchor c="dimmed" href="/contact">Contact</Anchor>
            </Group>
          </div>

          {/* Newsletter signup */}
          <div>
            <Title order={4} mb="sm" c="white">Newsletter</Title>
            <Text c="dimmed" mb="sm">Restez informé des dernières enchères</Text>
            <Group gap="xs">
              <TextInput 
                placeholder="Votre email" 
                style={{ flex: 1 }} 
                size="sm"
              />
              <Button size="sm">S'abonner</Button>
            </Group>
            
            {/* Social media icons */}
            <Group mt="lg">
              <Anchor href="#" c="dimmed"><IconBrandFacebook size={20} /></Anchor>
              <Anchor href="#" c="dimmed"><IconBrandTwitter size={20} /></Anchor>
              <Anchor href="#" c="dimmed"><IconBrandInstagram size={20} /></Anchor>
              <Anchor href="#" c="dimmed"><IconBrandYoutube size={20} /></Anchor>
            </Group>
          </div>
        </SimpleGrid>

        <Divider my="lg" color="#343a40" />
        {/* Copyright information */}
        <Text ta="center" c="dimmed">© {new Date().getFullYear()} Bidinsouk. Tous droits réservés.</Text>
      </Container>
    </footer>
  )
}