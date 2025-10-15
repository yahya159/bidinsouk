import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getVendorId } from '@/lib/auth/api-auth'
import { acceptOrderRequest } from '@/lib/services/message-to-order'

// POST /api/orders/requests/[id]/accept - Accept order request
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

    const order = await acceptOrderRequest(BigInt(id), vendorId)

    return NextResponse.json({ 
      message: 'Order request accepted',
      order 
    })
  } catch (error) {
    console.error('Error accepting order request:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to accept order request' },
      { status: 500 }
    )
  }
}
