import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/api-auth'
import { findOrCreateThread } from '@/lib/services/message-to-order'
import { z } from 'zod'

const CreateThreadSchema = z.object({
  productId: z.string(),
  vendorId: z.string()
})

// POST /api/messages/threads - Create or find existing thread
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    const { productId, vendorId } = CreateThreadSchema.parse(body)

    const thread = await findOrCreateThread(
      BigInt(user.userId),
      BigInt(vendorId),
      BigInt(productId)
    )

    return NextResponse.json({ thread })
  } catch (error) {
    console.error('Error creating thread:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create thread' },
      { status: 500 }
    )
  }
}

// GET /api/messages/threads - Get user's threads
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { prisma } = await import('@/lib/db/prisma')

    const threads = await prisma.messageThread.findMany({
      where: {
        participants: {
          some: { userId: BigInt(user.userId) }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        product: {
          select: { id: true, title: true, images: true, price: true }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        _count: {
          select: {
            messages: {
              where: {
                isRead: false,
                senderId: { not: BigInt(user.userId) }
              }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json({ threads })
  } catch (error) {
    console.error('Error fetching threads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch threads' },
      { status: 500 }
    )
  }
}
