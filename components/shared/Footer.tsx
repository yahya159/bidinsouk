import { 
  Container, 
  Title, 
  Text, 
  SimpleGrid, 
  Group, 
  Anchor, 
  Divider, 
  TextInput, 
  Button, 
  Stack,
  Box,
  ActionIcon
} from '@mantine/core'
import { 
  IconBrandFacebook, 
  IconBrandTwitter, 
  IconBrandInstagram, 
  IconBrandYoutube,
  IconMail,
  IconPhone,
  IconMapPin
} from '@tabler/icons-react'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{ 
      backgroundColor: '#1a1b1e', 
      color: 'white',
      marginTop: 'auto'
    }}>
      <Container size="xl" py={60}>
        {/* Main Footer Content */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing={40}>
          {/* Company Info */}
          <div>
            <Title 
              order={3} 
              mb="lg" 
              c="white"
              style={{ 
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#228be6'
              }}
            >
              Bidinsouk
            </Title>
            <Text c="dimmed" mb="md" size="sm">
              La première plateforme d'enchères au Maroc. Découvrez des produits uniques et participez à des enchères passionnantes.
            </Text>
            
            <Stack gap="xs">
              <Group gap="xs">
                <IconMapPin size={16} color="#868e96" />
                <Text size="sm" c="dimmed">Casablanca, Maroc</Text>
              </Group>
              <Group gap="xs">
                <IconPhone size={16} color="#868e96" />
                <Text size="sm" c="dimmed">+212 6 12 34 56 78</Text>
              </Group>
              <Group gap="xs">
                <IconMail size={16} color="#868e96" />
                <Text size="sm" c="dimmed">support@bidinsouk.com</Text>
              </Group>
            </Stack>
          </div>

          {/* Quick Links */}
          <div>
            <Title order={5} mb="md" c="white">Navigation</Title>
            <Stack gap="xs">
              <Anchor component={Link} href="/auctions" c="dimmed" size="sm" style={{ textDecoration: 'none' }}>
                Toutes les enchères
              </Anchor>
              <Anchor component={Link} href="/auctions?status=live" c="dimmed" size="sm" style={{ textDecoration: 'none' }}>
                Enchères en direct
              </Anchor>
              <Anchor component={Link} href="/browse" c="dimmed" size="sm" style={{ textDecoration: 'none' }}>
                Parcourir les produits
              </Anchor>
              <Anchor component={Link} href="/vendors/apply" c="dimmed" size="sm" style={{ textDecoration: 'none' }}>
                Devenir vendeur
              </Anchor>
              <Anchor component={Link} href="/help" c="dimmed" size="sm" style={{ textDecoration: 'none' }}>
                Centre d'aide
              </Anchor>
            </Stack>
          </div>

          {/* Categories */}
          <div>
            <Title order={5} mb="md" c="white">Catégories populaires</Title>
            <Stack gap="xs">
              <Anchor component={Link} href="/category/auto" c="dimmed" size="sm" style={{ textDecoration: 'none' }}>
                Automobile
              </Anchor>
              <Anchor component={Link} href="/category/telephones" c="dimmed" size="sm" style={{ textDecoration: 'none' }}>
                Téléphones & Tech
              </Anchor>
              <Anchor component={Link} href="/category/mode" c="dimmed" size="sm" style={{ textDecoration: 'none' }}>
                Mode & Accessoires
              </Anchor>
              <Anchor component={Link} href="/category/maison" c="dimmed" size="sm" style={{ textDecoration: 'none' }}>
                Maison & Jardin
              </Anchor>
              <Anchor component={Link} href="/category/art" c="dimmed" size="sm" style={{ textDecoration: 'none' }}>
                Art & Collection
              </Anchor>
            </Stack>
          </div>

          {/* Newsletter & Social */}
          <div>
            <Title order={5} mb="md" c="white">Restez connecté</Title>
            <Text c="dimmed" mb="md" size="sm">
              Recevez les dernières enchères et offres spéciales
            </Text>
            
            <Group gap="xs" mb="lg">
              <TextInput 
                placeholder="Votre email" 
                style={{ flex: 1 }} 
                size="sm"
                styles={{
                  input: {
                    backgroundColor: '#25262b',
                    border: '1px solid #373a40',
                    color: 'white',
                    '&::placeholder': {
                      color: '#868e96'
                    }
                  }
                }}
              />
              <Button size="sm" gradient={{ from: 'orange', to: 'red' }}>
                S'abonner
              </Button>
            </Group>
            
            {/* Social Media */}
            <Group gap="xs">
              <ActionIcon 
                variant="subtle" 
                size="lg"
                component="a"
                href="#"
                style={{ color: '#868e96' }}
              >
                <IconBrandFacebook size={20} />
              </ActionIcon>
              <ActionIcon 
                variant="subtle" 
                size="lg"
                component="a"
                href="#"
                style={{ color: '#868e96' }}
              >
                <IconBrandTwitter size={20} />
              </ActionIcon>
              <ActionIcon 
                variant="subtle" 
                size="lg"
                component="a"
                href="#"
                style={{ color: '#868e96' }}
              >
                <IconBrandInstagram size={20} />
              </ActionIcon>
              <ActionIcon 
                variant="subtle" 
                size="lg"
                component="a"
                href="#"
                style={{ color: '#868e96' }}
              >
                <IconBrandYoutube size={20} />
              </ActionIcon>
            </Group>
          </div>
        </SimpleGrid>

        <Divider my={40} color="#373a40" />
        
        {/* Bottom Section */}
        <Group justify="space-between" align="center">
          <Text c="dimmed" size="sm">
            © {new Date().getFullYear()} Bidinsouk. Tous droits réservés.
          </Text>
          
          <Group gap="lg">
            <Anchor component={Link} href="/terms" c="dimmed" size="sm" style={{ textDecoration: 'none' }}>
              Conditions d'utilisation
            </Anchor>
            <Anchor component={Link} href="/privacy" c="dimmed" size="sm" style={{ textDecoration: 'none' }}>
              Confidentialité
            </Anchor>
            <Anchor component={Link} href="/cookies" c="dimmed" size="sm" style={{ textDecoration: 'none' }}>
              Cookies
            </Anchor>
          </Group>
        </Group>
      </Container>
    </footer>
  )
}