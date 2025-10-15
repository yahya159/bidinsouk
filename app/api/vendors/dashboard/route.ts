import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getVendorId } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth(request);
    const vendorId = await getVendorId(request);

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor access required' },
        { status: 403 }
      );
    }

    // Get current date and previous month for comparison
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Get vendor's stores
    const stores = await prisma.store.findMany({
      where: { sellerId: vendorId },
      select: { id: true }
    });

    const storeIds = stores.map((store: { id: bigint }) => store.id);

    if (storeIds.length === 0) {
      // No stores yet, return empty metrics
      return NextResponse.json({
        metrics: {
          revenue: 0,
          revenueChange: 0,
          orders: 0,
          ordersChange: 0,
          activeAuctions: 0,
          auctionsChange: 0,
          conversionRate: 0,
          conversionChange: 0,
        },
        salesData: [],
        categoryData: [],
        recentActivity: []
      });
    }

    // Calculate revenue metrics
    const currentMonthOrders = await prisma.order.findMany({
      where: {
        storeId: { in: storeIds },
        createdAt: { gte: currentMonth },
        status: 'CONFIRMED'
      },
      select: { total: true }
    });

    const previousMonthOrders = await prisma.order.findMany({
      where: {
        storeId: { in: storeIds },
        createdAt: { 
          gte: previousMonth,
          lt: currentMonth
        },
        status: 'CONFIRMED'
      },
      select: { total: true }
    });

    const currentRevenue = currentMonthOrders.reduce((sum: number, order: { total: any }) => 
      sum + Number(order.total), 0
    );
    const previousRevenue = previousMonthOrders.reduce((sum: number, order: { total: any }) => 
      sum + Number(order.total), 0
    );

    const revenueChange = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : 0;

    // Calculate order metrics
    const currentOrderCount = currentMonthOrders.length;
    const previousOrderCount = previousMonthOrders.length;
    const ordersChange = previousOrderCount > 0
      ? ((currentOrderCount - previousOrderCount) / previousOrderCount) * 100
      : 0;

    // Get active auctions
    const activeAuctions = await prisma.auction.count({
      where: {
        storeId: { in: storeIds },
        status: { in: ['SCHEDULED', 'RUNNING', 'ENDING_SOON'] }
      }
    });

    // Get previous month active auctions for comparison (simplified)
    const previousActiveAuctions = Math.max(0, activeAuctions - 2); // Mock comparison for now

    const auctionsChange = previousActiveAuctions > 0
      ? ((activeAuctions - previousActiveAuctions) / previousActiveAuctions) * 100
      : 0;

    // Calculate conversion rate (orders / total visitors - simplified)
    // For now, we'll use a mock calculation
    const conversionRate = currentOrderCount > 0 ? 3.4 : 0;
    const conversionChange = 1.2; // Mock data

    // Get sales data for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const salesData = await prisma.order.groupBy({
      by: ['createdAt'],
      where: {
        storeId: { in: storeIds },
        createdAt: { gte: thirtyDaysAgo },
        status: 'CONFIRMED'
      },
      _sum: {
        total: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Format sales data for chart
    const formattedSalesData = salesData.map((item: any) => ({
      name: item.createdAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      value: Number(item._sum.total || 0)
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
    const recentOrders = await prisma.order.findMany({
      where: {
        storeId: { in: storeIds }
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        number: true,
        total: true,
        createdAt: true
      }
    });

    const recentBids = await prisma.bid.findMany({
      where: {
        auction: {
          storeId: { in: storeIds }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        auction: {
          select: { title: true }
        },
        client: {
          include: {
            user: {
              select: { name: true }
            }
          }
        }
      }
    });

    const recentActivity = [
      ...recentOrders.map((order: any) => ({
        id: `order-${order.id}`,
        type: 'order' as const,
        title: `Nouvelle commande #${order.number}`,
        description: `${new Intl.NumberFormat('fr-FR').format(Number(order.total))} MAD`,
        timeAgo: getTimeAgo(order.createdAt),
      })),
      ...recentBids.map((bid: any) => ({
        id: `bid-${bid.id}`,
        type: 'bid' as const,
        title: 'Nouvelle mise',
        description: `${bid.auction.title} - ${new Intl.NumberFormat('fr-FR').format(Number(bid.amount))} MAD par ${bid.client.user.name}`,
        timeAgo: getTimeAgo(bid.createdAt),
      }))
    ].sort((a, b) => new Date(b.timeAgo).getTime() - new Date(a.timeAgo).getTime()).slice(0, 10);

    return NextResponse.json({
      metrics: {
        revenue: currentRevenue,
        revenueChange: Math.round(revenueChange * 100) / 100,
        orders: currentOrderCount,
        ordersChange: Math.round(ordersChange * 100) / 100,
        activeAuctions,
        auctionsChange: Math.round(auctionsChange * 100) / 100,
        conversionRate,
        conversionChange,
      },
      salesData: formattedSalesData,
      categoryData,
      recentActivity
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
