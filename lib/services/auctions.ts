import { prisma } from '@/lib/db/prisma'
import { Decimal } from '@prisma/client/runtime/library'

export async function createAuction(data: {
  productId: bigint
  storeId: bigint
  title: string
  startPrice: number
  reservePrice?: number
  minIncrement: number
  startAt?: Date
  endAt: Date
}) {
  return prisma.auction.create({
    data: {
      productId: data.productId,
      storeId: data.storeId,
      title: data.title,
      startPrice: new Decimal(data.startPrice),
      reservePrice: data.reservePrice ? new Decimal(data.reservePrice) : null,
      minIncrement: new Decimal(data.minIncrement),
      currentBid: new Decimal(0),
      startAt: data.startAt || new Date(),
      endAt: data.endAt,
      status: 'SCHEDULED'
    }
  })
}

export async function getAuction(auctionId: bigint) {
  return prisma.auction.findUnique({
    where: { id: auctionId },
    include: {
      product: { include: { store: true } },
      bids: {
        include: {
          client: {
            include: {
              user: { select: { name: true, avatarUrl: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      }
    }
  })
}

export async function listAuctions(filters: any) {
  const where: any = {}

  if (filters.status) where.status = filters.status
  if (filters.storeId) where.storeId = BigInt(filters.storeId)

  const [auctions, total] = await Promise.all([
    prisma.auction.findMany({
      where,
      include: {
        product: true,
        store: true
      },
      take: filters.limit,
      skip: (filters.page - 1) * filters.limit,
      orderBy: { endAt: 'asc' }
    }),
    prisma.auction.count({ where })
  ])

  return { auctions, total, page: filters.page, pages: Math.ceil(total / filters.limit) }
}
