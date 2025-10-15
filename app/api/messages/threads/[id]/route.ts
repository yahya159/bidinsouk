import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/api-auth'
import { prisma } from '@/lib/db/prisma'

// GET /api/messages/threads/[id] - Get thread details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await requireAuth(request)
    const threadId = id // String, not BigInt

    // Verify user is participant
    const userId = BigInt(user.userId)
    const participant = await prisma.messageThreadParticipant.findUnique({
      where: {
        threadId_userId: {
          threadId,
          userId
        }
      }
    })

    if (!participant) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get thread with messages
    const thread = await prisma.messageThread.findUnique({
      where: { id: threadId },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        product: {
          select: { 
            id: true, 
            title: true, 
            images: true, 
            price: true,
            status: true,
            inventory: true
          }
        },
        vendor: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: { id: true, name: true }
            }
          }
        }
      }
    })

    if (!thread) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      )
    }

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        threadId,
        senderId: { not: userId },
        isRead: false
      },
      data: { isRead: true }
    })

    return NextResponse.json({ thread })
  } catch (error) {
    console.error('Error fetching thread:', error)
    return NextResponse.json(
      { error: 'Failed to fetch thread' },
      { status: 500 }
    )
  }
}
