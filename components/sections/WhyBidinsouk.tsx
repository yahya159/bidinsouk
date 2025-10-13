import { Container, Title, Text, SimpleGrid, Card, Box, Stack } from '@mantine/core';
import { featureIcons } from '@/lib/iconMap';
import { whyBidinsoukFeatures } from '@/lib/homeData';

export function WhyBidinsouk() {
  return (
    <Box style={{ backgroundColor: '#f8f9fa' }}>
      <Container size="xl" py={48}>
        <Box style={{ textAlign: 'center', marginBottom: 48 }}>
          <Title order={2} size="2rem" fw={600} mb="xs">
            Pourquoi Bidinsouk ?
          </Title>
          <Text c="dimmed" size="lg" maw={600} mx="auto">
            Découvrez les avantages qui font de Bidinsouk la plateforme d'enchères de référence au Maroc
          </Text>
        </Box>

        <SimpleGrid
          cols={{ base: 1, sm: 2, lg: 4 }}
          spacing="xl"
        >
          {whyBidinsoukFeatures.map((feature, index) => {
            const IconComponent = featureIcons[feature.icon];
            
            return (
              <Card
                key={index}
                shadow="xs"
                padding="xl"
                radius="lg"
                withBorder
                style={{
                  height: '100%',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                  },
                }}
              >
                <Stack align="center" gap="md">
                  <Box
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      backgroundColor: '#e7f5ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconComponent size={32} color="#228be6" />
                  </Box>
                  
                  <Title order={4} fw={600} size="lg">
                    {feature.title}
                  </Title>
                  
                  <Text c="dimmed" size="sm" ta="center" style={{ lineHeight: 1.5 }}>
                    {feature.description}
                  </Text>
                </Stack>
              </Card>
            );
          })}
        </SimpleGrid>
      </Container>
    </Box>
  );
}