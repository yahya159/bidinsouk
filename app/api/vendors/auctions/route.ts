import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

// Enhanced validation schemas
const createAuctionSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(200, 'Le titre ne peut pas dépasser 200 caractères'),
  description: z.string().min(1, 'La description est requise').max(2000, 'La description ne peut pas dépasser 2000 caractères'),
  images: z.array(z.string().url('URL d\'image invalide')).min(1, 'Au moins une image est requise').max(10, 'Maximum 10 images autorisées'),
  category: z.string().min(1, 'La catégorie est requise'),
  startPrice: z.number().min(1, 'Le prix de départ doit être supérieur à 0').max(1000000, 'Prix de départ trop élevé'),
  reservePrice: z.number().min(0).max(1000000).optional().nullable(),
  duration: z.number().min(1, 'La durée doit être d\'au moins 1 heure').max(168, 'La durée ne peut pas dépasser 7 jours'),
  startAt: z.string().optional(),
  autoExtend: z.boolean().optional().default(false),
  extendMinutes: z.number().min(1).max(30).optional().default(5),
});

const querySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  search: z.string().optional(),
  status: z.enum(['DRAFT', 'SCHEDULED', 'ACTIVE', 'ENDING_SOON', 'ENDED', 'CANCELLED']).optional(),
  category: z.string().optional(),
  sortBy: z.enum(['createdAt', 'endAt', 'currentBid', 'bidCount', 'views', 'title']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
});

// Database-based auction operations

