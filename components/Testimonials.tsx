'use client';

import { Container, Title, Text, Avatar, Group, Box, Rating } from '@mantine/core';
import { IconQuote } from '@tabler/icons-react';

const testimonialsData = [
  {
    name: 'Marie Dubois',
    role: 'Acheteuse régulière',
    content: 'J\'ai trouvé des articles uniques à des prix imbattables. La plateforme est intuitive et sécurisée.',
    rating: 5,
    avatar: 'https://randomuser.me/api/portraits/women/43.jpg',
  },
  {
    name: 'Jean Martin',
    role: 'Vendeur professionnel',
    content: 'BidInSouk m\'a permis d\'atteindre un public plus large et d\'augmenter mes ventes de 200%.',
    rating: 5,
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  },
  {
    name: 'Sophie Lambert',
    role: 'Nouvelle utilisatrice',
    content: 'Très facile à utiliser, j\'ai remporté ma première enchère en moins de 24 heures!',
    rating: 4,
    avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
  },
];

export default function Testimonials() {
  const testimonials = testimonialsData.map((testimonial) => (
    <Box 
      key={testimonial.name}
      p="xl"
      style={{
        borderRadius: 8,
        border: '1px solid #e9ecef',
        backgroundColor: '#fff',
      }}
    >
      <Group mb="sm">
        <Avatar src={testimonial.avatar} alt={testimonial.name} radius="xl" />
        <div>
          <Text fw={500}>{testimonial.name}</Text>
          <Text size="sm" c="dimmed">{testimonial.role}</Text>
        </div>
      </Group>
      
      <Rating value={testimonial.rating} readOnly size="sm" mb="sm" />
      
      <Text size="sm" c="dimmed" style={{ fontStyle: 'italic' }}>
        <IconQuote size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />
        {testimonial.content}
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
          Témoignages
        </Title>
        <Text 
          c="dimmed" 
          ta="center" 
          mb="xl" 
          maw={600} 
          mx="auto"
        >
          Découvrez ce que nos utilisateurs pensent de notre plateforme
        </Text>
        
        <Box
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
          }}
        >
          {testimonials}
        </Box>
      </Container>
    </Box>
  );
}