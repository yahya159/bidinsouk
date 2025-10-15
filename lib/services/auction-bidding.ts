/**
 * SOPHISTICATED AUCTION BIDDING ENGINE
 * 
 * Features:
 * - Proxy/Auto-Bidding (eBay-style)
 * - Reserve Price Handling
 * - Auto-Extend Anti-Snipe Protection
 * - Bid Increment Validation
 * - Race Condition Prevention
 * - Buy Now Functionality
 * 
 * @module auction-bidding
 */

import { prisma } from '@/lib/db/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { pusher } from '@/lib/realtime/pusher';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface BidPlacementResult {
  success: boolean;
  bid?: any;
  auction?: any;
  error?: string;
  errorCode?: string;
  wasExtended?: boolean;
  proxyBidsTriggered?: number;
}

export interface ProxyBidContext {
  auctionId: bigint;
  newBidderId: bigint;
  newBidAmount: Decimal;
  newMaxAmount?: Decimal;
  currentHighestBid?: any;
  isProxyBid?: boolean;
}

// ============================================================================
// BIDDING ALGORITHM - MAIN ENTRY POINT
// ============================================================================

/**
 * Place a bid with full proxy bidding support and validation
 * 
 * ALGORITHM:
 * 1. Validate auction state (active, not ended)
 * 2. Validate bidder (not seller, not current highest)
 * 3. Validate bid amount (meets minimum)
 * 4. Check for proxy bid conflict (both users have maxAmount)
 * 5. Handle proxy bidding logic
 * 6. Update auction state
 * 7. Handle auto-extend if needed
 * 8. Mark reserve as met if applicable
 * 9. Trigger notifications
 */
