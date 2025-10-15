import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getVendorId } from '@/lib/auth/api-auth'
import { initiatePayment } from '@/lib/services/message-to-order'
import { z } from 'zod'

const InitiatePaymentSchema = z.object({
  method: z.enum(['cod', 'bank', 'inperson']),
  instructions: z.string().min(1).max(2000)
})

// POST /api/orders/[id]/initiate-payment - Initiate payment process
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
    const { method, instructions } = InitiatePaymentSchema.parse(body)

    const order = await initiatePayment(
      BigInt(id),
      vendorId,
      {
        method,
        instructions
      }
    )

    return NextResponse.json({ 
      message: 'Payment process initiated',
      order 
    })
  } catch (error) {
    console.error('Error initiating payment:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to initiate payment' },
      { status: 500 }
    )
  }
}