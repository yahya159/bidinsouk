import { Suspense, use } from 'react'
import { Container, Title, Paper, Loader, Center } from '@mantine/core'
import { MessageThread } from '@/components/messages/MessageThread'

export default function MessageThreadPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = use(params);
  
  return (
    <Container size="md" py="xl">
      <Title order={2} mb="lg">Message Thread</Title>
      
      <Paper shadow="sm" p="md" radius="md">
        <Suspense fallback={
          <Center h={400}>
            <Loader />
          </Center>
        }>
          <MessageThread threadId={id} />
        </Suspense>
      </Paper>
    </Container>
  )
}
