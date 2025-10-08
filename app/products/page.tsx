import ProductCard from '@/components/ProductCard'
import { Container, Title, Text, SimpleGrid, Button, Group, Stack } from '@mantine/core'

// Placeholder data - in a real app this would come from an API
const products = [
  {
    id: 1,
    title: "Casque Audio Sony WH-1000XM5",
    description: "Casque audio sans fil premium avec annulation de bruit, autonomie 30h.",
    price: 2200,
    condition: "NEUF",
    storeName: "TechStore",
    image: ""
  },
  {
    id: 2,
    title: "Montre Apple Watch Series 8",
    description: "Montre connectée avec suivi santé avancé, GPS et étanche.",
    price: 2800,
    condition: "NEUF",
    storeName: "AppleShop",
    image: ""
  },
  {
    id: 3,
    title: "Appareil Photo Canon EOS 250D",
    description: "Boîtier photo reflex avec objectif 18-55mm, parfait pour débutants.",
    price: 4500,
    condition: "OCCASION",
    storeName: "PhotoExpert",
    image: ""
  },
  {
    id: 4,
    title: "Chaise de Bureau Ergonomique",
    description: "Chaise de bureau réglable en hauteur avec support lombaire.",
    price: 1200,
    condition: "NEUF",
    storeName: "MaisonConfort",
    image: ""
  },
  {
    id: 5,
    title: "Robot Cuisine Thermomix TM6",
    description: "Robot multifonctions avec écran tactile et plus de 50 fonctions.",
    price: 12500,
    condition: "NEUF",
    storeName: "ElectroMaroc",
    image: ""
  },
  {
    id: 6,
    title: "Vélo Route Trek Emonda",
    description: "Vélo de route en carbone avec groupe Shimano Ultegra, taille L.",
    price: 18000,
    condition: "OCCASION",
    storeName: "BikePro",
    image: ""
  }
]

export default function ProductsPage() {
  return (
    <Container size="xl" py="xl">
      <Stack gap="md" mb="md">
        <Title order={1}>Produits à vendre</Title>
        <Text c="dimmed">Découvrez nos produits neufs et d'occasion à des prix compétitifs</Text>
      </Stack>
      
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </SimpleGrid>
      
      <Group justify="center" mt="xl">
        <Button variant="default">Voir plus de produits</Button>
      </Group>
    </Container>
  )
}