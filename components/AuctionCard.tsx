import { Card, Text, Title, Group, Badge, Button, Progress, Stack, Box } from '@mantine/core'

export default function AuctionCard(props: { auction: any }) {
  const { auction } = props;
  
  // Format date
  const endDate = new Date(auction.endAt);
  const now = new Date();
  const timeLeft = endDate.getTime() - now.getTime();
  
  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

  const progress = Math.min(100, Math.max(0, 100 - (timeLeft / (1000 * 60 * 60 * 24 * 10))));
  
  return (
    <Card shadow="sm" padding="md" radius="md" withBorder>
      <Box style={{ backgroundColor: '#f1f3f5', border: '2px dashed #dee2e6', borderRadius: '12px', width: '100%', height: '12rem' }} />
      <Stack gap="sm" mt="md">
        <Title order={4}>{auction.title}</Title>
        <Text size="sm" c="dimmed" lineClamp={2}>{auction.description}</Text>
        
        <Group justify="space-between">
          <div>
            <Text size="sm" c="dimmed">Prix de départ</Text>
            <Text fw={700}>{auction.startPrice} MAD</Text>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Text size="sm" c="dimmed">Dernière enchère</Text>
            <Text fw={700}>{auction.currentPrice || auction.startPrice} MAD</Text>
          </div>
        </Group>
        
        <div>
          <Group justify="space-between" mb={6}>
            <Text size="sm">Temps restant</Text>
            <Text size="sm" fw={500}>{days > 0 ? `${days}j ${hours}h` : `${hours}h ${minutes}m`}</Text>
          </Group>
          <Progress value={progress} radius="xl" color="blue" />
        </div>
        
        <Button fullWidth>Placer une enchère</Button>
      </Stack>
    </Card>
  )
}