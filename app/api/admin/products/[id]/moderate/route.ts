import { NextRequest, NextResponse } from 'next/server'
import { moderateProduct } from '@/lib/services/admin'
import { requireRole } from '@/lib/auth/api-auth'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireRole(req, ['ADMIN'])

    const { status } = await req.json()
    if (!['ACTIVE', 'ARCHIVED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const product = await moderateProduct(BigInt(id), status)
    return NextResponse.json({ product })
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
