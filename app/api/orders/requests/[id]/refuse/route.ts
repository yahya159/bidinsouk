import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getVendorId } from '@/lib/auth/api-auth'
import { refuseOrderRequest } from '@/lib/services/message-to-order'
import { z } from 'zod'

const RefuseSchema = z.object({
  reason: z.string().min(1).max(500)
})

// POST /api/orders/requests/[id]/refuse - Refuse order request
export async function POST(
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
    const { reason } = RefuseSchema.parse(body)

    await refuseOrderRequest(BigInt(id), vendorId, reason)

    return NextResponse.json({ 
      message: 'Order request refused'
    })
  } catch (error) {
    console.error('Error refusing order request:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to refuse order request' },
      { status: 500 }
    )
  }
}
