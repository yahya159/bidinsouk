import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import Chat from '@/components/shared/Chat'
import { Container, Card, Title, Text, Group, Badge, Stack } from '@mantine/core'

export default async function ThreadPage({ params }: { params: { id: string } }) {
  const threadId = BigInt(params.id)
  
  // Get the user session
  const session = await getServerSession(authConfig)
  
  if (!session || !session.user) {
    // Redirect to login page
    return (
      <Container size="xl" py="xl">
        <Text>You must be logged in to view this page.</Text>
      </Container>
    )
  }
  
  // Check if user is a participant of the thread
  const participant = await prisma.threadParticipant.findUnique({
    where: {
      threadId_userId: {
        threadId,
        userId: BigInt(session.user.id)
      }
    }
  })
  
  if (!participant) {
    return (
      <Container size="xl" py="xl">
        <Text>You are not a participant of this thread.</Text>
      </Container>
    )
  }
  
  // Get the thread with participants
  const thread = await prisma.messageThread.findUnique({
    where: { id: threadId },
    include: {
      participants: {
        include: {
          user: true
        }
      }
    }
  })
  
  if (!thread) {
    return (
      <Container size="xl" py="xl">
        <Text>Thread not found.</Text>
      </Container>
    )
  }
  
  // Get the messages
  const messages = await prisma.message.findMany({
    where: { threadId },
    include: {
      author: true
    },
    orderBy: {
      createdAt: 'asc'
    },
    take: 50
  })
  
  return (
    <Container size="xl" py="xl">
      <Card withBorder style={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
        <Stack gap={4} p="md" style={{ borderBottom: '1px solid #e9ecef' }}>
          <Title order={3}>{thread.subject || 'Conversation'}</Title>
          <Group gap="xs">
            {thread.participants.map((participant) => (
              <Badge key={String(participant.userId)} variant="light" color="gray">
                {participant.user.name}
              </Badge>
            ))}
          </Group>
        </Stack>
        
        <div style={{ flex: 1, minHeight: 0 }}>
          <Chat
            threadId={Number(threadId)}
            initialMessages={messages.map(msg => ({
              id: Number(msg.id),
              body: msg.body || '',
              author: {
                id: Number(msg.authorId),
                name: msg.author?.name || 'Unknown'
              },
              createdAt: msg.createdAt
            }))}
            currentUserId={Number(session.user.id)}
          />
        </div>
      </Card>
    </Container>
  )
}