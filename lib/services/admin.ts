import { prisma } from '@/lib/db/prisma'

// Fonction utilitaire pour convertir en BigInt en toute sécurité
function safeBigInt(value: string | number | bigint | undefined): bigint | null {
  if (value === undefined) return null;
  try {
    if (typeof value === 'bigint') return value;
    if (typeof value === 'number') return BigInt(value);
    if (typeof value === 'string') {
      // Vérifier si c'est une chaîne numérique valide
      if (!/^\d+$/.test(value)) return null;
      return BigInt(value);
    }
    return null;
  } catch (error) {
    console.error('Erreur de conversion BigInt:', { value, error });
    return null;
  }
}

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
  const vendorIdBigInt = safeBigInt(vendorId);
  if (!vendorIdBigInt) {
    throw new Error('Invalid vendor ID');
  }
  
  return prisma.store.updateMany({
    where: { sellerId: vendorIdBigInt, status: 'PENDING' },
    data: { status: 'ACTIVE' }
  })
}

export async function rejectVendor(vendorId: string) {
  const vendorIdBigInt = safeBigInt(vendorId);
  if (!vendorIdBigInt) {
    throw new Error('Invalid vendor ID');
  }
  
  return prisma.store.updateMany({
    where: { sellerId: vendorIdBigInt, status: 'PENDING' },
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

  // Convertir les BigInt en string pour la sérialisation
  const serializedUsers = users.map(user => ({
    ...user,
    id: user.id.toString(),
    client: user.client ? {
      ...user.client,
      id: user.client.id.toString(),
      userId: user.client.userId.toString()
    } : undefined,
    vendor: user.vendor ? {
      ...user.vendor,
      id: user.vendor.id.toString(),
      userId: user.vendor.userId.toString(),
      stores: user.vendor.stores.map(store => ({
        ...store,
        id: store.id.toString()
      }))
    } : undefined,
    createdAt: user.createdAt.toISOString()
  }));

  return { users: serializedUsers, total }
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

// Platform Stats - Version améliorée avec statistiques détaillées
export async function getPlatformStats() {
  const [
    totalUsers,
    totalVendors,
    totalProducts,
    activeAuctions,
    endedAuctions, // Ajout des enchères terminées pour le calcul du taux de conversion
    totalOrders,
    totalRevenue,
    pendingReports
  ] = await Promise.all([
    prisma.user.count(),
    prisma.vendor.count(),
    prisma.product.count({ where: { status: 'ACTIVE' } }),
    prisma.auction.count({ where: { status: { in: ['RUNNING', 'ENDING_SOON'] } } }),
    prisma.auction.count({ where: { status: 'ENDED' } }), // Enchères terminées
    prisma.order.count(),
    prisma.order.aggregate({
      where: { status: 'CONFIRMED' },
      _sum: { total: true }
    }),
    prisma.abuseReport.count({ where: { status: 'OPEN' } })
  ]);

  return {
    totalUsers,
    totalVendors,
    totalProducts,
    activeAuctions,
    endedAuctions, // Ajouté pour le calcul du taux de conversion
    totalOrders,
    totalRevenue: totalRevenue._sum.total || 0,
    pendingReports
  };
}

// Fonction pour obtenir les données historiques des statistiques
export async function getHistoricalStats(days: number = 30) {
  try {
    // Calculer la date de début
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Récupérer les données historiques pour les utilisateurs
    const userStats = await prisma.$queryRaw`
      SELECT DATE(createdAt) as date, COUNT(*) as count
      FROM User
      WHERE createdAt >= ${startDate}
      GROUP BY DATE(createdAt)
      ORDER BY DATE(createdAt)
    `;
    
    // Récupérer les données historiques pour les commandes
    const orderStats = await prisma.$queryRaw`
      SELECT DATE(createdAt) as date, COUNT(*) as count, COALESCE(SUM(total), 0) as revenue
      FROM \`Order\`
      WHERE status = 'CONFIRMED' AND createdAt >= ${startDate}
      GROUP BY DATE(createdAt)
      ORDER BY DATE(createdAt)
    `;
    
    // Récupérer les données historiques pour les enchères
    const auctionStats = await prisma.$queryRaw`
      SELECT DATE(createdAt) as date, COUNT(*) as count
      FROM Auction
      WHERE createdAt >= ${startDate}
      GROUP BY DATE(createdAt)
      ORDER BY DATE(createdAt)
    `;
    
    // Formater les données pour les graphiques
    const formattedData = [];
    
    // Créer un tableau avec toutes les dates
    const dates = [];
    const currentDate = new Date(startDate);
    while (currentDate <= new Date()) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Pour chaque date, récupérer les statistiques
    for (const date of dates) {
      const dateString = date.toISOString().split('T')[0];
      
      // Trouver les statistiques pour cette date
      // @ts-ignore
      const usersForDate = userStats.find(stat => stat.date === dateString);
      // @ts-ignore
      const ordersForDate = orderStats.find(stat => stat.date === dateString);
      // @ts-ignore
      const auctionsForDate = auctionStats.find(stat => stat.date === dateString);
      
      formattedData.push({
        date: dateString,
        // @ts-ignore
        users: usersForDate ? Number(usersForDate.count) : 0,
        // @ts-ignore
        orders: ordersForDate ? Number(ordersForDate.count) : 0,
        // @ts-ignore
        auctions: auctionsForDate ? Number(auctionsForDate.count) : 0,
        // @ts-ignore
        revenue: ordersForDate ? Number(ordersForDate.revenue) : 0
      });
    }
    
    return formattedData;
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques historiques:', error);
    // Retourner un tableau vide en cas d'erreur
    return [];
  }
}

// Fonction pour obtenir l'activité récente sur la plateforme
export async function getRecentActivity(limit: number = 10) {
  try {
    // Récupérer les dernières commandes avec les informations de boutique
    const recentOrders = await prisma.$queryRaw`
      SELECT o.id, o.number, o.total, o.createdAt, s.name as storeName
      FROM \`Order\` o
      LEFT JOIN Store s ON o.storeId = s.id
      ORDER BY o.createdAt DESC
      LIMIT ${limit}
    `;

    // Récupérer les dernières enchères avec les informations de boutique et de produit
    const recentAuctions = await prisma.$queryRaw`
      SELECT a.id, a.title, a.createdAt, s.name as storeName, p.title as productTitle
      FROM Auction a
      LEFT JOIN Store s ON a.storeId = s.id
      LEFT JOIN Product p ON a.productId = p.id
      ORDER BY a.createdAt DESC
      LIMIT ${limit}
    `;

    // Récupérer les derniers utilisateurs
    const recentUsers = await prisma.user.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    // Combiner et formater toutes les activités
    // @ts-ignore
    const allActivities = [
      // @ts-ignore
      ...recentOrders.map(order => ({
        id: `order-${order.id}`,
        type: 'order' as const,
        title: `Nouvelle commande #${order.number}`,
        // @ts-ignore
        description: `${order.storeName || 'Boutique inconnue'} - ${new Intl.NumberFormat('fr-FR').format(Number(order.total))} MAD`,
        // @ts-ignore
        timeAgo: getTimeAgo(order.createdAt),
        // @ts-ignore
        createdAt: order.createdAt
      })),
      // @ts-ignore
      ...recentAuctions.map(auction => ({
        id: `auction-${auction.id}`,
        type: 'auction' as const,
        title: `Nouvelle enchère créée`,
        // @ts-ignore
        description: `${auction.productTitle || auction.title || 'Produit inconnu'} - ${auction.storeName || 'Boutique inconnue'}`,
        // @ts-ignore
        timeAgo: getTimeAgo(auction.createdAt),
        // @ts-ignore
        createdAt: auction.createdAt
      })),
      ...recentUsers.map(user => ({
        id: `user-${user.id}`,
        type: 'user' as const,
        title: `Nouvel utilisateur`,
        description: `${user.name} (${user.role})`,
        timeAgo: getTimeAgo(user.createdAt),
        createdAt: user.createdAt
      }))
    ];

    // Trier par date de création et limiter au nombre demandé
    // @ts-ignore
    return allActivities
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'activité récente:', error);
    return [];
  }
}

// Fonction utilitaire pour formater le temps écoulé
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'À l\'instant';
  if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `Il y a ${diffInHours}h`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `Il y a ${diffInDays}j`;
}
