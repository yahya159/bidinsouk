import { NextRequest, NextResponse } from 'next/server'
import { getUserNotifications, markAllAsRead } from '@/lib/services/notifications'
import { requireAuth } from '@/lib/auth/api-auth'
import { prisma } from '@/lib/db/prisma'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req)

    const { searchParams } = new URL(req.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const type = searchParams.get('type') || undefined
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const notifications = await getUserNotifications(BigInt(user.userId), {
      unreadOnly,
      type,
      limit,
      offset
    })

    return NextResponse.json({ notifications })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET /api/notifications/count - Get unread notifications count
export async function GET_count(req: NextRequest) {
  try {
    const user = await requireAuth(req)

    const count = await prisma.notification.count({
      where: {
        userId: BigInt(user.userId),
        readAt: null
      }
    })

    return NextResponse.json({ count })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ count: 0 })
    }
    return NextResponse.json({ count: 0 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth(req)

    await markAllAsRead(BigInt(user.userId))
    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}