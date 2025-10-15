import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig as authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { isAdmin } from '@/lib/admin/permissions';
import { ActivityLogger } from '@/lib/admin/activity-logger';
import { AuctionStatus } from '@prisma/client';

const activityLogger = new ActivityLogger();

// GET /api/admin/auctions/[id] - Get auction details with bid history
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;

    const session = await getServerSession(authOptions);
    if (!session?.user || !isAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auction = await prisma.auction.findUnique({
      where: { id: BigInt(params.id) },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            images: true,
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
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        bids: {
          orderBy: { createdAt: 'desc' },
          include: {
            client: {
              select: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!auction) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 });
    }

    // Serialize response
    const serializedAuction = {
      ...auction,
      id: auction.id.toString(),
      productId: auction.productId?.toString() || null,
      storeId: auction.storeId.toString(),
      minIncrement: auction.minIncrement.toString(),
      currentBid: auction.currentBid.toString(),
      startPrice: auction.startPrice.toString(),
      reservePrice: auction.reservePrice?.toString() || null,
      product: auction.product
        ? {
            id: auction.product.id.toString(),
            title: auction.product.title,
            images: auction.product.images,
          }
        : null,
      store: {
        id: auction.store.id.toString(),
        name: auction.store.name,
        seller: {
          user: {
            id: auction.store.seller.user.id.toString(),
            name: auction.store.seller.user.name,
            email: auction.store.seller.user.email,
          },
        },
      },
      bids: auction.bids.map((bid) => ({
        id: bid.id.toString(),
        auctionId: bid.auctionId.toString(),
        clientId: bid.clientId.toString(),
        amount: bid.amount.toString(),
        isAuto: bid.isAuto,
        createdAt: bid.createdAt,
        client: {
          user: {
            id: bid.client.user.id.toString(),
            name: bid.client.user.name,
            email: bid.client.user.email,
          },
        },
      })),
    };

    return NextResponse.json(serializedAuction);
  } catch (error) {
    console.error('Error fetching auction:', error);
    return NextResponse.json(
      { error: 'Failed to fetch auction' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/auctions/[id] - Update auction
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;

    const session = await getServerSession(authOptions);
    if (!session?.user || !isAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      category,
      startPrice,
      reservePrice,
      minIncrement,
      startAt,
      endAt,
      autoExtend,
      extendMinutes,
      status,
    } = body;

    // Get existing auction
    const existingAuction = await prisma.auction.findUnique({
      where: { id: BigInt(params.id) },
    });

    if (!existingAuction) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 });
    }

    // Validate dates if provided
    if (startAt && endAt) {
      const startDate = new Date(startAt);
      const endDate = new Date(endAt);
      if (endDate <= startDate) {
        return NextResponse.json(
          { error: 'End date must be after start date' },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (startPrice !== undefined) updateData.startPrice = parseFloat(startPrice);
    if (reservePrice !== undefined)
      updateData.reservePrice = reservePrice ? parseFloat(reservePrice) : null;
    if (minIncrement !== undefined)
      updateData.minIncrement = parseFloat(minIncrement);
    if (startAt !== undefined) updateData.startAt = new Date(startAt);
    if (endAt !== undefined) updateData.endAt = new Date(endAt);
    if (autoExtend !== undefined) updateData.autoExtend = autoExtend;
    if (extendMinutes !== undefined) updateData.extendMinutes = extendMinutes;
    if (status !== undefined) updateData.status = status as AuctionStatus;

    // Update auction
    const auction = await prisma.auction.update({
      where: { id: BigInt(params.id) },
      data: updateData,
      include: {
        product: true,
        store: {
          include: {
            seller: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    // Log activity
    await activityLogger.log(
      BigInt(session.user.id),
      {
        action: 'AUCTION_UPDATED',
        entity: 'Auction',
        entityId: auction.id,
        metadata: {
          title: auction.title,
          changes: Object.keys(updateData),
        },
      },
      request
    );

    // Serialize response
    const serializedAuction = {
      ...auction,
      id: auction.id.toString(),
      productId: auction.productId?.toString() || null,
      storeId: auction.storeId.toString(),
      minIncrement: auction.minIncrement.toString(),
      currentBid: auction.currentBid.toString(),
      startPrice: auction.startPrice.toString(),
      reservePrice: auction.reservePrice?.toString() || null,
      product: auction.product
        ? {
            ...auction.product,
            id: auction.product.id.toString(),
            storeId: auction.product.storeId.toString(),
            price: auction.product.price?.toString() || null,
            compareAtPrice: auction.product.compareAtPrice?.toString() || null,
          }
        : null,
      store: {
        ...auction.store,
        id: auction.store.id.toString(),
        sellerId: auction.store.sellerId.toString(),
        seller: {
          ...auction.store.seller,
          id: auction.store.seller.id.toString(),
          userId: auction.store.seller.userId.toString(),
          user: {
            ...auction.store.seller.user,
            id: auction.store.seller.user.id.toString(),
          },
        },
      },
    };

    return NextResponse.json(serializedAuction);
  } catch (error) {
    console.error('Error updating auction:', error);
    return NextResponse.json(
      { error: 'Failed to update auction' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/auctions/[id] - Delete auction
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;

    const session = await getServerSession(authOptions);
    if (!session?.user || !isAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auction = await prisma.auction.findUnique({
      where: { id: BigInt(params.id) },
      include: {
        bids: true,
      },
    });

    if (!auction) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 });
    }

    // Delete all bids first
    if (auction.bids.length > 0) {
      await prisma.bid.deleteMany({
        where: { auctionId: BigInt(params.id) },
      });
    }

    // Delete auction
    await prisma.auction.delete({
      where: { id: BigInt(params.id) },
    });

    // Log activity
    await activityLogger.log(
      BigInt(session.user.id),
      {
        action: 'AUCTION_DELETED',
        entity: 'Auction',
        entityId: BigInt(params.id),
        metadata: {
          title: auction.title,
          bidCount: auction.bids.length,
        },
      },
      request
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting auction:', error);
    return NextResponse.json(
      { error: 'Failed to delete auction' },
      { status: 500 }
    );
  }
}
