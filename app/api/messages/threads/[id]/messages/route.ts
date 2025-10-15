import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/api-auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const SendMessageSchema = z.object({
  content: z.string().min(1).max(5000),
  attachments: z.array(z.string().url()).optional()
})

// POST /api/messages/threads/[id]/messages - Send message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await requireAuth(request)
    const threadId = id // String, not BigInt
    const body = await request.json()
    const { content, attachments } = SendMessageSchema.parse(body)

    // Verify user is participant
    const participant = await prisma.messageThreadParticipant.findUnique({
      where: {
        threadId_userId: {
          threadId,
          userId: BigInt(user.userId)
        }
      }
    })

    if (!participant) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        threadId,
        senderId: BigInt(user.userId),
        content,
        isRead: false
      },
      include: {
        sender: {
          select: { id: true, name: true }
        }
      }
    })

    // Update thread timestamp
    await prisma.messageThread.update({
      where: { id: threadId },
      data: { updatedAt: new Date() }
    })

    // TODO: Send notification to other participants

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send message' },
      { status: 500 }
    )
  }
}