export async function placeBid(
  auctionId: number | bigint,
  userId: number | bigint,
  amount: number,
  maxAmount?: number
): Promise<BidPlacementResult> {
  
  const auctionBigInt = BigInt(auctionId);
  const userBigInt = BigInt(userId);
  
  try {
    // Use SERIALIZABLE transaction to prevent race conditions
    const result = await prisma.$transaction(
      async (tx) => {
        // STEP 1: Lock and fetch auction with all related data
        const auction = await tx.auction.findUnique({
          where: { id: auctionBigInt },
          include: {
            bids: {
              where: { status: { in: ['ACTIVE', 'WINNING'] } },
              orderBy: [{ amount: 'desc' }, { createdAt: 'asc' }],
              take: 5,
              include: {
                client: {
                  include: { user: true }
                }
              }
            },
            store: {
              include: {
                seller: {
                  include: { user: true }
                }
              }
            }
          }
        });

        if (!auction) {
          return {
            success: false,
            error: 'Auction not found',
            errorCode: 'AUCTION_NOT_FOUND'
          };
        }

        // STEP 2: Validate auction status
        if (!['ACTIVE', 'RUNNING', 'ENDING_SOON'].includes(auction.status)) {
          return {
            success: false,
            error: `Auction is not accepting bids (status: ${auction.status})`,
            errorCode: 'AUCTION_NOT_ACTIVE'
          };
        }

        // STEP 3: Check if auction has ended (time-based)
        const now = new Date();
        if (auction.endAt <= now) {
          // Mark auction as ended
          await tx.auction.update({
            where: { id: auctionBigInt },
            data: { status: 'ENDED' }
          });
          
          return {
            success: false,
            error: 'Auction has already ended',
            errorCode: 'AUCTION_ENDED'
          };
        }

        // STEP 4: Validate bidder is not the seller
        if (auction.store.seller.userId === userBigInt) {
          return {
            success: false,
            error: 'Sellers cannot bid on their own auctions',
            errorCode: 'SELLER_CANNOT_BID'
          };
        }

        // STEP 5: Get client record
        const client = await tx.client.findUnique({
          where: { userId: userBigInt }
        });

        if (!client) {
          return {
            success: false,
            error: 'Client profile not found',
            errorCode: 'CLIENT_NOT_FOUND'
          };
        }

        // STEP 6: Calculate minimum bid based on current state
        const currentBid = Number(auction.currentBid);
        const minIncrement = Number(auction.minIncrement);
        const startPrice = Number(auction.startPrice);
        
        const minBid = currentBid > 0 
          ? currentBid + minIncrement 
          : startPrice;

        // STEP 7: Validate bid amount meets minimum
        if (amount < minBid) {
          return {
            success: false,
            error: `Bid must be at least ${formatCurrency(minBid)}`,
            errorCode: 'BID_TOO_LOW',
            auction: { minBid }
          };
        }

        // STEP 8: Validate maxAmount if provided
        if (maxAmount && maxAmount < amount) {
          return {
            success: false,
            error: 'Maximum amount must be greater than or equal to bid amount',
            errorCode: 'INVALID_MAX_AMOUNT'
          };
        }

        // STEP 9: Check if user is already the highest bidder
        const currentHighestBid = auction.bids[0];
        if (currentHighestBid && currentHighestBid.clientId === client.id) {
          return {
            success: false,
            error: 'You are already the highest bidder',
            errorCode: 'ALREADY_HIGHEST_BIDDER'
          };
        }

        // STEP 10: Handle Proxy Bidding Logic
        const proxyResult = await handleProxyBidding(tx, {
          auctionId: auctionBigInt,
          newBidderId: client.id,
          newBidAmount: new Decimal(amount),
          newMaxAmount: maxAmount ? new Decimal(maxAmount) : undefined,
          currentHighestBid: currentHighestBid
        });

        if (!proxyResult.success) {
          return proxyResult;
        }

        // STEP 11: Determine final bid amount (may be adjusted by proxy logic)
        const finalBidAmount = proxyResult.finalAmount || new Decimal(amount);
        
        // STEP 12: Create the user's bid
        const newBid = await tx.bid.create({
          data: {
            auctionId: auctionBigInt,
            clientId: client.id,
            amount: finalBidAmount,
            maxAmount: maxAmount ? new Decimal(maxAmount) : null,
            isAuto: false,
            isProxyBid: false,
            status: 'WINNING'
          },
          include: {
            client: {
              include: { user: true }
            }
          }
        });

        // STEP 13: Update previous highest bid status to OUTBID
        if (currentHighestBid) {
          await tx.bid.update({
            where: { id: currentHighestBid.id },
            data: { status: 'OUTBID' }
          });
        }

        // STEP 14: Check if reserve price is met
        const reserveMet = auction.reservePrice 
          ? Number(finalBidAmount) >= Number(auction.reservePrice)
          : true;

        // STEP 15: Handle auto-extend logic
        let wasExtended = false;
        let newEndTime = auction.endAt;
        
        if (auction.autoExtend) {
          const timeRemaining = auction.endAt.getTime() - now.getTime();
          const extendThreshold = auction.extendMinutes * 60 * 1000;

          // If bid placed within extend threshold, extend auction
          if (timeRemaining < extendThreshold) {
            newEndTime = new Date(now.getTime() + extendThreshold);
            wasExtended = true;
          }
        }

        // STEP 16: Determine new auction status
        const timeToEnd = newEndTime.getTime() - now.getTime();
        const fifteenMinutes = 15 * 60 * 1000;
        
        let newStatus = auction.status;
        if (timeToEnd < fifteenMinutes) {
          newStatus = 'ENDING_SOON';
        } else if (newStatus === 'SCHEDULED') {
          newStatus = 'ACTIVE';
        }

        // STEP 17: Update auction
        const updatedAuction = await tx.auction.update({
          where: { id: auctionBigInt },
          data: {
            currentBid: finalBidAmount,
            reserveMet: reserveMet,
            status: newStatus,
            endAt: newEndTime,
            extensionCount: wasExtended 
              ? auction.extensionCount + 1 
              : auction.extensionCount,
            lastExtendedAt: wasExtended ? now : auction.lastExtendedAt
          }
        });

        // STEP 18: Create activity log
        await tx.auctionActivity.create({
          data: {
            auctionId: auctionBigInt,
            activityType: 'BID_PLACED',
            userId: userBigInt,
            metadata: {
              amount: Number(finalBidAmount),
              maxAmount: maxAmount,
              wasExtended: wasExtended,
              reserveMet: reserveMet
            }
          }
        });

        return {
          success: true,
          bid: newBid,
          auction: updatedAuction,
          wasExtended: wasExtended,
          proxyBidsTriggered: proxyResult.proxyBidsCreated || 0
        };
      },
      {
        isolationLevel: 'Serializable', // Prevents race conditions
        timeout: 10000 // 10 second timeout
      }
    );

    // STEP 19: Send real-time notifications (outside transaction)
    if (result.success && result.bid) {
      await notifyBidPlaced(result.auction, result.bid, result.wasExtended);
    }

    return result;
    
  } catch (error: any) {
    console.error('Error placing bid:', error);
    
    return {
      success: false,
      error: error.message || 'Failed to place bid',
      errorCode: 'INTERNAL_ERROR'
    };
  }
}

