import { prisma } from '@/lib/db/prisma'
import { pusher } from '@/lib/realtime/pusher'

interface CreateThreadInput {
  creatorId: bigint
  title?: string
  participants: bigint[]
}

interface PostMessageInput {
  threadId: bigint
  authorId: bigint
  body: string
  attachments?: any
}

export async function createThread(input: CreateThreadInput) {
  const { creatorId, title, participants } = input
  
  // Ensure the creator is included in participants
  const participantIds = [...new Set([creatorId, ...participants])]
  
  // Create the thread
  const thread = await prisma.messageThread.create({
    data: {
      type: 'VENDOR_CHAT', // Use valid ThreadType enum value
      subject: title || 'New Conversation',
      participants: {
        create: participantIds.map(userId => ({
          userId,
          role: userId === creatorId ? 'USER' : 'VENDOR'
        }))
      }
    },
    include: {
      participants: {
        include: {
          user: true
        }
      }
    }
  })
  
  return thread
}

export async function postMessage(input: PostMessageInput) {
  const { threadId, authorId, body, attachments } = input
  
  // Create the message
  const message = await prisma.message.create({
    data: {
      threadId: threadId.toString(),
      senderId: authorId,
      content: body,
      attachments: attachments || undefined
    },
    include: {
      sender: true,
      thread: true
    }
  })
  
  // Update the thread's lastMessageAt timestamp
  await prisma.messageThread.update({
    where: { id: threadId.toString() },
    data: { lastMessageAt: new Date() }
  })
  
  // Trigger Pusher event for the thread
  await pusher.trigger(`thread-${threadId}`, 'message:new', {
    message,
    createdAt: new Date()
  })
  
  return message
}

export async function getThreadMessages(threadId: bigint, limit: number = 50) {
  const messages = await prisma.message.findMany({
    where: { threadId: threadId.toString() },
    include: {
      sender: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: limit
  })
  
  return messages.reverse() // Return in chronological order
}
