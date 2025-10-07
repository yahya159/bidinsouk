import { NextRequest, NextResponse } from 'next/server'
import { getVendorStats } from '@/lib/services/vendors'

function getCurrentUser(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  const vendorId = req.headers.get('x-vendor-id')
  const role = req.headers.get('x-user-role')
  if (!userId || !vendorId) return null
  return { userId: BigInt(userId), vendorId: BigInt(vendorId), role }
}

export async function GET(req: NextRequest) {
  try {
    const user = getCurrentUser(req)
    if (!user || user.role !== 'VENDOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const storeId = searchParams.get('storeId')

    const stats = await getVendorStats(
      user.vendorId,
      storeId ? BigInt(storeId) : undefined
    )

    return NextResponse.json({ stats })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
