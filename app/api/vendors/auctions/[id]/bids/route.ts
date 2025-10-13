import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

// GET /api/vendors/auctions/[id]/bids - Get bid history for auction
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const auctionId = parseInt(params.id);
    
    if (isNaN(auctionId)) {
      return NextResponse.json(
        { error: 'ID d\'enchère invalide' },
        { status: 400 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Max 100 per page
    const includeAutomatic = searchParams.get('includeAutomatic') === 'true';
    const sortOrder = searchParams.get('sort') === 'asc' ? 'asc' : 'desc';

    // Get auction to check permissions
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        store: {
          select: {
            userId: true,
          }
        }
      }
    });

    if (!auction) {
      return NextResponse.json(
        { error: 'Enchère non trouvée' },
        { status: 404 }
      );
    }

    // Check access permissions
    const isOwner = auction.store.userId === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      );
    }

    // Build where clause
    const whereClause: any = {
      auctionId: auctionId,
    };

    // Filter automatic bids if requested
    if (!includeAutomatic) {
      whereClause.isAutomatic = false;
    }

    // Get total count for pagination
    const totalBids = await prisma.bid.count({
      where: whereClause
    });

    // Calculate pagination
    const totalPages = Math.ceil(totalBids / limit);
    const skip = (page - 1) * limit;

    // Get bids with pagination
    const bids = await prisma.bid.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: { createdAt: sortOrder },
      skip: skip,
      take: limit,
    });

    // Anonymize bidder information for privacy (except for admins)
    const anonymizedBids = bids.map((bid: any, index: number) => ({
      id: bid.id,
      amount: bid.amount,
      createdAt: bid.createdAt,
      isWinning: bid.isWinning,
      isAutomatic: bid.isAutomatic,
      bidder: {
        id: isAdmin ? bid.user.id : 'anonymous',
        name: isAdmin ? bid.user.name : `Utilisateur ${bid.user.id.toString().slice(-4)}`,
        email: isAdmin ? bid.user.email : null,
      },
      position: sortOrder === 'desc' ? skip + index + 1 : totalBids - skip - index,
    }));

    // Calculate bid statistics
    const bidAmounts = bids.map((bid: any) => bid.amount);
    const uniqueBidders = new Set(bids.map((bid: any) => bid.userId));
    
    const statistics = {
      totalBids: totalBids,
      uniqueBidders: uniqueBidders.size,
      averageBidAmount: bidAmounts.length > 0 
        ? bidAmounts.reduce((sum: number, amount: number) => sum + amount, 0) / bidAmounts.length 
        : 0,
      highestBid: bidAmounts.length > 0 ? Math.max(...bidAmounts) : 0,
      lowestBid: bidAmounts.length > 0 ? Math.min(...bidAmounts) : 0,
      automaticBids: bids.filter((bid: any) => bid.isAutomatic).length,
      manualBids: bids.filter((bid: any) => !bid.isAutomatic).length,
    };

    // Get bid frequency data (bids per hour for the last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentBids = await prisma.bid.findMany({
      where: {
        auctionId: auctionId,
        createdAt: {
          gte: twentyFourHoursAgo
        }
      },
      select: {
        createdAt: true,
        amount: true,
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group bids by hour
    const bidFrequency = Array.from({ length: 24 }, (_, i) => {
      const hourStart = new Date(twentyFourHoursAgo.getTime() + i * 60 * 60 * 1000);
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
      
      const bidsInHour = recentBids.filter((bid: any) => 
        bid.createdAt >= hourStart && bid.createdAt < hourEnd
      );
      
      return {
        hour: hourStart.toISOString(),
        bidCount: bidsInHour.length,
        averageAmount: bidsInHour.length > 0 
          ? bidsInHour.reduce((sum: number, bid: any) => sum + bid.amount, 0) / bidsInHour.length 
          : 0,
      };
    });

    const response = {
      bids: anonymizedBids,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalBids: totalBids,
        limit: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      statistics: statistics,
      bidFrequency: bidFrequency,
      filters: {
        includeAutomatic: includeAutomatic,
        sortOrder: sortOrder,
      },
      auction: {
        id: auction.id,
        title: auction.title,
        status: auction.status,
        currentBid: auction.currentBid,
        startingPrice: auction.startingPrice,
        endTime: auction.endTime,
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching auction bids:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}