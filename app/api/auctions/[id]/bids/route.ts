/**
 * AUCTION BID PLACEMENT API
 * 
 * POST /api/auctions/:id/bids - Place a bid (with optional proxy bidding)
 * GET  /api/auctions/:id/bids - Get bid history
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/config';
import { placeBid, executeBuyNow } from '@/lib/services/auction-bidding';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import type { Prisma, BidStatus } from '@prisma/client';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const placeBidSchema = z.object({
  amount: z.number().positive('Bid amount must be positive'),
  maxAmount: z.number().positive().optional(),
  type: z.enum(['regular', 'proxy', 'buyNow']).default('regular')
});

// ============================================================================
// POST - Place Bid
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const session = await getServerSession(authConfig);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required', errorCode: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Get auction ID
    const resolvedParams = await params;
    let auctionId: bigint;
    try {
      auctionId = BigInt(resolvedParams.id);
    } catch {
      return NextResponse.json(
        { error: 'Invalid auction ID', errorCode: 'INVALID_AUCTION_ID' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = placeBidSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data', 
          errorCode: 'VALIDATION_ERROR',
          details: validation.error.issues 
        },
        { status: 400 }
      );
    }

    const { amount, maxAmount, type } = validation.data;
    let userId: bigint;
    try {
      userId = BigInt(session.user.id);
    } catch {
      return NextResponse.json(
        { error: 'Invalid user ID', errorCode: 'INVALID_USER' },
        { status: 400 }
      );
    }

    // Handle Buy Now
    if (type === 'buyNow') {
      const result = await executeBuyNow(auctionId, userId);
      
      if (!result.success) {
        return NextResponse.json(
          { 
            error: result.error, 
            errorCode: result.errorCode,
            auction: result.auction 
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Buy Now executed successfully!',
        bid: serializeBid(result.bid),
        auction: serializeAuction(result.auction)
      }, { status: 201 });
    }

    // Place regular or proxy bid
    const result = await placeBid(auctionId, userId, amount, maxAmount);
    
    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error, 
          errorCode: result.errorCode,
          auction: result.auction 
        },
        { status: 400 }
      );
    }

    // Success response
    return NextResponse.json({
      success: true,
      message: maxAmount 
        ? 'Bid placed with automatic bidding enabled'
        : 'Bid placed successfully',
      bid: serializeBid(result.bid),
      auction: serializeAuction(result.auction),
      wasExtended: result.wasExtended,
      proxyBidsTriggered: result.proxyBidsTriggered
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error in bid placement API:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        errorCode: 'INTERNAL_ERROR',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - Bid History
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    let auctionId: bigint;
    try {
      auctionId = BigInt(resolvedParams.id);
    } catch {
      return NextResponse.json(
        { error: 'Invalid auction ID' },
        { status: 400 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get('showAll') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    
    // Authentication (optional for public view, required for full details)
    const session = await getServerSession(authConfig);
    const userId = session?.user?.id;

    // Fetch auction to check ownership
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        store: {
          include: {
            seller: true
          }
        }
      }
    });

    if (!auction) {
      return NextResponse.json(
        { error: 'Auction not found' },
        { status: 404 }
      );
    }

    // Check if user is the seller or admin
    const isSellerOrAdmin = userId && (
      auction.store.seller.userId === BigInt(userId) ||
      session?.user?.role === 'ADMIN'
    );

    const publicBidStatuses: BidStatus[] = ['WINNING', 'WON'];
    const baseWhere: Prisma.BidWhereInput = { auctionId };

    const where: Prisma.BidWhereInput = showAll || isSellerOrAdmin
      ? baseWhere
      : {
          ...baseWhere,
          status: { in: publicBidStatuses }
        };

    // Fetch bids with pagination
    const [bids, total] = await Promise.all([
      prisma.bid.findMany({
        where,
        orderBy: [
          { amount: 'desc' },
          { createdAt: 'asc' }
        ],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          client: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true
                }
              }
            }
          }
        }
      }),
      prisma.bid.count({ where })
    ]);

    // Serialize bids (anonymize if not seller/admin)
    const serializedBids = bids.map((bid, index) => {
      const isOwnBid = userId && bid.client.userId === BigInt(userId);
      const showFullDetails = isSellerOrAdmin || isOwnBid;

      return {
        id: bid.id.toString(),
        amount: Number(bid.amount),
        maxAmount: showFullDetails && bid.maxAmount ? Number(bid.maxAmount) : null,
        status: bid.status,
        isProxyBid: bid.isProxyBid,
        isYourBid: isOwnBid,
        createdAt: bid.createdAt.toISOString(),
        bidder: showFullDetails ? {
          id: bid.client.user.id.toString(),
          name: bid.client.user.name,
          avatarUrl: bid.client.user.avatarUrl
        } : {
          id: 'anonymous',
          name: `Bidder ${String.fromCharCode(65 + index)}`, // A, B, C...
          avatarUrl: null
        }
      };
    });

    // Calculate statistics
    const stats = {
      totalBids: total,
      uniqueBidders: await prisma.bid.groupBy({
        by: ['clientId'],
        where: { auctionId },
        _count: true
      }).then(groups => groups.length),
      highestBid: bids[0] ? Number(bids[0].amount) : 0,
      lowestBid: bids[bids.length - 1] ? Number(bids[bids.length - 1].amount) : 0
    };

    return NextResponse.json({
      success: true,
      bids: serializedBids,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    console.error('Error fetching bid history:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function serializeBid(bid: any) {
  if (!bid) return null;
  
  return {
    id: bid.id.toString(),
    amount: Number(bid.amount),
    maxAmount: bid.maxAmount ? Number(bid.maxAmount) : null,
    status: bid.status,
    isProxyBid: bid.isProxyBid,
    createdAt: bid.createdAt.toISOString(),
    bidder: bid.client ? {
      id: bid.client.userId.toString(),
      name: bid.client.user.name,
      avatarUrl: bid.client.user.avatarUrl
    } : null
  };
}

function serializeAuction(auction: any) {
  if (!auction) return null;
  
  return {
    id: auction.id.toString(),
    currentBid: Number(auction.currentBid),
    reserveMet: auction.reserveMet,
    status: auction.status,
    endAt: auction.endAt.toISOString(),
    extensionCount: auction.extensionCount,
    winnerId: auction.winnerId?.toString() || null
  };
}





