import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig as authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { isAdmin } from '@/lib/admin/permissions';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !isAdmin(session)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Parse dates or use defaults (last 30 days)
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Calculate previous period for comparison
    const periodLength = end.getTime() - start.getTime();
    const previousStart = new Date(start.getTime() - periodLength);
    const previousEnd = new Date(start.getTime());

    // Get total revenue from orders in current period
    const currentOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
        status: 'CONFIRMED',
      },
      select: {
        total: true,
      },
    });

    const totalRevenue = currentOrders.reduce((sum, order) => sum + Number(order.total), 0);
    const transactionCount = currentOrders.length;

    // Get previous period revenue
    const previousOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: previousStart,
          lt: previousEnd,
        },
        status: 'CONFIRMED',
      },
      select: {
        total: true,
      },
    });

    const previousRevenue = previousOrders.reduce((sum, order) => sum + Number(order.total), 0);
    const previousTransactionCount = previousOrders.length;

    // Calculate trends
    const revenueTrend = previousRevenue > 0
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
      : totalRevenue > 0 ? 100 : 0;

    const transactionTrend = previousTransactionCount > 0
      ? ((transactionCount - previousTransactionCount) / previousTransactionCount) * 100
      : transactionCount > 0 ? 100 : 0;

    // Get daily revenue data
    const dailyRevenue = await prisma.$queryRaw<Array<{ date: Date; revenue: number; count: bigint }>>`
      SELECT 
        DATE(createdAt) as date,
        SUM(total) as revenue,
        COUNT(*) as count
      FROM \`Order\`
      WHERE createdAt >= ${start} 
        AND createdAt <= ${end}
        AND status = 'CONFIRMED'
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `;

    // Calculate commission earnings (assuming 10% commission rate)
    const commissionRate = 0.10;
    const commissionEarnings = totalRevenue * commissionRate;
    const previousCommissionEarnings = previousRevenue * commissionRate;
    const commissionTrend = previousCommissionEarnings > 0
      ? ((commissionEarnings - previousCommissionEarnings) / previousCommissionEarnings) * 100
      : commissionEarnings > 0 ? 100 : 0;

    // Get average order value
    const averageOrderValue = transactionCount > 0 ? totalRevenue / transactionCount : 0;
    const previousAverageOrderValue = previousTransactionCount > 0 
      ? previousRevenue / previousTransactionCount 
      : 0;

    // Get revenue by store (top 10)
    const revenueByStore = await prisma.$queryRaw<Array<{ 
      storeId: bigint; 
      storeName: string; 
      revenue: number;
      orderCount: bigint;
    }>>`
      SELECT 
        o.storeId,
        s.name as storeName,
        SUM(o.total) as revenue,
        COUNT(*) as orderCount
      FROM \`Order\` o
      JOIN Store s ON o.storeId = s.id
      WHERE o.createdAt >= ${start} 
        AND o.createdAt <= ${end}
        AND o.status = 'CONFIRMED'
      GROUP BY o.storeId, s.name
      ORDER BY revenue DESC
      LIMIT 10
    `;

    // Get revenue by order status
    const revenueByStatus = await prisma.order.groupBy({
      by: ['status'],
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        total: true,
      },
      _count: {
        id: true,
      },
    });

    return NextResponse.json({
      totalRevenue,
      transactionCount,
      commissionEarnings,
      averageOrderValue,
      revenueTrend,
      transactionTrend,
      commissionTrend,
      dailyRevenue: dailyRevenue.map(d => ({
        date: d.date,
        revenue: Number(d.revenue),
        count: Number(d.count),
      })),
      revenueByStore: revenueByStore.map(s => ({
        storeId: s.storeId.toString(),
        storeName: s.storeName,
        revenue: Number(s.revenue),
        orderCount: Number(s.orderCount),
      })),
      revenueByStatus: revenueByStatus.map(s => ({
        status: s.status,
        revenue: Number(s._sum.total || 0),
        count: s._count.id,
      })),
      comparison: {
        previousRevenue,
        previousTransactionCount,
        previousAverageOrderValue,
      },
      period: {
        start,
        end,
      },
    });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue analytics' },
      { status: 500 }
    );
  }
}
