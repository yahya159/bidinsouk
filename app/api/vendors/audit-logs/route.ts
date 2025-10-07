import { NextRequest, NextResponse } from 'next/server'
import { getAuditLogs } from '@/lib/services/auditLogs'

function getCurrentUser(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  const vendorId = req.headers.get('x-vendor-id')
  const role = req.headers.get('x-user-role')
  if (!userId) return null
  return { userId: BigInt(userId), vendorId: vendorId ? BigInt(vendorId) : null, role }
}

export async function GET(req: NextRequest) {
  try {
    const user = getCurrentUser(req)
    if (!user || (user.role !== 'VENDOR' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const entity = searchParams.get('entity') || undefined
    const entityId = searchParams.get('entityId')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Vendors can only see their own logs, admins can see all
    const vendorId = user.role === 'VENDOR' ? user.vendorId : undefined

    const result = await getAuditLogs({
      vendorId: vendorId || undefined,
      entity,
      entityId: entityId ? BigInt(entityId) : undefined,
      limit,
      offset
    })

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
