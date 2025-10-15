import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig as authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { isAdmin } from '@/lib/admin/permissions';
import { ActivityLogger } from '@/lib/admin/activity-logger';

const activityLogger = new ActivityLogger();

// POST /api/admin/auctions/[id]/extend - Extend auction end time
export async function POST(
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
    const { minutes } = body;

    if (!minutes || minutes <= 0) {
      return NextResponse.json(
        { error: 'Invalid extension duration' },
        { status: 400 }
      );
    }

    const auction = await prisma.auction.findUnique({
      where: { id: BigInt(params.id) },
    });

    if (!auction) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 });
    }

    // Calculate new end time
    const newEndAt = new Date(auction.endAt);
    newEndAt.setMinutes(newEndAt.getMinutes() + minutes);

    // Update auction
    const updatedAuction = await prisma.auction.update({
      where: { id: BigInt(params.id) },
      data: {
        endAt: newEndAt,
      },
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
        action: 'AUCTION_EXTENDED',
        entity: 'Auction',
        entityId: updatedAuction.id,
        metadata: {
          title: updatedAuction.title,
          extensionMinutes: minutes,
          oldEndAt: auction.endAt,
          newEndAt: newEndAt,
        },
      },
      request
    );

    // Serialize response
    const serializedAuction = {
      ...updatedAuction,
      id: updatedAuction.id.toString(),
      productId: updatedAuction.productId?.toString() || null,
      storeId: updatedAuction.storeId.toString(),
      minIncrement: updatedAuction.minIncrement.toString(),
      currentBid: updatedAuction.currentBid.toString(),
      startPrice: updatedAuction.startPrice.toString(),
      reservePrice: updatedAuction.reservePrice?.toString() || null,
      product: updatedAuction.product
        ? {
            ...updatedAuction.product,
            id: updatedAuction.product.id.toString(),
            storeId: updatedAuction.product.storeId.toString(),
            price: updatedAuction.product.price?.toString() || null,
            compareAtPrice: updatedAuction.product.compareAtPrice?.toString() || null,
          }
        : null,
      store: {
        ...updatedAuction.store,
        id: updatedAuction.store.id.toString(),
        sellerId: updatedAuction.store.sellerId.toString(),
        seller: {
          ...updatedAuction.store.seller,
          id: updatedAuction.store.seller.id.toString(),
          userId: updatedAuction.store.seller.userId.toString(),
          user: {
            ...updatedAuction.store.seller.user,
            id: updatedAuction.store.seller.user.id.toString(),
          },
        },
      },
    };

    return NextResponse.json(serializedAuction);
  } catch (error) {
    console.error('Error extending auction:', error);
    return NextResponse.json(
      { error: 'Failed to extend auction' },
      { status: 500 }
    );
  }
}
