import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getVendorId } from '@/lib/auth/api-auth'
import { confirmPaymentReceived } from '@/lib/services/message-to-order'
import { z } from 'zod'

const ConfirmPaymentSchema = z.object({
  notes: z.string().max(500).optional()
})

// POST /api/orders/[id]/confirm-payment - Confirm payment received
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
    const { notes } = ConfirmPaymentSchema.parse(body)

    const order = await confirmPaymentReceived(BigInt(id), vendorId, notes)

    return NextResponse.json({ 
      message: 'Payment confirmed',
      order 
    })
  } catch (error) {
    console.error('Error confirming payment:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to confirm payment' },
      { status: 500 }
    )
  }
}
