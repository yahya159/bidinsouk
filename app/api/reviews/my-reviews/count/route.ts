import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

// GET /api/reviews/my-reviews/count - Get count of reviews by current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return NextResponse.json({ count: 0 })
    }

    // Get client profile
    const client = await prisma.client.findUnique({
      where: { userId: BigInt(session.user.id) }
    })

    if (!client) {
      return NextResponse.json({ count: 0 })
    }

    // Count reviews by user
    const count = await prisma.review.count({
      where: {
        clientId: client.id
      }
    })

    return NextResponse.json({ count })
  } catch (error: any) {
    return NextResponse.json({ count: 0 })
  }
}

