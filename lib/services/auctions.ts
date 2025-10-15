import { prisma } from '@/lib/db/prisma'
import type { Prisma } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import type { AuctionListQuery } from '@/lib/validations/auctions'

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

export interface ListAuctionsFilters {
  status?: AuctionListQuery['status']
  storeId?: bigint | string
  q?: string
  sort?: AuctionListQuery['sort']
  priceMin?: number
  priceMax?: number
  category?: string
  page: number
  limit: number
}

export async function listAuctions(filters: ListAuctionsFilters) {
  const where: Prisma.AuctionWhereInput = {}

  switch (filters.status) {
    case 'live':
      where.status = 'RUNNING'
      break
    case 'ended':
      where.status = 'ENDED'
      break
    case 'upcoming':
      where.status = 'SCHEDULED'
      break
    case 'ending_soon':
      where.status = { in: ['RUNNING', 'ENDING_SOON'] }
      where.endAt = {
        lte: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
      break
    case 'all':
    case undefined:
      break
  }

  if (filters.q) {
    where.title = { contains: filters.q }
  }

  if (filters.category) {
    where.category = filters.category
  }

  const hasPriceFilter =
    typeof filters.priceMin === 'number' ||
    typeof filters.priceMax === 'number'

  if (hasPriceFilter) {
    const min =
      typeof filters.priceMin === 'number' ? filters.priceMin : undefined
    const max =
      typeof filters.priceMax === 'number' ? filters.priceMax : undefined

    where.currentBid = {
      ...(min !== undefined ? { gte: new Decimal(min) } : {}),
      ...(max !== undefined ? { lte: new Decimal(max) } : {})
    }
  }

  if (filters.storeId) {
    where.storeId = BigInt(filters.storeId)
  }

  let orderBy: Prisma.AuctionOrderByWithRelationInput

  switch (filters.sort) {
    case 'newest':
      orderBy = { createdAt: 'desc' }
      break
    case 'price_asc':
      orderBy = { currentBid: 'asc' }
      break
    case 'price_desc':
      orderBy = { currentBid: 'desc' }
      break
    case 'popular':
      orderBy = { watchers: 'desc' }
      break
    case 'ending_soon':
    default:
      orderBy = { endAt: 'asc' }
      break
  }

  const [auctions, total] = await Promise.all([
    prisma.auction.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            title: true,
            images: true,
            condition: true,
            category: true
          }
        },
        store: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        _count: {
          select: {
            bids: true,
            auctionWatchers: true
          }
        }
      },
      take: filters.limit,
      skip: (filters.page - 1) * filters.limit,
      orderBy
    }),
    prisma.auction.count({ where })
  ])

  return {
    auctions: auctions.map((auction) => {
      const id = auction.id.toString()
      
      // Validate that ID is a valid numeric string
      if (!id || id === 'null' || id === 'undefined' || isNaN(Number(id))) {
        console.error('Invalid auction ID in database:', auction.id, 'Auction:', auction.title)
        return null as any // Skip this auction
      }
      
      return {
        id,
        title: auction.title,
      description: auction.description ?? undefined,
      status: auction.status,
      category: auction.category ?? undefined,
      startPrice: Number(auction.startPrice),
      currentBid: Number(auction.currentBid),
      currentPrice: Number(auction.currentBid),
      reservePrice: auction.reservePrice
        ? Number(auction.reservePrice)
        : null,
      reserveMet: auction.reserveMet,
      buyNowPrice: auction.buyNowPrice ? Number(auction.buyNowPrice) : null,
      minIncrement: Number(auction.minIncrement),
      startAt: auction.startAt.toISOString(),
      endAt: auction.endAt.toISOString(),
      views: auction.views,
      watchers: auction.watchers,
      bidCount: auction._count.bids,
      watcherCount: auction._count.auctionWatchers,
      product: auction.product
        ? {
            id: auction.product.id.toString(),
            title: auction.product.title,
            images: toImageObjects(auction.product.images),
            condition: auction.product.condition,
            category: auction.product.category ?? undefined
          }
        : null,
      store: auction.store
        ? {
            id: auction.store.id.toString(),
            name: auction.store.name,
            slug: auction.store.slug ?? undefined
          }
        : null,
      condition: auction.product?.condition ?? undefined,
      autoExtend: auction.autoExtend,
      extensionCount: auction.extensionCount,
      image: resolvePrimaryImage(auction.images, auction.product?.images),
      images: toImageObjects(auction.images)
      }
    }).filter(Boolean), // Remove any null entries from invalid IDs
    total,
    page: filters.page,
    pages: Math.ceil(total / filters.limit)
  }
}

export type ListAuctionsResult = Awaited<ReturnType<typeof listAuctions>>
export type AuctionListItem = ListAuctionsResult['auctions'][number]

function extractImageUrls(value: unknown): string[] {
  if (!value) return []

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') return item
        if (item && typeof item === 'object' && 'url' in item) {
          const url = (item as { url?: unknown }).url
          return typeof url === 'string' ? url : null
        }
        return null
      })
      .filter((url): url is string => Boolean(url))
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return extractImageUrls(parsed)
    } catch {
      return []
    }
  }

  return []
}

function resolvePrimaryImage(
  auctionImages: unknown,
  productImages: unknown
): string {
  const fallback =
    'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400'

  const images = extractImageUrls(auctionImages)
  if (images.length > 0) {
    return images[0]
  }

  const productImageList = extractImageUrls(productImages)
  if (productImageList.length > 0) {
    return productImageList[0]
  }

  return fallback
}

function toImageObjects(
  value: unknown
): Array<{ url: string }> {
  return extractImageUrls(value).map((url) => ({ url }))
}
