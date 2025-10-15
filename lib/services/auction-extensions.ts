import { prisma } from '@/lib/db/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { pusher } from '@/lib/realtime/pusher';

export async function extendAuction(auctionId: bigint, extendMinutes: number) {
  // Get the current auction
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId }
  });

  if (!auction) {
    throw new Error('Auction not found');
  }

  if (auction.status !== 'ACTIVE' && auction.status !== 'RUNNING' && auction.status !== 'ENDING_SOON') {
    throw new Error('Auction is not active');
  }

  // Calculate new end time
  const newEndTime = new Date(auction.endAt.getTime() + extendMinutes * 60 * 1000);

  // Update the auction
  const updatedAuction = await prisma.auction.update({
    where: { id: auctionId },
    data: {
      endAt: newEndTime,
      extensionCount: {
        increment: 1
      },
      lastExtendedAt: new Date(),
      status: 'RUNNING' // Reset status to running after extension
    }
  });

  // Trigger Pusher event
  await pusher.trigger(`auction-${auctionId}`, 'auction:extended', {
    auction: {
      id: updatedAuction.id.toString(),
      endAt: updatedAuction.endAt.toISOString(),
      extensionCount: updatedAuction.extensionCount,
      lastExtendedAt: updatedAuction.lastExtendedAt?.toISOString()
    },
    extendMinutes,
    extendedBy: 'system'
  });

  return updatedAuction;
}

export async function autoExtendAuctionIfNeeded(auctionId: bigint) {
  // Get the current auction
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId }
  });

  if (!auction) {
    throw new Error('Auction not found');
  }

  if (!auction.autoExtend) {
    return null; // Auto-extension not enabled
  }

  // Check if we're within the extension window (last X minutes)
  const now = new Date();
  const timeUntilEnd = auction.endAt.getTime() - now.getTime();
  const extensionWindowMinutes = auction.extendMinutes || 5;
  const extensionWindowMs = extensionWindowMinutes * 60 * 1000;

  // If we're within the extension window, extend the auction
  if (timeUntilEnd > 0 && timeUntilEnd <= extensionWindowMs) {
    return await extendAuction(auctionId, extensionWindowMinutes);
  }

  return null; // No extension needed
}

export async function cancelAuction(auctionId: bigint, reason: string, cancelledBy?: bigint) {
  // Get the current auction
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId }
  });

  if (!auction) {
    throw new Error('Auction not found');
  }

  // Check if auction can be cancelled
  if (auction.status === 'ENDED' || auction.status === 'CANCELLED') {
    throw new Error('Auction cannot be cancelled');
  }

  // Update the auction
  const updatedAuction = await prisma.auction.update({
    where: { id: auctionId },
    data: {
      status: 'CANCELLED',
      updatedAt: new Date()
    }
  });

  // Create auction activity record
  await prisma.auctionActivity.create({
    data: {
      auctionId: auctionId,
      activityType: 'CANCELLED',
      userId: cancelledBy || BigInt(0),
      metadata: {
        reason: reason
      }
    }
  });

  // Trigger Pusher event
  await pusher.trigger(`auction-${auctionId}`, 'auction:cancelled', {
    auction: {
      id: updatedAuction.id.toString(),
      status: updatedAuction.status
    },
    reason
  });

  return updatedAuction;
}
