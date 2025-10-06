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
      type: 'product', // Default type, can be changed based on context
      subject: title || 'New Conversation',
      status: 'open',
      participants: {
        create: participantIds.map(userId => ({
          userId
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
      threadId,
      authorId,
      body,
      attachments
    },
    include: {
      author: true,
      thread: true
    }
  })
  
  // Update the thread's lastMessageAt timestamp
  await prisma.messageThread.update({
    where: { id: threadId },
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
    where: { threadId },
    include: {
      author: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: limit
  })
  
  return messages.reverse() // Return in chronological order
}