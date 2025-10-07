import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'
import { CreateAuctionDto } from '@/lib/validations/auctions'
import { createAuction, listAuctions } from '@/lib/services/auctions'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const filters = {
      status: searchParams.get('status') || undefined,
      storeId: searchParams.get('storeId') || undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20
    }

    const result = await listAuctions(filters)

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des enchères' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const vendor = await prisma.vendor.findUnique({
      where: { userId: BigInt(session.user.id) }
    })

    if (!vendor) {
      return NextResponse.json({ error: 'Accès vendeur requis' }, { status: 403 })
    }

    const body = await request.json()
    const data = CreateAuctionDto.parse(body)

    const store = await prisma.store.findFirst({
      where: { id: BigInt(data.storeId), sellerId: vendor.id }
    })

    if (!store) {
      return NextResponse.json({ error: 'Boutique non trouvée' }, { status: 403 })
    }

    const auction = await createAuction({
      productId: BigInt(data.productId),
      storeId: BigInt(data.storeId),
      title: data.title,
      startPrice: data.startPrice,
      reservePrice: data.reservePrice,
      minIncrement: data.minIncrement,
      startAt: data.startAt ? new Date(data.startAt) : undefined,
      endAt: new Date(data.endAt)
    })

    return NextResponse.json({ message: 'Enchère créée avec succès', auction })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création de l\'enchère' },
      { status: 500 }
    )
  }
}