// GET /api/vendors/auctions - List auctions with filtering and pagination
export async function GET(request: NextRequest) {
  console.log('🚀 GET /api/vendors/auctions - Starting request');
  
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Check if user is vendor or admin
    if (session?.user?.role !== 'VENDOR' && session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Get vendor's store
    const vendor = await prisma.vendor.findUnique({
      where: { userId: BigInt(session?.user?.id || '1') },
      include: { stores: true }
    });

    // Check if vendor profile exists
    if (!vendor) {
      return NextResponse.json(
        { 
          error: 'Vendor profile required',
          message: 'Please complete vendor application first'
        },
        { status: 403 }
      );
    }

    // Check if vendor has at least one active store
    const activeStore = vendor.stores.find(s => s.status === 'ACTIVE');
    if (!activeStore) {
      return NextResponse.json(
        { 
          error: 'Active store required',
          message: 'Please create and get approval for a store before creating auctions'
        },
        { status: 403 }
      );
    }

    const store = activeStore;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    
    // Build where clause
    const where: any = {
      storeId: store.id
    };
    
    if (status && status !== 'Tous') {
      where.status = status;
    }
    
    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive'
      };
    }

    // Get auctions with pagination
    const [auctions, totalCount] = await Promise.all([
      prisma.auction.findMany({
        where,
        include: {
          product: true,
          store: true,
          bids: {
            take: 1,
            orderBy: {
              createdAt: 'desc'
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.auction.count({ where })
    ]);

    // Format auctions for response
    const formattedAuctions = auctions.map(auction => ({
      id: auction.id.toString(),
      title: auction.title,
      description: auction.description,
      image: Array.isArray(auction.images) && auction.images.length > 0 
        ? auction.images[0] 
        : 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop&auto=format',
      productId: auction.productId?.toString(),
      status: auction.status,
      startingPrice: Number(auction.startPrice),
      reservePrice: auction.reservePrice ? Number(auction.reservePrice) : undefined,
      currentBid: Number(auction.currentBid),
      increment: Number(auction.minIncrement),
      bidCount: auction.bids.length,
      startTime: auction.startAt.toISOString(),
      endTime: auction.endAt.toISOString(),
      duration: Math.floor((auction.endAt.getTime() - auction.startAt.getTime()) / (1000 * 60 * 60)), // in hours
      views: auction.views,
      watchers: auction.watchers,
      autoBidEnabled: auction.autoExtend,
      antiSnipingEnabled: auction.extendMinutes > 0,
      winnerId: auction.winnerId?.toString(),
      winnerName: null, // Would need to join with user table to get this
      createdAt: auction.createdAt.toISOString(),
      updatedAt: auction.updatedAt.toISOString()
    }));

    // Calculate statistics
    const stats = await calculateAuctionStats(store.id);

    const response = {
      auctions: formattedAuctions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      },
      stats,
    };

    console.log('✅ Returning successful response with', formattedAuctions.length, 'auctions');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Erreur lors du chargement des enchères',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate auction statistics
async function calculateAuctionStats(storeId: bigint) {
  const [
    totalAuctions,
    activeAuctions,
    endingSoon,
    scheduledAuctions,
    archivedAuctions,
    totalRevenueResult,
    totalViews,
    totalWatchers,
    totalBidsResult
  ] = await Promise.all([
    prisma.auction.count({ where: { storeId } }),
    prisma.auction.count({ where: { storeId, status: { in: ['ACTIVE', 'RUNNING', 'ENDING_SOON'] } } }),
    prisma.auction.count({ where: { storeId, status: 'ENDING_SOON' } }),
    prisma.auction.count({ where: { storeId, status: 'SCHEDULED' } }),
    prisma.auction.count({ where: { storeId, status: 'ARCHIVED' } }),
    prisma.auction.aggregate({
      where: { storeId, status: 'ENDED' },
      _sum: { currentBid: true }
    }),
    prisma.auction.aggregate({
      where: { storeId },
      _sum: { views: true }
    }),
    prisma.auction.aggregate({
      where: { storeId },
      _sum: { watchers: true }
    }),
    prisma.bid.groupBy({
      by: ['auctionId'],
      where: {
        auction: { storeId }
      },
      _count: true
    })
  ]);

  const totalRevenue = totalRevenueResult._sum.currentBid ? Number(totalRevenueResult._sum.currentBid) : 0;
  const averageBidsPerAuction = totalBidsResult.length > 0 
    ? totalBidsResult.reduce((sum, item) => sum + item._count, 0) / totalBidsResult.length
    : 0;
  const conversionRate = totalAuctions > 0 ? (activeAuctions / totalAuctions) * 100 : 0;
  const averageSellingPrice = activeAuctions > 0 ? totalRevenue / activeAuctions : 0;

  return {
    totalAuctions,
    activeAuctions,
    endingSoon,
    scheduledAuctions,
    archivedAuctions,
    totalRevenue,
    totalViews: totalViews._sum.views || 0,
    totalWatchers: totalWatchers._sum.watchers || 0,
    averageBidsPerAuction: parseFloat(averageBidsPerAuction.toFixed(1)),
    conversionRate: parseFloat(conversionRate.toFixed(1)),
    averageSellingPrice: parseFloat(averageSellingPrice.toFixed(2)),
  };
}

// POST /api/vendors/auctions - Create new auction
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Check if user is vendor or admin
    if (session?.user?.role !== 'VENDOR' && session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createAuctionSchema.parse(body);

    // Calculate end time based on start time and duration
    const startAt = validatedData.startAt ? new Date(validatedData.startAt) : new Date();
    const endAt = new Date(startAt.getTime() + validatedData.duration * 60 * 60 * 1000);

    // Validate business rules
    if (startAt < new Date()) {
      return NextResponse.json(
        { error: 'La date de début ne peut pas être dans le passé' },
        { status: 400 }
      );
    }

    if (validatedData.reservePrice && validatedData.reservePrice <= validatedData.startPrice) {
      return NextResponse.json(
        { error: 'Le prix de réserve doit être supérieur au prix de départ' },
        { status: 400 }
      );
    }

    // Determine auction status based on start time
    let auctionStatus = 'SCHEDULED';
    if (validatedData.startAt) {
      const now = new Date();
      if (startAt <= now) {
        auctionStatus = 'RUNNING';
      } else {
        auctionStatus = 'SCHEDULED';
      }
    }

    // Get vendor's store
    const vendor = await prisma.vendor.findUnique({
      where: { userId: BigInt(session?.user?.id || '1') },
      include: { stores: true }
    });

    // Check if vendor profile exists
    if (!vendor) {
      return NextResponse.json(
        { 
          error: 'Vendor profile required',
          message: 'Please complete vendor application first'
        },
        { status: 403 }
      );
    }

    // Check if vendor has at least one active store
    const activeStore = vendor.stores.find(s => s.status === 'ACTIVE');
    if (!activeStore) {
      return NextResponse.json(
        { 
          error: 'Active store required',
          message: 'Please create and get approval for a store before creating auctions'
        },
        { status: 403 }
      );
    }

    const store = activeStore;

    // Create new auction in database
    const newAuction = await prisma.auction.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        images: validatedData.images,
        category: validatedData.category,
        startPrice: validatedData.startPrice,
        reservePrice: validatedData.reservePrice || null,
        currentBid: validatedData.startPrice,
        minIncrement: 10, // Default increment
        startAt: startAt,
        endAt: endAt,
        duration: validatedData.duration,
        autoExtend: validatedData.autoExtend || false,
        extendMinutes: validatedData.extendMinutes || 5,
        status: auctionStatus as any,
        storeId: store.id,
      },
      include: {
        store: {
          select: { id: true, name: true }
        }
      }
    });

    return NextResponse.json(
      { 
        message: 'Enchère créée avec succès',
        auction: newAuction 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating auction:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
