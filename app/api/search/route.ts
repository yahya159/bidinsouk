import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 20

    if (!query || query.length < 2) {
      return NextResponse.json({ products: [], auctions: [], total: 0 })
    }

    const [products, auctions] = await Promise.all([
      prisma.product.findMany({
        where: {
          OR: [
            { title: { contains: query } },
            { brand: { contains: query } }
          ],
          status: 'ACTIVE'
        },
        include: { store: true, offers: { where: { active: true } } },
        take: limit
      }),
      prisma.auction.findMany({
        where: {
          title: { contains: query },
          status: { in: ['RUNNING', 'ENDING_SOON', 'SCHEDULED'] }
        },
        include: { product: true, store: true },
        take: limit
      })
    ])

    return NextResponse.json({
      products,
      auctions,
      total: products.length + auctions.length
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erreur lors de la recherche' },
      { status: 500 }
    )
  }
}
