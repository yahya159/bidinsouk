import { prisma } from '@/lib/db/prisma'
import { VendorApplicationType } from '@/lib/validations/vendors'

export async function applyToBeVendor(userId: bigint, applicationData: VendorApplicationType) {
  // Check if user already has a vendor profile
  const existingVendor = await prisma.vendor.findUnique({
    where: { userId },
    include: {
      stores: true
    }
  })

  if (existingVendor) {
    if (existingVendor.stores && existingVendor.stores.length > 0) {
      throw new Error('Vous êtes déjà un vendeur avec ce compte et vous avez déjà créé une ou plusieurs boutiques.')
    } else {
      throw new Error('Vous êtes déjà enregistré comme vendeur. Veuillez créer votre boutique depuis votre tableau de bord.')
    }
  }
  
  // Vérifier si l'email est déjà utilisé par un autre vendeur
  const existingVendorWithEmail = await prisma.vendor.findFirst({
    where: { 
      user: { 
        email: applicationData.email,
        id: { not: userId }
      }
    }
  })

  if (existingVendorWithEmail) {
    throw new Error('Un vendeur existe déjà avec cet email. Veuillez utiliser un autre email ou vous connecter avec le compte existant.')
  }

  // Update user information
  await prisma.user.update({
    where: { id: userId },
    data: { 
      name: applicationData.name,
      phone: applicationData.phone
    }
  })

  // Create vendor profile
  const vendor = await prisma.vendor.create({
    data: { 
      userId
    }
  })

  // Ne pas créer automatiquement une boutique - l'utilisateur devra la créer manuellement
  return { vendor }
}

export async function getVendorProfile(vendorId: bigint) {
  return prisma.vendor.findUnique({
    where: { id: vendorId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatarUrl: true
        }
      },
      stores: true
    }
  })
}

export async function getVendorOrders(vendorId: bigint, storeId?: bigint) {
  const where: any = {}
  
  if (storeId) {
    // Verify store belongs to vendor
    const store = await prisma.store.findFirst({
      where: { id: storeId, sellerId: vendorId }
    })
    if (!store) throw new Error('Store not found')
    where.storeId = storeId
  } else {
    // Get all stores for this vendor
    const stores = await prisma.store.findMany({
      where: { sellerId: vendorId },
      select: { id: true }
    })
    where.storeId = { in: stores.map(s => s.id) }
  }

  return prisma.order.findMany({
    where,
    include: {
      user: {
        include: {
          user: {
            select: { name: true, email: true, phone: true }
          }
        }
      },
      store: {
        select: { name: true, slug: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function updateOrderFulfillmentStatus(
  orderId: bigint,
  vendorId: bigint,
  status: string
) {
  // Verify order belongs to vendor's store
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      store: { sellerId: vendorId }
    }
  })

  if (!order) throw new Error('Order not found')

  return prisma.order.update({
    where: { id: orderId },
    data: { fulfillStatus: status as any }
  })
}

export async function getVendorStats(vendorId: bigint, storeId?: bigint) {
  const where: any = {}
  
  if (storeId) {
    const store = await prisma.store.findFirst({
      where: { id: storeId, sellerId: vendorId }
    })
    if (!store) throw new Error('Store not found')
    where.storeId = storeId
  } else {
    const stores = await prisma.store.findMany({
      where: { sellerId: vendorId },
      select: { id: true }
    })
    where.storeId = { in: stores.map(s => s.id) }
  }

  const [
    totalOrders,
    totalRevenue,
    activeAuctions,
    totalProducts
  ] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.aggregate({
      where: { ...where, status: 'CONFIRMED' },
      _sum: { total: true }
    }),
    prisma.auction.count({
      where: {
        ...where,
        status: { in: ['RUNNING', 'ENDING_SOON'] }
      }
    }),
    prisma.product.count({
      where: { ...where, status: 'ACTIVE' }
    })
  ])

  return {
    totalOrders,
    totalRevenue: totalRevenue._sum.total || 0,
    activeAuctions,
    totalProducts
  }
}

// Get all pending vendor applications (admin only)
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
        where: { status: 'PENDING' }
      }
    }
  })
}

// Approve vendor (admin only)
export async function approveVendor(vendorId: bigint) {
  return prisma.store.updateMany({
    where: { sellerId: vendorId, status: 'PENDING' },
    data: { status: 'ACTIVE' }
  })
}

// Reject vendor (admin only)
export async function rejectVendor(vendorId: bigint) {
  return prisma.store.updateMany({
    where: { sellerId: vendorId, status: 'PENDING' },
    data: { status: 'SUSPENDED' }
  })
}
