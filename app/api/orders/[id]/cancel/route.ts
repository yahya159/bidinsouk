import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/api-auth'
import { cancelOrder } from '@/lib/services/message-to-order'
import { z } from 'zod'

const CancelOrderSchema = z.object({
  reason: z.string().min(1).max(500)
})

// POST /api/orders/[id]/cancel - Cancel order
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    const { reason } = CancelOrderSchema.parse(body)

    // Check if user is vendor or buyer
    const { prisma } = await import('@/lib/db/prisma')
    const order = await prisma.order.findUnique({
      where: { id: BigInt(id) },
      select: { 
        userId: true,
        store: {
          select: {
            seller: {
              select: {
                userId: true
              }
            }
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const isVendor = order.store.seller.userId === BigInt(user.userId)
    const isBuyer = order.userId === BigInt(user.userId)

    if (!isVendor && !isBuyer) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    await cancelOrder(BigInt(id), BigInt(user.userId), reason, isVendor)

    return NextResponse.json({ 
      message: 'Order cancelled successfully'
    })
  } catch (error) {
    console.error('Error cancelling order:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to cancel order' },
      { status: 500 }
    )
  }
}
