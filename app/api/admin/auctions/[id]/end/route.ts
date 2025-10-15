import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig as authOptions } from '@/lib/auth/config';
import { prisma} from '@/lib/db/prisma';
import { isAdmin } from '@/lib/admin/permissions';
import { ActivityLogger } from '@/lib/admin/activity-logger';

const activityLogger = new ActivityLogger();

// POST /api/admin/auctions/[id]/end - End auction early
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

    const auction = await prisma.auction.findUnique({
      where: { id: BigInt(params.id) },
    });

    if (!auction) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 });
    }

    if (auction.status === 'ENDED' || auction.status === 'ARCHIVED') {
      return NextResponse.json(
        { error: 'Auction is already ended' },
        { status: 400 }
      );
    }

    // Update auction to ended status
    const updatedAuction = await prisma.auction.update({
      where: { id: BigInt(params.id) },
      data: {
        status: 'ENDED',
        endAt: new Date(), // Set end time to now
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
        action: 'AUCTION_ENDED_EARLY',
        entity: 'Auction',
        entityId: updatedAuction.id,
        metadata: {
          title: updatedAuction.title,
          originalEndAt: auction.endAt,
          actualEndAt: new Date(),
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
    console.error('Error ending auction:', error);
    return NextResponse.json(
      { error: 'Failed to end auction' },
      { status: 500 }
    );
  }
}
