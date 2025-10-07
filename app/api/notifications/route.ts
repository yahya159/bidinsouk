import { NextRequest, NextResponse } from 'next/server'
import { getUserNotifications, markAllAsRead } from '@/lib/services/notifications'

function getCurrentUser(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return null
  return { userId: BigInt(userId) }
}

export async function GET(req: NextRequest) {
  try {
    const user = getCurrentUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const type = searchParams.get('type') || undefined
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const notifications = await getUserNotifications(user.userId, {
      unreadOnly,
      type,
      limit,
      offset
    })

    return NextResponse.json({ notifications })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = getCurrentUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await markAllAsRead(user.userId)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
