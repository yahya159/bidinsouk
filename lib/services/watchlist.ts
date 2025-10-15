import { prisma } from '@/lib/db/prisma'

export async function addToWatchlist(clientId: bigint, productId: bigint) {
  const existing = await prisma.watchlistItem.findUnique({
    where: {
      clientId_productId: { clientId, productId }
    }
  })

  if (existing) throw new Error('Product already in watchlist')

  return prisma.watchlistItem.create({
    data: { clientId, productId }
  })
}

export async function removeFromWatchlist(clientId: bigint, productId: bigint) {
  return prisma.watchlistItem.delete({
    where: {
      clientId_productId: { clientId, productId }
    }
  })
}

export async function getWatchlist(clientId: bigint) {
  return prisma.watchlistItem.findMany({
    where: { clientId },
    include: {
      product: {
        include: {
          store: { select: { name: true, slug: true } },
          auctions: {
            where: { status: { in: ['RUNNING', 'ENDING_SOON'] } },
            orderBy: { endAt: 'asc' },
            take: 1
          },
          offers: { where: { active: true }, take: 1 }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function getWatchlistCount(clientId: bigint) {
  return prisma.watchlistItem.count({
    where: { clientId }
  })
}

export async function isInWatchlist(clientId: bigint, productId: bigint) {
  const item = await prisma.watchlistItem.findUnique({
    where: {
      clientId_productId: { clientId, productId }
    }
  })
  return !!item
}
