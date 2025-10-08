import { Container, Title, Text, SimpleGrid, Group, Anchor, Divider } from '@mantine/core'

export default function Footer() {
  return (
    <footer style={{ backgroundColor: '#212529', color: 'white' }}>
      <Container size="xl" py="xl">
        <SimpleGrid cols={{ base: 1, md: 4 }} spacing="xl">
          <div>
            <Title order={3} mb="sm" c="white">Bidinsouk</Title>
            <Text c="dimmed">Le marketplace et plateforme d'enchères leader au Maroc.</Text>
          </div>

          <div>
            <Title order={4} mb="sm" c="white">Navigation</Title>
            <Group gap={6} style={{ display: 'block' }}>
              <Anchor c="dimmed" href="/">Accueil</Anchor>
              <Anchor c="dimmed" href="/auctions">Enchères</Anchor>
              <Anchor c="dimmed" href="/products">Produits</Anchor>
              <Anchor c="dimmed" href="/stores">Boutiques</Anchor>
            </Group>
          </div>

          <div>
            <Title order={4} mb="sm" c="white">Support</Title>
            <Group gap={6} style={{ display: 'block' }}>
              <Anchor c="dimmed" href="/help">Centre d'aide</Anchor>
              <Anchor c="dimmed" href="/contact">Contact</Anchor>
              <Anchor c="dimmed" href="/terms">Conditions d'utilisation</Anchor>
              <Anchor c="dimmed" href="/privacy">Politique de confidentialité</Anchor>
            </Group>
          </div>

          <div>
            <Title order={4} mb="sm" c="white">Contact</Title>
            <Text c="dimmed">Email: support@bidinsouk.com</Text>
            <Text c="dimmed" mt={4}>Casablanca, Maroc</Text>
          </div>
        </SimpleGrid>

        <Divider my="lg" color="#343a40" />
        <Text ta="center" c="dimmed">© {new Date().getFullYear()} Bidinsouk. Tous droits réservés.</Text>
      </Container>
    </footer>
  )
}