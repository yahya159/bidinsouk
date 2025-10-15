import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/api-auth'
import { createOrderRequest } from '@/lib/services/message-to-order'
import { z } from 'zod'

const CreateOrderRequestSchema = z.object({
  threadId: z.string(),
  productId: z.string(),
  quantity: z.number().int().min(1).max(100),
  paymentMethod: z.enum(['cod', 'bank', 'inperson']),
  deliveryAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string().optional(),
    zipCode: z.string(),
    country: z.string(),
    phone: z.string()
  }),
  notes: z.string().max(1000).optional()
})

// POST /api/orders/requests - Create order request
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    const data = CreateOrderRequestSchema.parse(body)

    const orderRequest = await createOrderRequest({
      threadId: data.threadId, // String (CUID), not BigInt
      userId: BigInt(user.userId),
      productId: BigInt(data.productId),
      quantity: data.quantity,
      paymentMethod: data.paymentMethod,
      deliveryAddress: data.deliveryAddress,
      notes: data.notes
    })

    return NextResponse.json({ orderRequest }, { status: 201 })
  } catch (error) {
    console.error('Error creating order request:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create order request' },
      { status: 500 }
    )
  }
}

// GET /api/orders/requests - Get user's order requests
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const { prisma } = await import('@/lib/db/prisma')

    const where: any = { userId: BigInt(user.userId) }
    if (status) {
      where.status = status
    }

    const requests = await prisma.orderRequest.findMany({
      where,
      include: {
        store: {
          include: {
            seller: {
              include: {
                user: {
                  select: { id: true, name: true, email: true }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Error fetching order requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order requests' },
      { status: 500 }
    )
  }
}
