import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

// GET /api/reviews/my-reviews - Get reviews by current user
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

    // Get reviews by user
    const reviews = await prisma.review.findMany({
      where: {
        clientId: client.id
      },
      include: {
        product: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(reviews)
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des avis' },
      { status: 500 }
    )
  }
}

