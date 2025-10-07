import { NextRequest, NextResponse } from 'next/server'
import { updateOrderFulfillmentStatus } from '@/lib/services/vendors'

function getCurrentUser(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  const vendorId = req.headers.get('x-vendor-id')
  const role = req.headers.get('x-user-role')
  if (!userId || !vendorId) return null
  return { userId: BigInt(userId), vendorId: BigInt(vendorId), role }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getCurrentUser(req)
    if (!user || user.role !== 'VENDOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { status } = await req.json()
    const validStatuses = ['PENDING', 'PREPARING', 'READY_FOR_PICKUP', 'SHIPPED', 'DELIVERED', 'CANCELED']
    
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const order = await updateOrderFulfillmentStatus(
      BigInt(params.id),
      user.vendorId,
      status
    )

    return NextResponse.json({ order })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
