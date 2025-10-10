'use client';

import { Container, Title, Text, SimpleGrid, Card, Box } from '@mantine/core';
import { IconTag, IconBuildingStore, IconStar, IconTrendingUp } from '@tabler/icons-react';
import Link from 'next/link';

const collectionsData = [
  {
    title: 'Produits populaires',
    description: 'Découvrez les articles les plus populaires de notre plateforme',
    icon: IconTrendingUp,
    link: '/products',
  },
  {
    title: 'Meilleurs vendeurs',
    description: 'Trouvez les vendeurs avec les meilleures notes et avis',
    icon: IconStar,
    link: '/vendors',
  },
  {
    title: 'Catégories',
    description: 'Parcourez nos différentes catégories de produits',
    icon: IconTag,
    link: '/categories',
  },
  {
    title: 'Boutiques partenaires',
    description: 'Découvrez nos boutiques partenaires sélectionnées',
    icon: IconBuildingStore,
    link: '/stores',
  },
];

export default function Collections() {
  const collectionItems = collectionsData.map((item) => (
    <Link href={item.link} key={item.title} style={{ textDecoration: 'none' }}>
      <Card 
        shadow="md" 
        padding="xl" 
        radius="md" 
        withBorder
        sx={(theme) => ({
          cursor: 'pointer',
          transition: 'transform 0.2s ease',
          '&:hover': {
            transform: 'scale(1.02)',
            borderColor: theme.colors.blue[6],
          },
        })}
      >
        <Box mb="md">
          <item.icon size={32} stroke={1.5} color="#339af0" />
        </Box>
        <Title order={3} size="h4" mb={4}>
          {item.title}
        </Title>
        <Text size="sm" c="dimmed">
          {item.description}
        </Text>
      </Card>
    </Link>
  ));

  return (
    <Container size="lg" py="xl">
      <Title 
        order={2} 
        ta="center" 
        mb="xl"
        fz={{ base: 24, sm: 32 }}
      >
        Parcourir les collections
      </Title>
      <SimpleGrid 
        cols={{ base: 1, sm: 2, md: 4 }} 
        spacing="xl" 
        verticalSpacing="xl"
      >
        {collectionItems}
      </SimpleGrid>
    </Container>
  );
}