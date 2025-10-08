import { Card, Text, Title, Group, Badge, Button, Stack, Box, ActionIcon } from '@mantine/core'
import { IconHeart } from '@tabler/icons-react'

export default function ProductCard(props: { product: any }) {
  const { product } = props;
  
  return (
    <Card shadow="sm" padding="md" radius="md" withBorder>
      <Box style={{ backgroundColor: '#f1f3f5', border: '2px dashed #dee2e6', borderRadius: '12px', width: '100%', height: '12rem' }} />
      <Stack gap="sm" mt="md">
        <Group justify="space-between" align="start">
          <Title order={4}>{product.title}</Title>
          <Badge color="blue" variant="light" radius="sm">{product.condition}</Badge>
        </Group>
        
        <Text size="sm" c="dimmed" lineClamp={2}>{product.description}</Text>
        
        <Group justify="space-between" align="center">
          <div>
            <Text size="sm" c="dimmed">Prix</Text>
            <Text fw={700}>{product.price} MAD</Text>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Text size="sm" c="dimmed">Boutique</Text>
            <Text fw={500}>{product.storeName}</Text>
          </div>
        </Group>
        
        <Group gap="sm">
          <Button fullWidth>Ajouter au panier</Button>
          <ActionIcon variant="outline" color="gray" size="lg">
            <IconHeart />
          </ActionIcon>
        </Group>
      </Stack>
    </Card>
  )
}