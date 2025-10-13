import { prisma } from '@/lib/db/prisma'

// Vendor Management
export async function getPendingVendors() {
  return prisma.vendor.findMany({
    where: {
      stores: {
        some: { status: 'PENDING' }
      }
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true
        }
      },
      stores: {
        where: { status: 'PENDING' },
        select: {
          id: true,
          name: true,
          status: true,
          sellerId: true,
          createdAt: true
        }
      }
    }
  })
}

export async function approveVendor(vendorId: string) {
  return prisma.store.updateMany({
    where: { sellerId: vendorId, status: 'PENDING' },
    data: { status: 'ACTIVE' }
  })
}

export async function rejectVendor(vendorId: string) {
  return prisma.store.updateMany({
    where: { sellerId: vendorId, status: 'PENDING' },
    data: { status: 'SUSPENDED' }
  })
}

// Product Moderation
export async function moderateProduct(productId: bigint, status: 'ACTIVE' | 'ARCHIVED') {
  return prisma.product.update({
    where: { id: productId },
    data: { status }
  })
}

// Auction Moderation
export async function moderateAuction(auctionId: bigint, status: 'SCHEDULED' | 'ARCHIVED') {
  return prisma.auction.update({
    where: { id: auctionId },
    data: { status }
  })
}

// Review Moderation
export async function moderateReview(reviewId: bigint, status: 'APPROVED' | 'REJECTED') {
  return prisma.review.update({
    where: { id: reviewId },
    data: { status }
  })
}

// User Management
export async function getAllUsers(filters?: {
  role?: string
  limit?: number
  offset?: number
}) {
  const where: any = {}
  if (filters?.role) where.role = filters.role

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        client: true,
        vendor: {
          include: {
            stores: { select: { id: true, name: true, status: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 50,
      skip: filters?.offset || 0
    }),
    prisma.user.count({ where })
  ])

  return { users, total }
}

export async function deleteUser(userId: bigint) {
  // This should handle cascading deletes properly
  return prisma.user.delete({
    where: { id: userId }
  })
}

export async function updateUserRole(userId: bigint, role: 'CLIENT' | 'VENDOR' | 'ADMIN') {
  return prisma.user.update({
    where: { id: userId },
    data: { role }
  })
}

// Store Management
export async function deleteStore(storeId: bigint) {
  return prisma.store.delete({
    where: { id: storeId }
  })
}

export async function updateStoreStatus(storeId: bigint, status: 'ACTIVE' | 'SUSPENDED' | 'PENDING') {
  return prisma.store.update({
    where: { id: storeId },
    data: { status }
  })
}

// Platform Stats
export async function getPlatformStats() {
  const [
    totalUsers,
    totalVendors,
    totalProducts,
    activeAuctions,
    totalOrders,
    totalRevenue,
    pendingReports
  ] = await Promise.all([
    prisma.user.count(),
    prisma.vendor.count(),
    prisma.product.count({ where: { status: 'ACTIVE' } }),
    prisma.auction.count({ where: { status: { in: ['RUNNING', 'ENDING_SOON'] } } }),
    prisma.order.count(),
    prisma.order.aggregate({
      where: { status: 'CONFIRMED' },
      _sum: { total: true }
    }),
    prisma.abuseReport.count({ where: { status: 'OPEN' } })
  ])

  return {
    totalUsers,
    totalVendors,
    totalProducts,
    activeAuctions,
    totalOrders,
    totalRevenue: totalRevenue._sum.total || 0,
    pendingReports
  }
}