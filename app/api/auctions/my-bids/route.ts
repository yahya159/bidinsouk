import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

// GET /api/auctions/my-bids - Get auctions where user has placed bids
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Get client profile
    const client = await prisma.client.findUnique({
      where: { userId: BigInt(session.user.id) }
    })

    if (!client) {
      return NextResponse.json({ error: 'Profil client requis' }, { status: 403 })
    }

    // Get auctions where user has placed bids
    const auctions = await prisma.auction.findMany({
      where: {
        bids: {
          some: {
            clientId: client.id
          }
        }
      },
      include: {
        product: {
          select: {
            title: true
          }
        },
        bids: {
          where: {
            clientId: client.id
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        endAt: 'desc'
      }
    })

    return NextResponse.json(auctions)
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des enchères' },
      { status: 500 }
    )
  }
}

// Note: Removed GET_count as it's not a valid Next.js route handler
// To get count, use GET with ?count=true query param or create separate /count route
