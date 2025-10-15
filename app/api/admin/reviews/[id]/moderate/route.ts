import { NextRequest, NextResponse } from 'next/server'
import { moderateReview } from '@/lib/services/admin'
import { requireRole } from '@/lib/auth/api-auth'

export async function POST(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const params = await paramsPromise
  try {
    const user = await requireRole(req, ['ADMIN'])

    const { status } = await req.json()
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const review = await moderateReview(BigInt(params.id), status)
    return NextResponse.json({ review })
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
