import { Container, Title, Text, Button, Card, Box, Group } from '@mantine/core';
import Link from 'next/link';

export function CTASection() {
  return (
    <Container size="xl" py={48}>
      <Card
        shadow="md"
        padding="xl"
        radius="xl"
        style={{
          background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
          textAlign: 'center',
          border: 'none',
        }}
      >
        <Box maw={600} mx="auto">
          <Title
            order={2}
            size="2rem"
            fw={700}
            c="white"
            mb="md"
            style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
          >
            C'est le moment de
          </Title>
          <Text
            size="xl"
            c="white"
            mb="xl"
            style={{ 
              opacity: 0.95,
              textShadow: '0 1px 2px rgba(0,0,0,0.1)',
            }}
          >
            Rejoignez des milliers d'utilisateurs qui font déjà confiance à Bidinsouk
          </Text>
          <Group gap="md" justify="center">
            <Button
              size="xl"
              variant="white"
              color="orange"
              radius="xl"
              component={Link}
              href="/auctions/create"
              style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                padding: '16px 40px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                transition: 'all 0.2s ease',
              }}
            >
              Déposer une enchère
            </Button>
            <Button
              size="xl"
              variant="outline"
              color="white"
              radius="xl"
              component={Link}
              href="/vendors/apply"
              style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                padding: '16px 40px',
                borderColor: 'white',
                color: 'white',
                backgroundColor: 'transparent',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                transition: 'all 0.2s ease',
              }}
            >
              Créer une boutique
            </Button>
          </Group>
        </Box>
      </Card>
    </Container>
  );
}