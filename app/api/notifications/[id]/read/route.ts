import { NextRequest, NextResponse } from 'next/server'
import { markAsRead } from '@/lib/services/notifications'

function getCurrentUser(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return null
  return { userId: BigInt(userId) }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getCurrentUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await markAsRead(BigInt(params.id), user.userId)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
