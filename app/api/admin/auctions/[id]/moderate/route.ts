import { NextRequest, NextResponse } from 'next/server'
import { moderateAuction } from '@/lib/services/admin'
import { requireRole } from '@/lib/auth/api-auth'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params

    const user = await requireRole(req, ['ADMIN'])

    const { status } = await req.json()
    if (!['SCHEDULED', 'ARCHIVED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const auction = await moderateAuction(BigInt(params.id), status)
    return NextResponse.json({ auction })
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
