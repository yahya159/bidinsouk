import { NextRequest, NextResponse } from 'next/server'
import { getUnreadCount } from '@/lib/services/notifications'

function getCurrentUser(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return null
  return { userId: BigInt(userId) }
}

export async function GET(req: NextRequest) {
  try {
    const user = getCurrentUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const count = await getUnreadCount(user.userId)
    return NextResponse.json({ count })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
