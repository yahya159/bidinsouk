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

    // Get total products
    const totalProducts = await prisma.product.count();

    // Get products by status
    const productsByStatus = await prisma.product.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    const statusDistribution = {
      DRAFT: productsByStatus.find(p => p.status === 'DRAFT')?._count.id || 0,
      ACTIVE: productsByStatus.find(p => p.status === 'ACTIVE')?._count.id || 0,
      ARCHIVED: productsByStatus.find(p => p.status === 'ARCHIVED')?._count.id || 0,
    };

    // Get new products in current period
    const newProducts = await prisma.product.count({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });

    // Get new products in previous period
    const previousNewProducts = await prisma.product.count({
      where: {
        createdAt: {
          gte: previousStart,
          lt: previousEnd,
        },
      },
    });

    // Calculate trend
    const newProductsTrend = previousNewProducts > 0
      ? ((newProducts - previousNewProducts) / previousNewProducts) * 100
      : newProducts > 0 ? 100 : 0;

    // Get products by category (top 10)
    const productsByCategory = await prisma.product.groupBy({
      by: ['category'],
      where: {
        category: {
          not: null,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    // Get products by condition
    const productsByCondition = await prisma.product.groupBy({
      by: ['condition'],
      _count: {
        id: true,
      },
    });

    // Get most viewed products
    const mostViewedProducts = await prisma.product.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      select: {
        id: true,
        title: true,
        views: true,
        status: true,
        store: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        views: 'desc',
      },
      take: 10,
    });

    // Get top-selling products (products with most orders)
    // Note: This requires tracking which products were in orders
    // For now, we'll use products with most bids as a proxy
    const topProducts = await prisma.$queryRaw<Array<{
      productId: bigint;
      productTitle: string;
      bidCount: bigint;
      totalBidAmount: number;
    }>>`
      SELECT 
        p.id as productId,
        p.title as productTitle,
        COUNT(b.id) as bidCount,
        SUM(b.amount) as totalBidAmount
      FROM Product p
      LEFT JOIN Auction a ON p.id = a.productId
      LEFT JOIN Bid b ON a.id = b.auctionId
      WHERE b.createdAt >= ${start} AND b.createdAt <= ${end}
      GROUP BY p.id, p.title
      ORDER BY bidCount DESC
      LIMIT 10
    `;

    // Get daily product creation data
    const dailyProductCreation = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as count
      FROM Product
      WHERE createdAt >= ${start} AND createdAt <= ${end}
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `;

    // Get total views in period
    const totalViews = await prisma.product.aggregate({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        views: true,
      },
    });

    // Get average views per product
    const averageViews = newProducts > 0 
      ? (totalViews._sum.views || 0) / newProducts 
      : 0;

    return NextResponse.json({
      totalProducts,
      newProducts,
      statusDistribution,
      newProductsTrend,
      totalViews: totalViews._sum.views || 0,
      averageViews,
      productsByCategory: productsByCategory.map(c => ({
        category: c.category || 'Uncategorized',
        count: c._count.id,
      })),
      productsByCondition: {
        NEW: productsByCondition.find(p => p.condition === 'NEW')?._count.id || 0,
        USED: productsByCondition.find(p => p.condition === 'USED')?._count.id || 0,
      },
      mostViewedProducts: mostViewedProducts.map(p => ({
        id: p.id.toString(),
        title: p.title,
        views: p.views,
        status: p.status,
        storeName: p.store.name,
      })),
      topSellingProducts: topProducts.map(p => ({
        productId: p.productId.toString(),
        title: p.productTitle,
        bidCount: Number(p.bidCount),
        totalBidAmount: Number(p.totalBidAmount || 0),
      })),
      dailyProductCreation: dailyProductCreation.map(d => ({
        date: d.date,
        count: Number(d.count),
      })),
      period: {
        start,
        end,
      },
    });
  } catch (error) {
    console.error('Error fetching product analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product analytics' },
      { status: 500 }
    );
  }
}
