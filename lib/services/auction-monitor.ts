/**
 * AUCTION MONITORING & AUTOMATION SERVICE
 * 
 * Responsibilities:
 * - Detect ended auctions and mark winners
 * - Transition auction states (SCHEDULED → ACTIVE → ENDING_SOON → ENDED)
 * - Handle reserve price logic (success/failure)
 * - Send notifications to winners and losers
 * - Clean up old auction data
 * 
 * This service should be called by:
 * - Cron job (every 1-5 minutes)
 * - Vercel Cron (serverless function)
 * - Manual trigger via API
 * 
 * @module auction-monitor
 */

import { prisma } from '@/lib/db/prisma';
import { pusher } from '@/lib/realtime/pusher';

export async function updateAuctionStatuses() {
  const now = new Date();
  
  // Update auctions that should be running
  const scheduledAuctions = await prisma.auction.findMany({
    where: {
      status: 'SCHEDULED',
      startAt: {
        lte: now
      }
    }
  });

  for (const auction of scheduledAuctions) {
    await prisma.auction.update({
      where: { id: auction.id },
      data: { status: 'RUNNING' }
    });

    // Trigger Pusher event
    await pusher.trigger(`auction-${auction.id}`, 'auction:started', {
      auctionId: auction.id.toString(),
      status: 'RUNNING',
      startedAt: now.toISOString()
    });
  }

  // Update auctions that should be ending soon (within 1 hour)
  const endingSoonThreshold = new Date(now.getTime() + 60 * 60 * 1000);
  
  const activeAuctions = await prisma.auction.findMany({
    where: {
      status: 'RUNNING',
      endAt: {
        lte: endingSoonThreshold,
        gt: now
      }
    }
  });

  for (const auction of activeAuctions) {
    await prisma.auction.update({
      where: { id: auction.id },
      data: { status: 'ENDING_SOON' }
    });

    // Trigger Pusher event
    await pusher.trigger(`auction-${auction.id}`, 'auction:ending_soon', {
      auctionId: auction.id.toString(),
      status: 'ENDING_SOON',
      endsAt: auction.endAt.toISOString()
    });
  }

  // Update auctions that have ended
  const endedAuctions = await prisma.auction.findMany({
    where: {
      status: { in: ['RUNNING', 'ENDING_SOON'] },
      endAt: {
        lte: now
      }
    },
    include: {
      bids: {
        orderBy: { amount: 'desc' },
        take: 1
      }
    }
  });

  for (const auction of endedAuctions) {
    // Determine winner
    let winnerId = null;
    if (auction.bids.length > 0) {
      const winningBid = auction.bids[0];
      winnerId = winningBid.clientId;
      
      // Update bid status to WON
      await prisma.bid.update({
        where: { id: winningBid.id },
        data: { status: 'WON' }
      });
      
      // Update other bids to LOST
      await prisma.bid.updateMany({
        where: {
          auctionId: auction.id,
          id: { not: winningBid.id }
        },
        data: { status: 'LOST' }
      });
    }

    // Update auction
    await prisma.auction.update({
      where: { id: auction.id },
      data: {
        status: 'ENDED',
        winnerId: winnerId,
        reserveMet: auction.reservePrice ? 
          auction.currentBid >= auction.reservePrice : true
      }
    });

    // Trigger Pusher event
    await pusher.trigger(`auction-${auction.id}`, 'auction:ended', {
      auctionId: auction.id.toString(),
      status: 'ENDED',
      winnerId: winnerId ? winnerId.toString() : null,
      finalBid: Number(auction.currentBid)
    });
  }

  return {
    scheduledStarted: scheduledAuctions.length,
    markedEndingSoon: activeAuctions.length,
    ended: endedAuctions.length
  };
}

export async function getAuctionStatusSummary() {
  const counts = await prisma.auction.groupBy({
    by: ['status'],
    _count: true
  });

  const summary: Record<string, number> = {};
  for (const item of counts) {
    summary[item.status] = item._count;
  }

  return summary;
}

// Alias for backward compatibility
export const monitorAuctions = updateAuctionStatuses;