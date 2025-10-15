import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireRole } from '@/lib/auth/api-auth'

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, ['ADMIN'])

    // Get all the required statistics
    const [
      totalUsers,
      totalVendors,
      totalProducts,
      activeAuctions,
      endedAuctions,
      totalOrdersResult,
      totalRevenueResult,
      pendingReports
    ] = await Promise.all([
      prisma.user.count(),
      prisma.vendor.count(),
      prisma.product.count({ where: { status: 'ACTIVE' } }),
      prisma.auction.count({ where: { status: { in: ['ACTIVE', 'RUNNING', 'ENDING_SOON'] } } }),
      prisma.auction.count({ where: { status: 'ENDED' } }),
      prisma.order.count(),
      prisma.order.aggregate({
        where: { status: 'CONFIRMED' },
        _sum: { total: true }
      }),
      prisma.abuseReport.count({ where: { status: 'OPEN' } })
    ]);

    // Calculate revenue
    const totalRevenue = totalRevenueResult._sum.total ? Number(totalRevenueResult._sum.total) : 0;

    // Calculate conversion rate (orders / ended auctions)
    const conversionRate = endedAuctions > 0 ? parseFloat(((totalOrdersResult / endedAuctions) * 100).toFixed(1)) : 0;

    // Get sales data for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [salesDataResult, userDataResult, auctionDataResult, orderDataResult] = await Promise.all([
      prisma.order.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: { gte: thirtyDaysAgo },
          status: 'CONFIRMED'
        },
        _sum: {
          total: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      }),
      prisma.user.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: { gte: thirtyDaysAgo }
        },
        _count: true,
        orderBy: {
          createdAt: 'asc'
        }
      }),
      prisma.auction.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: { gte: thirtyDaysAgo }
        },
        _count: true,
        orderBy: {
          createdAt: 'asc'
        }
      }),
      prisma.order.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: { gte: thirtyDaysAgo }
        },
        _count: true,
        orderBy: {
          createdAt: 'asc'
        }
      })
    ]);

    // Format sales data for chart
    const salesData = salesDataResult.map(item => ({
      name: item.createdAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      revenue: Number(item._sum.total || 0),
      orders: orderDataResult.find(o => o.createdAt.getTime() === item.createdAt.getTime())?._count || 0,
      auctions: auctionDataResult.find(a => a.createdAt.getTime() === item.createdAt.getTime())?._count || 0,
      users: userDataResult.find(u => u.createdAt.getTime() === item.createdAt.getTime())?._count || 0
    }));

    // Get category distribution (mock data for now)
    const categoryData = [
      { name: 'Électronique', value: 35, color: '#228be6' },
      { name: 'Mode', value: 25, color: '#40c057' },
      { name: 'Maison', value: 20, color: '#fab005' },
      { name: 'Sport', value: 12, color: '#fd7e14' },
      { name: 'Autres', value: 8, color: '#e64980' },
    ];

    // Get recent activity
    const [recentOrders, recentAuctions, recentUsers] = await Promise.all([
      prisma.order.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: {
          store: {
            select: { name: true }
          }
        }
      }),
      prisma.auction.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: {
          store: {
            select: { name: true }
          },
          product: {
            select: { title: true }
          }
        }
      }),
      prisma.user.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        }
      })
    ]);

    const recentActivity = {
      orders: recentOrders.map(order => ({
        id: `order-${order.id}`,
        type: 'order' as const,
        title: `Nouvelle commande #${order.id}`,
        description: `${order.store?.name || 'Boutique inconnue'} - ${new Intl.NumberFormat('fr-FR').format(Number(order.total))} MAD`,
        time: getTimeAgo(order.createdAt),
        icon: 'ShoppingBag',
        color: 'blue',
      })),
      auctions: recentAuctions.map(auction => ({
        id: `auction-${auction.id}`,
        type: 'auction' as const,
        title: 'Nouvelle enchère',
        description: `${auction.product?.title || auction.title} - ${auction.store?.name || 'Boutique inconnue'}`,
        time: getTimeAgo(auction.createdAt),
        icon: 'Gavel',
        color: 'orange',
      })),
      users: recentUsers.map(user => ({
        id: `user-${user.id}`,
        type: 'user' as const,
        title: 'Nouvel utilisateur',
        description: `${user.name} (${user.role})`,
        time: getTimeAgo(user.createdAt),
        icon: 'UserPlus',
        color: 'green',
      }))
    };

    // Flatten and sort recent activity
    const flattenedActivity = [
      ...recentActivity.orders,
      ...recentActivity.auctions,
      ...recentActivity.users
    ].sort((a, b) => {
      const timeA = a.time.includes('min') ? parseInt(a.time) : 
                   a.time.includes('h') ? parseInt(a.time) * 60 : 
                   parseInt(a.time) * 1440;
      const timeB = b.time.includes('min') ? parseInt(b.time) : 
                   b.time.includes('h') ? parseInt(b.time) * 60 : 
                   parseInt(b.time) * 1440;
      return timeA - timeB;
    }).slice(0, 5);

    return NextResponse.json({
      metrics: {
        revenue: totalRevenue,
        revenueChange: 12.5, // Would need historical data to calculate properly
        orders: totalOrdersResult,
        ordersChange: -3.2, // Would need historical data to calculate properly
        activeAuctions,
        auctionsChange: 8.7, // Would need historical data to calculate properly
        conversionRate,
        conversionChange: 1.2, // Would need historical data to calculate properly
        totalUsers,
        totalVendors,
        totalProducts,
        pendingReports
      },
      charts: {
        salesData,
        categoryData
      },
      recentActivity: flattenedActivity
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    if (error.message === 'Forbidden') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
    console.error('Error fetching admin dashboard data:', error)
    // Log more detailed error information
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return NextResponse.json({ 
      error: 'Erreur lors du chargement des données du tableau de bord',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

// Fonction utilitaire pour formater le temps écoulé
function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) return 'À l\'instant'
  if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `Il y a ${diffInHours}h`
  
  const diffInDays = Math.floor(diffInHours / 24)
  return `Il y a ${diffInDays}j`
}
