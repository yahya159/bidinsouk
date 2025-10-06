import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import Chat from '@/components/shared/Chat'

export default async function ThreadPage({ params }: { params: { id: string } }) {
  const threadId = BigInt(params.id)
  
  // Get the user session
  const session = await getServerSession(authConfig)
  
  if (!session || !session.user) {
    // Redirect to login page
    return (
      <div className="container mx-auto py-8">
        <p>You must be logged in to view this page.</p>
      </div>
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
      <div className="container mx-auto py-8">
        <p>You are not a participant of this thread.</p>
      </div>
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
      <div className="container mx-auto py-8">
        <p>Thread not found.</p>
      </div>
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
    <div className="container mx-auto py-8">
      <div className="bg-white rounded-lg shadow-md h-[calc(100vh-200px)] flex flex-col">
        <div className="border-b p-4">
          <h1 className="text-xl font-semibold">
            {thread.subject || 'Conversation'}
          </h1>
          <div className="flex flex-wrap gap-2 mt-2">
            {thread.participants.map((participant) => (
              <span
                key={participant.userId}
                className="bg-gray-100 px-2 py-1 rounded text-sm"
              >
                {participant.user.name}
              </span>
            ))}
          </div>
        </div>
        
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
    </div>
  )
}