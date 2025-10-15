import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig as authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { isAdmin } from '@/lib/admin/permissions';
import { ActivityLogger } from '@/lib/admin/activity-logger';
import { AuctionStatus, Prisma } from '@prisma/client';

const activityLogger = new ActivityLogger();

// GET /api/admin/auctions - List all auctions with pagination, search, and filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !isAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const storeId = searchParams.get('storeId') || '';
    const status = searchParams.get('status') || '';
    const category = searchParams.get('category') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const priceMin = searchParams.get('priceMin') || '';
    const priceMax = searchParams.get('priceMax') || '';

    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: Prisma.AuctionWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (storeId) {
      where.storeId = BigInt(storeId);
    }

    if (status) {
      where.status = status as AuctionStatus;
    }

    if (category) {
      where.category = category;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    if (priceMin || priceMax) {
      where.currentBid = {};
      if (priceMin) {
        where.currentBid.gte = parseFloat(priceMin);
      }
      if (priceMax) {
        where.currentBid.lte = parseFloat(priceMax);
      }
    }

    // Fetch auctions with related data
    const [auctions, totalCount] = await Promise.all([
      prisma.auction.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: {
              id: true,
              title: true,
            },
          },
          store: {
            select: {
              id: true,
              name: true,
              seller: {
                select: {
                  user: {
                    select: {
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
          bids: {
            select: {
              id: true,
            },
          },
        },
      }),
      prisma.auction.count({ where }),
    ]);

    // Convert BigInt to string for JSON serialization
    const serializedAuctions = auctions.map((auction) => ({
      ...auction,
      id: auction.id.toString(),
      productId: auction.productId?.toString() || null,
      storeId: auction.storeId.toString(),
      minIncrement: auction.minIncrement.toString(),
      currentBid: auction.currentBid.toString(),
      startPrice: auction.startPrice.toString(),
      reservePrice: auction.reservePrice?.toString() || null,
      bidCount: auction.bids.length,
      product: auction.product
        ? {
            id: auction.product.id.toString(),
            title: auction.product.title,
          }
        : null,
      store: {
        id: auction.store.id.toString(),
        name: auction.store.name,
        seller: {
          user: {
            name: auction.store.seller.user.name,
            email: auction.store.seller.user.email,
          },
        },
      },
      bids: undefined,
    }));

    return NextResponse.json({
      auctions: serializedAuctions,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    });
  } catch (error) {
    console.error('Error fetching auctions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch auctions' },
      { status: 500 }
    );
  }
}

// POST endpoint removed - Admins cannot create auctions
// Auctions should only be created by vendors through their own dashboard
