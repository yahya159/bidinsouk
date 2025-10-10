'use client';

import { Container, Title, Text, SimpleGrid, ThemeIcon, Box } from '@mantine/core';
import { IconGavel, IconShieldCheck, IconCoins, IconClock } from '@tabler/icons-react';

const featuresData = [
  {
    icon: IconGavel,
    title: 'Enchères en temps réel',
    description:
      'Participez à des enchères en direct avec des acheteurs du monde entier et suivez les offres en temps réel.',
  },
  {
    icon: IconShieldCheck,
    title: 'Transactions sécurisées',
    description:
      'Toutes les transactions sont protégées par notre système de sécurité avancé pour une expérience fiable.',
  },
  {
    icon: IconCoins,
    title: 'Prix compétitifs',
    description:
      'Obtenez les meilleurs prix grâce à notre système d\'enchères compétitives et transparentes.',
  },
  {
    icon: IconClock,
    title: 'Historique des enchères',
    description:
      'Consultez l\'historique complet de vos enchères et retrouvez facilement vos articles favoris.',
  },
];

export default function ModernFeatures() {
  const features = featuresData.map((feature) => (
    <Box key={feature.title} ta="center">
      <ThemeIcon 
        size={60} 
        radius={30} 
        variant="light" 
        color="blue" 
        mx="auto" 
        mb="md"
      >
        <feature.icon size={30} stroke={1.5} />
      </ThemeIcon>
      <Title order={3} mb={6}>{feature.title}</Title>
      <Text size="sm" c="dimmed">
        {feature.description}
      </Text>
    </Box>
  ));

  return (
    <Box 
      py="xl" 
      style={{
        backgroundColor: '#f8f9fa',
      }}
    >
      <Container size="lg">
        <Title 
          order={2} 
          ta="center" 
          mb="sm"
          fz={{ base: 24, sm: 32 }}
        >
          Fonctionnalités modernes
        </Title>
        <Text 
          c="dimmed" 
          ta="center" 
          mb="xl" 
          maw={600} 
          mx="auto"
        >
          Découvrez ce qui fait de notre plateforme la meilleure option pour les ventes aux enchères
        </Text>
        
        <SimpleGrid 
          cols={{ base: 1, sm: 2, md: 4 }} 
          spacing="xl"
        >
          {features}
        </SimpleGrid>
      </Container>
    </Box>
  );
}