import { prisma } from '@/lib/db/prisma'
import { pusher } from '@/lib/realtime/pusher'
import { Decimal } from '@prisma/client/runtime/library'

export async function placeBid(auctionId: number, userId: number, amount: number) {
  // Get the auction
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId }
  })

  if (!auction) {
    throw new Error('Auction not found')
  }

  // Check if auction is still running
  if (auction.status !== 'RUNNING') {
    throw new Error('Auction is not running')
  }

  // Check if auction has ended
  if (auction.endAt && auction.endAt < new Date()) {
    throw new Error('Auction has ended')
  }

  // Check if the bid amount is valid
  const minBid = auction.currentBid 
    ? Number(auction.currentBid) + (Number(auction.minIncrement) || 1)
    : Number(auction.minIncrement) || 1

  if (amount < minBid) {
    throw new Error(`Bid must be at least ${minBid}`)
  }

  // Create the bid and update the auction in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create the bid
    const bid = await tx.bid.create({
      data: {
        auctionId: BigInt(auctionId),
        clientId: BigInt(userId),
        amount: new Decimal(amount)
      }
    })

    // Update the auction's current bid
    const updatedAuction = await tx.auction.update({
      where: { id: BigInt(auctionId) },
      data: { currentBid: new Decimal(amount) }
    })

    return { bid, updatedAuction }
  })

  // Trigger Pusher event
  await pusher.trigger(`auction-${auctionId}`, 'bid:new', {
    amount,
    userId,
    createdAt: new Date()
  })

  return result
}