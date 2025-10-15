import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

// GET /api/orders/count - Get orders count
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return NextResponse.json({ count: 0 })
    }

    const client = await prisma.client.findUnique({
      where: { userId: BigInt(session.user.id) }
    })

    if (!client) {
      return NextResponse.json({ count: 0 })
    }

    const count = await prisma.order.count({
      where: {
        userId: client.id
      }
    })

    return NextResponse.json({ count })
  } catch (error: any) {
    return NextResponse.json({ count: 0 })
  }
}

