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

    // Si storeId est fourni, vérifier que la boutique appartient au vendeur
    let storeId = null;
    if (data.storeId) {
      const store = await prisma.store.findFirst({
        where: { id: BigInt(data.storeId), sellerId: vendor.id }
      })

      if (!store) {
        return NextResponse.json({ error: 'Boutique non trouvée' }, { status: 403 })
      }
      
      // Vérifier que la boutique est active
      if (store.status !== 'ACTIVE') {
        return NextResponse.json({ error: `La boutique "${store.name}" est actuellement ${store.status === 'PENDING' ? 'en attente d\'approbation' : store.status.toLowerCase()}. Veuillez attendre l'approbation de l'administrateur pour créer des enchères.` }, { status: 403 })
      }
      
      storeId = BigInt(data.storeId);
    } else {
      // Si storeId n'est pas fourni, utiliser la première boutique active du vendeur
      const vendorStore = await prisma.store.findFirst({
        where: { 
          sellerId: vendor.id,
          status: 'ACTIVE'
        }
      })

      if (!vendorStore) {
        return NextResponse.json({ error: 'Aucune boutique active trouvée pour ce vendeur. Veuillez créer une boutique et attendre son approbation.' }, { status: 403 })
      }
      
      storeId = vendorStore.id;
    }

    // Créer un produit temporaire basé sur la catégorie
    const product = await prisma.product.create({
      data: {
        storeId: storeId,
        title: data.title,
        category: data.category,
        condition: 'USED', // Valeur par défaut
        status: 'ACTIVE'
      }
    });

    const auction = await createAuction({
      productId: product.id,
      storeId: storeId,
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