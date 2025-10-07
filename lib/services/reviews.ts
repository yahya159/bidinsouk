import { prisma } from '@/lib/db/prisma'

export async function createReview(data: {
  productId: bigint
  clientId: bigint
  rating: number
  body: string
  photos?: any
}) {
  // Check if user already reviewed this product
  const existing = await prisma.review.findFirst({
    where: {
      productId: data.productId,
      clientId: data.clientId
    }
  })

  if (existing) throw new Error('You already reviewed this product')

  // Check if user purchased this product
  const hasPurchased = await prisma.order.findFirst({
    where: {
      userId: data.clientId,
      status: 'CONFIRMED'
    }
  })

  return prisma.review.create({
    data: {
      productId: data.productId,
      clientId: data.clientId,
      rating: data.rating,
      body: data.body,
      photos: data.photos,
      verified: !!hasPurchased,
      status: 'PENDING'
    }
  })
}

export async function getProductReviews(productId: bigint, filters?: {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED'
  limit?: number
  offset?: number
}) {
  const where: any = { productId }
  if (filters?.status) where.status = filters.status

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        client: {
          include: {
            user: { select: { name: true, avatarUrl: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 20,
      skip: filters?.offset || 0
    }),
    prisma.review.count({ where })
  ])

  return { reviews, total }
}

export async function moderateReview(reviewId: bigint, status: 'APPROVED' | 'REJECTED') {
  return prisma.review.update({
    where: { id: reviewId },
    data: { status }
  })
}

export async function getProductRatingStats(productId: bigint) {
  const reviews = await prisma.review.findMany({
    where: { productId, status: 'APPROVED' },
    select: { rating: true }
  })

  if (reviews.length === 0) {
    return { average: 0, total: 0, distribution: {} }
  }

  const total = reviews.length
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
  const average = sum / total

  const distribution = reviews.reduce((acc: any, r) => {
    acc[r.rating] = (acc[r.rating] || 0) + 1
    return acc
  }, {})

  return { average, total, distribution }
}
