import { NextRequest, NextResponse } from 'next/server'
import { getAuditLogs } from '@/lib/services/auditLogs'
import { requireRole, getVendorId } from '@/lib/auth/api-auth'

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, ['VENDOR', 'ADMIN'])

    const { searchParams } = new URL(req.url)
    const entity = searchParams.get('entity') || undefined
    const entityId = searchParams.get('entityId')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Vendors can only see their own logs, admins can see all
    let vendorId: bigint | null | undefined = undefined
    if (user.role === 'VENDOR') {
      vendorId = await getVendorId(req)
    }

    const result = await getAuditLogs({
      vendorId: vendorId || undefined,
      entity,
      entityId: entityId ? BigInt(entityId) : undefined,
      limit,
      offset
    })

    return NextResponse.json(result)
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
