'use client';

import { Container, Title, Text, Button, Group, Box } from '@mantine/core';
import Link from 'next/link';

export default function ModernHero() {
  return (
    <Box 
      py={80} 
      sx={(theme) => ({
        backgroundImage: `linear-gradient(135deg, ${theme.colors.blue[6]} 0%, ${theme.colors.indigo[6]} 100%)`,
        borderRadius: theme.radius.lg,
        marginTop: theme.spacing.xl,
      })}
    >
      <Container size="lg">
        <Group justify="center" align="center" direction="column" gap="xl">
          <Title 
            order={1} 
            c="white" 
            ta="center"
            fz={{ base: 36, sm: 48, md: 60 }}
            fw={900}
          >
            Bienvenue sur BidInSouk
          </Title>
          <Text 
            c="white" 
            size="xl" 
            ta="center"
            maw={600}
          >
            La plateforme de vente aux enchères ultime pour acheter et vendre des produits uniques à des prix imbattables.
          </Text>
          <Group mt="xl">
            <Link href="/auctions" passHref>
              <Button 
                size="lg" 
                variant="white" 
                color="dark"
                radius="xl"
              >
                Explorer les enchères
              </Button>
            </Link>
            <Link href="/vendors/apply" passHref>
              <Button 
                size="lg" 
                variant="outline" 
                color="white"
                radius="xl"
              >
                Devenir vendeur
              </Button>
            </Link>
          </Group>
        </Group>
      </Container>
    </Box>
  );
}