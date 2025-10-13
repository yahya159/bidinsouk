import { Container, Title, Text, Group, Button, SimpleGrid, Card, Box } from '@mantine/core';
import { categoryIcons, type CategoryKey } from '@/lib/iconMap';
import { getPopularCategories } from '@/lib/homeData';
import Link from 'next/link';

export async function PopularCategories() {
  const categories = await getPopularCategories();

  return (
    <Container size="xl" py={48}>
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} size="2rem" fw={600} mb="xs">
            Catégories populaires
          </Title>
          <Text c="dimmed" size="lg">
            Découvrez nos catégories les plus recherchées
          </Text>
        </div>
        <Button
          variant="subtle"
          component={Link}
          href="/categories"
          size="md"
        >
          Tout voir
        </Button>
      </Group>

      <SimpleGrid
        cols={{ base: 2, sm: 3, md: 4, lg: 6 }}
        spacing="lg"
      >
        {categories.slice(0, 12).map((category) => {
          const IconComponent = categoryIcons[category.name as CategoryKey];
          
          return (
            <Card
              key={category.id}
              component={Link}
              href={`/search?category=${category.slug}`}
              padding="xl"
              radius="lg"
              style={{
                backgroundColor: category.color + '10',
                border: `1px solid ${category.color}20`,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textDecoration: 'none',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                  backgroundColor: category.color + '20',
                },
              }}
            >
              <Box style={{ textAlign: 'center' }}>
                <Box
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    backgroundColor: category.color + '30',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                  }}
                >
                  {IconComponent && <IconComponent size={24} color={category.color} />}
                </Box>
                <Text fw={600} size="sm" c="dark" ta="center">
                  {category.name}
                </Text>
              </Box>
            </Card>
          );
        })}
      </SimpleGrid>
    </Container>
  );
}