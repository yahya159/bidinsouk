import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

function getCurrentUser(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  const role = req.headers.get('x-user-role')
  if (!userId) return null
  return { userId, role }
}

export async function GET(req: NextRequest) {
  try {
    const user = getCurrentUser(req)
    if (!user || user.role !== 'VENDOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status') || undefined

    // Récupérer les avis sur les produits du vendeur
    const whereClause: any = {
      product: {
        store: {
          sellerId: BigInt(user.userId)
        }
      }
    }

    if (status) {
      whereClause.status = status
    }

    const reviews = await prisma.review.findMany({
      where: whereClause,
      include: {
        product: {
          select: {
            id: true,
            title: true,
          }
        },
        client: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    const total = await prisma.review.count({
      where: whereClause
    })

    // Convertir les BigInt en string pour la sérialisation
    const serializedReviews = reviews.map(review => ({
      ...review,
      id: review.id.toString(),
      productId: review.productId.toString(),
      clientId: review.clientId.toString(),
      createdAt: review.createdAt.toISOString(),
      product: {
        ...review.product,
        id: review.product.id.toString()
      },
      client: {
        id: review.client.id.toString(),
        name: review.client.user.name
      }
    }))

    return NextResponse.json({ reviews: serializedReviews, total })
  } catch (error: any) {
    console.error('Error fetching vendor reviews:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}