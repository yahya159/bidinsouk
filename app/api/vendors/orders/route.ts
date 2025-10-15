import { NextRequest, NextResponse } from 'next/server'
import { getVendorOrders } from '@/lib/services/vendors'
import { requireRole, getVendorId } from '@/lib/auth/api-auth'

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url)
    const storeId = searchParams.get('storeId')

    const orders = await getVendorOrders(
      vendorId,
      storeId ? BigInt(storeId) : undefined
    )

    return NextResponse.json({ orders })
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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