// ============================================================================
// PROXY BIDDING LOGIC
// ============================================================================

/**
 * Handle proxy bidding between two users
 * 
 * PROXY BIDDING ALGORITHM:
 * - User A bids $100 with max $200
 * - System places bid at $100
 * - User B bids $150 with max $250
 * - System automatically:
 *   1. Outbids User A at $150
 *   2. User A's proxy kicks in at $160 (B's bid + increment)
 *   3. User B's proxy kicks in at $170
 *   4. Continue until one maxAmount is reached
 *   5. Winner is at losing bidder's max + increment
 * 
 * If both have max amounts:
 *   - Higher max wins at lower max + increment
 *   - If same max, first bidder wins (tiebreaker)
 */
async function handleProxyBidding(
  tx: any,
  context: ProxyBidContext
): Promise<any> {
  
  const { 
    auctionId, 
    newBidderId, 
    newBidAmount, 
    newMaxAmount,
    currentHighestBid 
  } = context;

  let proxyBidsCreated = 0;
  let finalAmount = newBidAmount;

  // If no max amount provided, no proxy bidding needed
  if (!newMaxAmount) {
    return { 
      success: true, 
      finalAmount,
      proxyBidsCreated 
    };
  }

  // If no current highest bid, new bid wins at their bid amount
  if (!currentHighestBid) {
    return { 
      success: true, 
      finalAmount,
      proxyBidsCreated 
    };
  }

  // Get auction for minIncrement
  const auction = await tx.auction.findUnique({
    where: { id: auctionId }
  });

  const minIncrement = Number(auction.minIncrement);

  // Check if current highest bidder has a maxAmount (proxy bid)
  const currentMaxAmount = currentHighestBid.maxAmount 
    ? Number(currentHighestBid.maxAmount)
    : null;

  // CASE 1: Current high bidder has NO proxy - new bid wins
  if (!currentMaxAmount) {
    return {
      success: true,
      finalAmount: newBidAmount,
      proxyBidsCreated
    };
  }

  // CASE 2: Both have proxy bids - competition!
  const newMax = Number(newMaxAmount);
  const currentMax = currentMaxAmount;

  // If new bidder's max is less than or equal to current bid, they lose
  if (newMax <= Number(currentHighestBid.amount)) {
    return {
      success: false,
      error: `Your maximum bid of ${formatCurrency(newMax)} is not high enough to outbid the current bidder`,
      errorCode: 'MAX_BID_TOO_LOW'
    };
  }

  // Determine who wins the proxy battle
  if (newMax > currentMax) {
    // New bidder has higher max - they win at currentMax + increment
    finalAmount = new Decimal(currentMax + minIncrement);
    
    // Cap at their max if needed
    if (Number(finalAmount) > newMax) {
      finalAmount = new Decimal(newMax);
    }
    
    proxyBidsCreated = 1;
    
  } else if (newMax === currentMax) {
    // Tie - first bidder wins (current highest)
    return {
      success: false,
      error: 'Your maximum bid equals the current highest bid. First bidder wins in a tie.',
      errorCode: 'TIE_FIRST_BIDDER_WINS'
    };
    
  } else {
    // Current bidder has higher max - they maintain lead
    // New bidder will be immediately outbid
    finalAmount = new Decimal(newMax);
    
    // Create counter-proxy bid for current high bidder
    const counterBidAmount = newMax + minIncrement;
    
    if (counterBidAmount <= currentMax) {
      await tx.bid.create({
        data: {
          auctionId: auctionId,
          clientId: currentHighestBid.clientId,
          amount: new Decimal(counterBidAmount),
          maxAmount: new Decimal(currentMax),
          isAuto: true,
          isProxyBid: true,
          proxyGeneratedBy: currentHighestBid.id,
          status: 'WINNING'
        }
      });
      
      proxyBidsCreated = 1;
      
      // The new bidder's bid will be marked as OUTBID
      // by the counter proxy bid
    }
  }

  return {
    success: true,
    finalAmount,
    proxyBidsCreated
  };
}

