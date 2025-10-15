import { prisma } from '@/lib/db/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { pusher } from '@/lib/realtime/pusher';

export async function convertAuctionToOrder(auctionId: bigint, vendorId: bigint) {
  // Get the auction with winner information
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    include: {
      store: true,
      product: true,
      winner: {
        include: {
          user: true
        }
      }
    }
  });

  if (!auction) {
    throw new Error('Auction not found');
  }

  if (auction.status !== 'ENDED') {
    throw new Error('Auction is not ended');
  }

  if (!auction.winnerId) {
    throw new Error('No winner for this auction');
  }

  // Verify vendor owns this auction
  if (auction.store.sellerId !== vendorId) {
    throw new Error('Unauthorized: Vendor does not own this auction');
  }

  // Check if order already exists
  const existingOrder = await prisma.order.findFirst({
    where: {
      storeId: auction.storeId,
      userId: auction.winnerId
    }
  });

  if (existingOrder) {
    throw new Error('Order already exists for this auction');
  }

  // Create the order in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create the order
    const order = await tx.order.create({
      data: {
        userId: auction.winnerId!,
        storeId: auction.storeId,
        number: generateOrderNumber(),
        total: auction.currentBid,
        status: 'CONFIRMED',
        fulfillStatus: 'PENDING'
      }
    });

    // Update auction status to indicate order created
    await tx.auction.update({
      where: { id: auctionId },
      data: {
        status: 'ARCHIVED',
        updatedAt: new Date()
      }
    });

    // Create message thread between buyer and seller
    const thread = await tx.messageThread.create({
      data: {
        type: 'VENDOR_CHAT',
        subject: `Commande #${order.number} - ${auction.product?.title || auction.title}`,
        status: 'OPEN',
        priority: 'NORMAL',
        productId: auction.productId,
        orderId: order.id,
        participants: {
          create: [
            {
              userId: auction.winner!.userId,
              role: 'USER'
            },
            {
              userId: auction.store.sellerId,
              role: 'VENDOR'
            }
          ]
        }
      }
    });

    return { order, thread };
  });

  // Trigger Pusher events
  await pusher.trigger(`store-${auction.storeId}`, 'order:created', {
    order: {
      id: result.order.id.toString(),
      number: result.order.number,
      total: Number(result.order.total),
      createdAt: result.order.createdAt.toISOString()
    },
    auctionId: auctionId.toString()
  });

  await pusher.trigger(`user-${auction.winner!.userId}`, 'order:received', {
    order: {
      id: result.order.id.toString(),
      number: result.order.number,
      total: Number(result.order.total),
      storeName: auction.store.name,
      createdAt: result.order.createdAt.toISOString()
    }
  });

  return result;
}

function generateOrderNumber(): string {
  return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

export async function manuallyCreateOrderFromAuction(auctionId: bigint, vendorId: bigint) {
  return convertAuctionToOrder(auctionId, vendorId);
}
