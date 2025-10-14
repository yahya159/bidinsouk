import { createAuction } from '@/lib/services/auctions';
import { prisma } from '@/lib/db/prisma';
import { CreateAuctionDto } from '@/lib/validations/auctions';
import { authConfig } from '@/lib/auth/config';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server'



export async function GET(request: NextRequest) {
  try {
    console.log('Fetching auctions...');
    const { searchParams } = new URL(request.url)
    
    const status = searchParams.get('status') || 'live'
    const page = Number(searchParams.get('page')) || 1
    const limit = Number(searchParams.get('limit')) || 20
    const q = searchParams.get('q')
    const sort = searchParams.get('sort') || 'ending_soon'
    const priceMin = Number(searchParams.get('priceMin')) || 0
    const priceMax = Number(searchParams.get('priceMax')) || 999999

    console.log('Parameters:', { status, page, limit, q, sort, priceMin, priceMax });

    // Build where clause for status filtering
    let whereClause: any = {}
    
    switch (status) {
      case 'live':
        whereClause.status = 'RUNNING'
        break
      case 'ended':
        whereClause.status = 'ENDED'
        break
      case 'upcoming':
        whereClause.status = 'SCHEDULED'
        break
      case 'ending_soon':
        whereClause.status = 'RUNNING'
        // Add condition for auctions ending within 24 hours
        const oneDayFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000)
        whereClause.endAt = {
          lte: oneDayFromNow
        }
        break
    }

    // Add search filter if provided (only search by title since description column doesn't exist)
    if (q) {
      whereClause.title = { contains: q, mode: 'insensitive' }
    }

    // Add price range filter
    if (priceMin > 0 || priceMax < 999999) {
      whereClause.currentBid = {
        gte: priceMin,
        lte: priceMax
      }
    }

    console.log('Where clause:', whereClause);

    // Get total count for pagination
    const total = await prisma.auction.count({
      where: whereClause
    })
    console.log('Total auctions:', total);

    // Build orderBy clause
    let orderBy: any = {}
    switch (sort) {
      case 'ending_soon':
        orderBy = { endAt: 'asc' }
        break
      case 'newest':
        orderBy = { createdAt: 'desc' }
        break
      case 'price_asc':
        orderBy = { currentBid: 'asc' }
        break
      case 'price_desc':
        orderBy = { currentBid: 'desc' }
        break
      case 'popular':
        // For now, sort by creation date as a proxy for popularity
        orderBy = { createdAt: 'desc' }
        break
      default:
        orderBy = { endAt: 'asc' }
    }

    console.log('Order by:', orderBy);

    // Get auctions from database (without trying to access non-existent description field)
    // Use raw query to avoid issues with the description column
    let auctionsQuery = `
      SELECT 
        id,
        storeId,
        productId,
        title,
        minIncrement,
        currentBid,
        startPrice,
        reservePrice,
        startAt,
        endAt,
        status
      FROM Auction
      WHERE status = ?
    `;
    
    const queryParams: any[] = [whereClause.status];
    
    // Add additional conditions
    if (whereClause.endAt?.lte) {
      auctionsQuery += ' AND endAt <= ?';
      queryParams.push(whereClause.endAt.lte);
    }
    
    if (q) {
      auctionsQuery += ' AND title LIKE ?';
      queryParams.push(`%${q}%`);
    }
    
    if (priceMin > 0) {
      auctionsQuery += ' AND currentBid >= ?';
      queryParams.push(priceMin);
    }
    
    if (priceMax < 999999) {
      auctionsQuery += ' AND currentBid <= ?';
      queryParams.push(priceMax);
    }
    
    // Add ordering
    if (orderBy.endAt === 'asc') {
      auctionsQuery += ' ORDER BY endAt ASC';
    } else if (orderBy.createdAt === 'desc') {
      auctionsQuery += ' ORDER BY endAt DESC';
    } else if (orderBy.currentBid === 'asc') {
      auctionsQuery += ' ORDER BY currentBid ASC';
    } else if (orderBy.currentBid === 'desc') {
      auctionsQuery += ' ORDER BY currentBid DESC';
    } else {
      auctionsQuery += ' ORDER BY endAt ASC';
    }
    
    // Add pagination
    auctionsQuery += ' LIMIT ? OFFSET ?';
    queryParams.push(limit, (page - 1) * limit);
    
    console.log('Executing query:', auctionsQuery, queryParams);
    
    // @ts-ignore
    const auctions: any[] = await prisma.$queryRawUnsafe(auctionsQuery, ...queryParams);
    console.log('Fetched auctions:', auctions.length);

    // Get related product and store information
    const auctionsWithRelations = await Promise.all(auctions.map(async (auction: any) => {
      // Get product info
      let product = null;
      if (auction.productId) {
        // @ts-ignore
        const productResult: any[] = await prisma.$queryRawUnsafe(
          'SELECT id, title FROM Product WHERE id = ?',
          auction.productId
        );
        // @ts-ignore
        product = productResult[0] || null;
      }
      
      // Get store info
      let store = null;
      if (auction.storeId) {
        // @ts-ignore
        const storeResult: any[] = await prisma.$queryRawUnsafe(
          'SELECT id, name FROM Store WHERE id = ?',
          auction.storeId
        );
        // @ts-ignore
        store = storeResult[0] || null;
      }
      
      return {
        ...auction,
        product,
        store
      };
    }));

    // Convert database auctions to API format
    const formattedAuctions = auctionsWithRelations.map((auction: any) => {
      // Use a default image since images are not directly on the auction model
      let imageUrl = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400'

      return {
        id: Number(auction.id),
        title: auction.title,
        // Note: Removed description since it's not in the Auction model
        startPrice: Number(auction.startPrice),
        currentPrice: Number(auction.currentBid),
        endAt: auction.endAt.toISOString(),
        image: imageUrl,
        status: auction.status,
        product: {
          id: Number(auction.product?.id || auction.id),
          title: auction.product?.title || auction.title
        },
        store: {
          name: auction.store?.name || 'Vendeur'
        }
      }
    })

    const result = {
      auctions: formattedAuctions,
      total,
      page,
      pages: Math.ceil(total / limit)
    }

    console.log('Returning result');
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
    console.error('Error creating auction:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création de l\'enchère' },
      { status: 500 }
    )
  }
}