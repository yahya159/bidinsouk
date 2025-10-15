import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireRole } from '@/lib/auth/api-auth'

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, ['ADMIN'])

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status') || undefined

    // Récupérer tous les avis avec les informations nécessaires
    const whereClause: any = {}
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
            store: {
              select: {
                id: true,
                name: true,
              }
            }
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
        id: review.product.id.toString(),
        store: {
          ...review.product.store,
          id: review.product.store.id.toString()
        }
      },
      client: {
        id: review.client.id.toString(),
        name: review.client.user.name
      }
    }))

    return NextResponse.json({ reviews: serializedReviews, total })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    if (error.message === 'Forbidden') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
    console.error('Error fetching admin reviews:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