// ============================================================================
// BUY NOW FUNCTIONALITY
// ============================================================================

/**
 * Execute Buy Now - instantly win auction at fixed price
 */
export async function executeBuyNow(
  auctionId: number | bigint,
  userId: number | bigint
): Promise<BidPlacementResult> {
  
  const auctionBigInt = BigInt(auctionId);
  const userBigInt = BigInt(userId);
  
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Fetch auction
      const auction = await tx.auction.findUnique({
        where: { id: auctionBigInt },
        include: {
          store: {
            include: {
              seller: { include: { user: true } }
            }
          }
        }
      });

      if (!auction) {
        return {
          success: false,
          error: 'Auction not found',
          errorCode: 'AUCTION_NOT_FOUND'
        };
      }

      // Validate Buy Now is available
      if (!auction.buyNowPrice) {
        return {
          success: false,
          error: 'Buy Now is not available for this auction',
          errorCode: 'BUY_NOW_NOT_AVAILABLE'
        };
      }

      // Validate auction is active
      if (!['ACTIVE', 'RUNNING', 'ENDING_SOON'].includes(auction.status)) {
        return {
          success: false,
          error: 'Auction is not active',
          errorCode: 'AUCTION_NOT_ACTIVE'
        };
      }

      // Validate not seller
      if (auction.store.seller.userId === userBigInt) {
        return {
          success: false,
          error: 'Sellers cannot buy their own items',
          errorCode: 'SELLER_CANNOT_BUY'
        };
      }

      // Get client
      const client = await tx.client.findUnique({
        where: { userId: userBigInt }
      });

      if (!client) {
        return {
          success: false,
          error: 'Client profile not found',
          errorCode: 'CLIENT_NOT_FOUND'
        };
      }

      // Create winning bid at Buy Now price
      const winningBid = await tx.bid.create({
        data: {
          auctionId: auctionBigInt,
          clientId: client.id,
          amount: auction.buyNowPrice,
          isAuto: false,
          isProxyBid: false,
          status: 'WON'
        }
      });

      // Mark all other bids as LOST
      await tx.bid.updateMany({
        where: {
          auctionId: auctionBigInt,
          id: { not: winningBid.id }
        },
        data: { status: 'LOST' }
      });

      // End auction immediately
      const updatedAuction = await tx.auction.update({
        where: { id: auctionBigInt },
        data: {
          status: 'ENDED',
          currentBid: auction.buyNowPrice,
          winnerId: client.id,
          winningBidId: winningBid.id,
          reserveMet: true,
          endAt: new Date() // End now
        }
      });

      // Create activity
      await tx.auctionActivity.create({
        data: {
          auctionId: auctionBigInt,
          activityType: 'BUY_NOW_EXECUTED',
          userId: userBigInt,
          metadata: {
            amount: Number(auction.buyNowPrice)
          }
        }
      });

      return {
        success: true,
        bid: winningBid,
        auction: updatedAuction
      };
    });

    // Notify all watchers
    if (result.success) {
      await notifyBuyNowExecuted(result.auction, result.bid);
    }

    return result;
    
  } catch (error: any) {
    console.error('Error executing Buy Now:', error);
    return {
      success: false,
      error: error.message || 'Failed to execute Buy Now',
      errorCode: 'INTERNAL_ERROR'
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount) + ' د.م';
}

async function notifyBidPlaced(auction: any, bid: any, wasExtended: boolean) {
  try {
    // Real-time notification via Pusher
    await pusher.trigger(`auction-${auction.id}`, 'bid:placed', {
      auctionId: auction.id.toString(),
      amount: Number(bid.amount),
      currentBid: Number(auction.currentBid),
      bidderId: bid.clientId.toString(),
      bidderName: bid.client.user.name,
      wasExtended: wasExtended,
      newEndTime: auction.endAt.toISOString(),
      reserveMet: auction.reserveMet,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to send real-time notification:', error);
  }
}

async function notifyBuyNowExecuted(auction: any, bid: any) {
  try {
    await pusher.trigger(`auction-${auction.id}`, 'buy-now:executed', {
      auctionId: auction.id.toString(),
      amount: Number(bid.amount),
      winnerId: bid.clientId.toString(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to send Buy Now notification:', error);
  }
}

const auctionBidding = {
  placeBid,
  executeBuyNow
};

export default auctionBidding;

