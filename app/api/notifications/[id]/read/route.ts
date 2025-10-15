import { NextRequest, NextResponse } from 'next/server'
import { markAsRead } from '@/lib/services/notifications'
import { requireAuth } from '@/lib/auth/api-auth'

export async function PATCH(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const params = await paramsPromise
  try {
    const user = await requireAuth(req)

    await markAsRead(BigInt(params.id), BigInt(user.userId))
    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
