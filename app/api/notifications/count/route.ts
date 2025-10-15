import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/api-auth'
import { prisma } from '@/lib/db/prisma'

export async function GET(req: NextRequest) {
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
