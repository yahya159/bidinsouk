import { NextRequest, NextResponse } from 'next/server'
import { updateOrderFulfillmentStatus } from '@/lib/services/vendors'
import { requireRole, getVendorId } from '@/lib/auth/api-auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const user = await requireRole(req, ['VENDOR'])
    
    const vendorId = await getVendorId(req)
    if (!vendorId) {
      return NextResponse.json(
        { 
          error: 'Vendor profile required',
          message: 'Please complete vendor application first'
        },
        { status: 403 }
      )
    }

    const { status } = await req.json()
    const validStatuses = ['PENDING', 'PREPARING', 'READY_FOR_PICKUP', 'SHIPPED', 'DELIVERED', 'CANCELED']
    
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const order = await updateOrderFulfillmentStatus(
      BigInt(id),
      vendorId,
      status
    )

    return NextResponse.json({ order })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    if (error.message === 'Forbidden') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
