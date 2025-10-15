import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getVendorId } from '@/lib/auth/api-auth'
import { updateFulfillmentStatus } from '@/lib/services/message-to-order'
import { z } from 'zod'

const UpdateFulfillmentSchema = z.object({
  status: z.enum(['PREPARING', 'SHIPPED', 'DELIVERED']),
  trackingNumber: z.string().optional()
})

// PUT /api/orders/[id]/fulfillment - Update fulfillment status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await requireAuth(request)
    const vendorId = await getVendorId(request)

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { status, trackingNumber } = UpdateFulfillmentSchema.parse(body)

    const order = await updateFulfillmentStatus(
      BigInt(id),
      vendorId,
      status,
      trackingNumber
    )

    return NextResponse.json({ 
      message: 'Fulfillment status updated',
      order 
    })
  } catch (error) {
    console.error('Error updating fulfillment:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update fulfillment' },
      { status: 500 }
    )
  }
}
