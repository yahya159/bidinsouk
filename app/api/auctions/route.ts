import { createAuction } from '@/lib/services/auctions';
import { prisma } from '@/lib/db/prisma';
import { CreateAuctionDto } from '@/lib/validations/auctions';
import { authConfig } from '@/lib/auth/config';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server'



export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const status = searchParams.get('status') || 'live'
    const page = Number(searchParams.get('page')) || 1
    const limit = Number(searchParams.get('limit')) || 20
    const q = searchParams.get('q')
    const sort = searchParams.get('sort') || 'ending_soon'
    const priceMin = Number(searchParams.get('priceMin')) || 0
    const priceMax = Number(searchParams.get('priceMax')) || 999999

    // Get auctions from database instead of mock data
    const auctions = await prisma.auction.findMany({
      include: {
        product: {
          select: {
            id: true,
            title: true,
          }
        },
        store: {
          select: {
            name: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Convert database auctions to API format
    let filteredAuctions = auctions.map(auction => ({
      id: Number(auction.id),
      title: auction.title,
      description: auction.description || '',
      startPrice: Number(auction.startPrice),
      currentPrice: Number(auction.currentBid),
      endAt: auction.endAt,
      image: Array.isArray(auction.images) && auction.images.length > 0 
        ? (auction.images[0] as any)?.url || auction.images[0] 
        : 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400',
      status: auction.status.toLowerCase(),
      product: {
        id: Number(auction.product?.id || auction.id),
        title: auction.product?.title || auction.title
      },
      store: {
        name: auction.store.name
      }
    }));
    
    // Filter by status
    if (status === 'live') {
      filteredAuctions = filteredAuctions.filter((auction: any) => auction.status === 'running')
    } else if (status === 'ended') {
      filteredAuctions = filteredAuctions.filter((auction: any) => auction.status === 'archived')
    } else if (status === 'upcoming') {
      filteredAuctions = filteredAuctions.filter((auction: any) => auction.status === 'scheduled')
    } else if (status === 'ending_soon') {
      // Auctions ending within 24 hours
      const oneDayFromNow = Date.now() + 24 * 60 * 60 * 1000;
      filteredAuctions = filteredAuctions.filter((auction: any) => 
        auction.status === 'running' && 
        new Date(auction.endAt).getTime() <= oneDayFromNow
      )
    }

    // Apply search filter
    if (q) {
      filteredAuctions = filteredAuctions.filter((auction: any) =>
        auction.title.toLowerCase().includes(q.toLowerCase()) ||
        auction.description.toLowerCase().includes(q.toLowerCase())
      )
    }

    // Apply price filter
    if (priceMin > 0 || priceMax < 999999) {
      filteredAuctions = filteredAuctions.filter((auction: any) =>
        auction.currentPrice >= priceMin && auction.currentPrice <= priceMax
      )
    }

    // Apply sorting
    switch (sort) {
      case 'ending_soon':
        filteredAuctions.sort((a, b) => new Date(a.endAt).getTime() - new Date(b.endAt).getTime())
        break
      case 'newest':
        filteredAuctions.sort((a, b) => b.id - a.id)
        break
      case 'price_asc':
        filteredAuctions.sort((a, b) => a.currentPrice - b.currentPrice)
        break
      case 'price_desc':
        filteredAuctions.sort((a, b) => b.currentPrice - a.currentPrice)
        break
      case 'popular':
        // Mock popularity sort
        filteredAuctions.sort((a, b) => b.id - a.id)
        break
    }

    // Pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedAuctions = filteredAuctions.slice(startIndex, endIndex)

    const result = {
      auctions: paginatedAuctions,
      total: filteredAuctions.length,
      page,
      pages: Math.ceil(filteredAuctions.length / limit)
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error fetching auctions:', error)
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
      let vendorStore = await prisma.store.findFirst({
        where: { 
          sellerId: vendor.id,
          status: 'ACTIVE'
        }
      })

      // Si aucune boutique active, créer une boutique par défaut
      if (!vendorStore) {
        vendorStore = await prisma.store.create({
          data: {
            sellerId: vendor.id,
            name: `Boutique de ${session.user.name || 'Vendeur'}`,
            slug: `store-${vendor.id}-${Date.now()}`,
            email: session.user.email || 'vendor@example.com',
            status: 'ACTIVE' // Auto-approve for auction creation
          }
        })
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
      reservePrice: data.reservePrice || undefined,
      minIncrement: data.minIncrement,
      startAt: data.startAt ? new Date(data.startAt) : undefined,
      endAt: new Date(data.endAt)
    })

    // Convert BigInt values to strings for JSON serialization
    const serializedAuction = {
      ...auction,
      id: auction.id.toString(),
      productId: auction.productId?.toString() || null,
      storeId: auction.storeId?.toString() || null,
      startPrice: auction.startPrice.toString(),
      reservePrice: auction.reservePrice?.toString() || null,
      minIncrement: auction.minIncrement.toString(),
      currentBid: auction.currentBid.toString(),
    }

    return NextResponse.json({ message: 'Enchère créée avec succès', auction: serializedAuction })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création de l\'enchère' },
      { status: 500 }
    )
  }
}