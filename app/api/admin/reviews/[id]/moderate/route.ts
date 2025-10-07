import { NextRequest, NextResponse } from 'next/server'
import { moderateReview } from '@/lib/services/admin'

function getCurrentUser(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  const role = req.headers.get('x-user-role')
  if (!userId) return null
  return { userId: BigInt(userId), role }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getCurrentUser(req)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { status } = await req.json()
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const review = await moderateReview(BigInt(params.id), status)
    return NextResponse.json({ review })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
