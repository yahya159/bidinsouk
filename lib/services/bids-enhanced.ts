import { prisma } from '@/lib/db/prisma';
import { pusher } from '@/lib/realtime/pusher';
import { Decimal } from '@prisma/client/runtime/library';

interface PlaceBidResult {
  success: boolean;
  bid?: any;
  auction?: any;
  error?: string;
}

/**
 * Enhanced bid placement with comprehensive error handling,
 * race condition prevention, and auto-extend support
 */
export async function placeBidEnhanced(
  auctionId: number,
  userId: number,
  amount: number
): Promise<PlaceBidResult> {
  try {
    // Use serializable transaction to prevent race conditions
    const result = await prisma.$transaction(
      async (tx) => {
        // 1. Lock and fetch auction (prevents concurrent modifications)
        const auction = await tx.auction.findUnique({
          where: { id: BigInt(auctionId) },
          include: {
            bids: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
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

        if (!auction) {
          throw new Error('Auction not found');
        }

        // 2. Validate auction status
        if (auction.status !== 'RUNNING' && auction.status !== 'ENDING_SOON') {
          throw new Error(`Auction is not active (status: ${auction.status})`);
        }

        // 3. Check if auction has ended
        const now = new Date();
        if (auction.endAt < now) {
          throw new Error('Auction has already ended');
        }

        // 4. Validate bid amount against CURRENT state (prevents race conditions)
        const currentBid = Number(auction.currentBid);
        const minIncrement = Number(auction.minIncrement);
        const minBid = currentBid > 0 ? currentBid + minIncrement : Number(auction.startPrice);

        if (amount < minBid) {
          throw new Error(
            `Bid must be at least ${new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
            }).format(minBid)}`
          );
        }

        // 5. Check if user is bidding against themselves
        const lastBid = auction.bids[0];
        if (lastBid && Number(lastBid.clientId) === userId) {
          throw new Error('You are already the highest bidder');
        }

        // 6. Check if user is the seller
        if (Number(auction.store.seller.userId) === userId) {
          throw new Error('Sellers cannot bid on their own auctions');
        }

        // 7. Create the bid
        const bid = await tx.bid.create({
          data: {
            auctionId: BigInt(auctionId),
            clientId: BigInt(userId),
            amount: new Decimal(amount),
            isAuto: false,
          },
          include: {
            client: {
              include: {
                user: true,
              },
            },
          },
        });

        // 8. Calculate bid count
        const bidCount = await tx.bid.count({
          where: { auctionId: BigInt(auctionId) },
        });

        // 9. Check auto-extend rules
        let newEndTime = auction.endAt;
        let wasExtended = false;

        if (auction.autoExtend) {
          const timeRemaining = auction.endAt.getTime() - now.getTime();
          const extendThreshold = auction.extendMinutes * 60 * 1000; // Convert to ms

          // If bid placed within extend threshold, extend the auction
          if (timeRemaining < extendThreshold) {
            newEndTime = new Date(now.getTime() + extendThreshold);
            wasExtended = true;
          }
        }

        // 10. Update auction
        const updatedAuction = await tx.auction.update({
          where: { id: BigInt(auctionId) },
          data: {
            currentBid: new Decimal(amount),
            endAt: newEndTime,
            status:
              newEndTime.getTime() - now.getTime() < 5 * 60 * 1000
                ? 'ENDING_SOON'
                : 'RUNNING',
          },
        });

        // 11. Create activity log
        await tx.auctionActivity.create({
          data: {
            auctionId: BigInt(auctionId),
            activityType: 'BID_PLACED',
            userId: BigInt(userId),
            metadata: {
              amount,
              bidCount,
              wasExtended,
              newEndTime: wasExtended ? newEndTime.toISOString() : undefined,
            },
          },
        });

        return {
          bid,
          updatedAuction,
          bidCount,
          wasExtended,
          newEndTime,
        };
      },
      {
        isolationLevel: 'Serializable', // Strongest isolation level
        maxWait: 5000, // Wait up to 5s for lock
        timeout: 10000, // Transaction timeout
      }
    );

    // 12. Trigger Pusher event (outside transaction for performance)
    try {
      await pusher.trigger(`auction-${auctionId}`, 'bid:new', {
        auctionId,
        currentBid: amount,
        bidderName: result.bid.client.user.name,
        bidCount: result.bidCount,
        timestamp: new Date().toISOString(),
        extendedEndTime: result.wasExtended
          ? result.newEndTime.toISOString()
          : undefined,
      });

      // If extended, also trigger extension event
      if (result.wasExtended) {
        await pusher.trigger(`auction-${auctionId}`, 'auction:extend', {
          newEndTime: result.newEndTime.toISOString(),
          extendMinutes: result.updatedAuction.extendMinutes,
          timestamp: new Date().toISOString(),
        });
      }

      // If status changed to ENDING_SOON, trigger status event
      if (result.updatedAuction.status === 'ENDING_SOON') {
        await pusher.trigger(`auction-${auctionId}`, 'auction:status', {
          status: 'ENDING_SOON',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (pusherError) {
      // Log Pusher error but don't fail the bid
      console.error('Failed to trigger Pusher event:', pusherError);
    }

    return {
      success: true,
      bid: {
        id: result.bid.id.toString(),
        amount: Number(result.bid.amount),
        createdAt: result.bid.createdAt,
      },
      auction: {
        id: result.updatedAuction.id.toString(),
        currentBid: Number(result.updatedAuction.currentBid),
        bidCount: result.bidCount,
        endAt: result.updatedAuction.endAt,
        status: result.updatedAuction.status,
        wasExtended: result.wasExtended,
      },
    };
  } catch (error: any) {
    console.error('Error placing bid:', error);

    return {
      success: false,
      error: error.message || 'Failed to place bid',
    };
  }
}

/**
 * Get recent bids since a specific timestamp (for catching up after reconnection)
 */
export async function getBidsSince(auctionId: number, since: string) {
  try {
    const sinceDate = new Date(since);

    const bids = await prisma.bid.findMany({
      where: {
        auctionId: BigInt(auctionId),
        createdAt: {
          gt: sinceDate,
        },
      },
      include: {
        client: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return bids.map((bid) => ({
      id: bid.id.toString(),
      amount: Number(bid.amount),
      bidder: {
        name: bid.client.user.name,
      },
      createdAt: bid.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching bids since:', error);
    return [];
  }
}

/**
 * End auction and determine winner
 */
export async function endAuction(auctionId: number) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Get auction with bids
      const auction = await tx.auction.findUnique({
        where: { id: BigInt(auctionId) },
        include: {
          bids: {
            orderBy: { amount: 'desc' },
            take: 1,
            include: {
              client: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });

      if (!auction) {
        throw new Error('Auction not found');
      }

      // Determine winner
      const winningBid = auction.bids[0];
      const hasWinner = winningBid && Number(winningBid.amount) >= Number(auction.reservePrice || 0);

      // Update auction status
      const updatedAuction = await tx.auction.update({
        where: { id: BigInt(auctionId) },
        data: {
          status: 'ENDED',
        },
      });

      // Create activity log
      await tx.auctionActivity.create({
        data: {
          auctionId: BigInt(auctionId),
          activityType: 'AUCTION_ENDED',
          userId: hasWinner ? winningBid.clientId : BigInt(0),
          metadata: {
            hasWinner,
            winningBid: hasWinner ? Number(winningBid.amount) : null,
            reserveMet: hasWinner,
          },
        },
      });

      return {
        auction: updatedAuction,
        winner: hasWinner
          ? {
              id: winningBid.clientId.toString(),
              name: winningBid.client.user.name,
              bid: Number(winningBid.amount),
            }
          : null,
      };
    });

    // Trigger Pusher event
    try {
      await pusher.trigger(`auction-${auctionId}`, 'auction:end', {
        winnerId: result.winner?.id,
        winningBid: result.winner?.bid,
        timestamp: new Date().toISOString(),
      });
    } catch (pusherError) {
      console.error('Failed to trigger Pusher event:', pusherError);
    }

    return result;
  } catch (error) {
    console.error('Error ending auction:', error);
    throw error;
  }
}
