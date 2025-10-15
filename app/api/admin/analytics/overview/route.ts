import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig as authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { activityLogger } from '@/lib/admin/activity-logger';

/**
 * Dashboard statistics interface
 */
interface DashboardStats {
  users: {
    total: number;
    newToday: number;
    active: number;
    byRole: {
      CLIENT: number;
      VENDOR: number;
      ADMIN: number;
    };
  };
  products: {
    total: number;
    active: number;
    draft: number;
    archived: number;
  };
  auctions: {
    total: number;
    running: number;
    endingSoon: number;
    endedToday: number;
  };
  orders: {
    total: number;
    pending: number;
    todayCount: number;
    todayRevenue: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    today: number;
  };
}

/**
 * GET /api/admin/analytics/overview
 * Get dashboard statistics for admin overview
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const userId = BigInt(session.user.id);

    // Calculate date ranges
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endingSoonThreshold = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Fetch all statistics in parallel
    const [
      // User statistics
      totalUsers,
      newUsersToday,
      clientCount,
      vendorCount,
      adminCount,
      
      // Product statistics
      totalProducts,
      activeProducts,
      draftProducts,
      archivedProducts,
      
      // Auction statistics
      totalAuctions,
      runningAuctions,
      endingSoonAuctions,
      endedTodayAuctions,
      
      // Order statistics
      totalOrders,
      pendingOrders,
      todayOrders,
      
      // Revenue statistics
      totalRevenue,
      monthRevenue,
      todayRevenue,
    ] = await Promise.all([
      // Users
      prisma.user.count(),
      prisma.user.count({
        where: {
          createdAt: {
            gte: startOfToday,
          },
        },
      }),
      prisma.user.count({ where: { role: 'CLIENT' } }),
      prisma.user.count({ where: { role: 'VENDOR' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      
      // Products
      prisma.product.count(),
      prisma.product.count({ where: { status: 'ACTIVE' } }),
      prisma.product.count({ where: { status: 'DRAFT' } }),
      prisma.product.count({ where: { status: 'ARCHIVED' } }),
      
      // Auctions
      prisma.auction.count(),
      prisma.auction.count({ where: { status: 'RUNNING' } }),
      prisma.auction.count({
        where: {
          status: 'RUNNING',
          endAt: {
            lte: endingSoonThreshold,
          },
        },
      }),
      prisma.auction.count({
        where: {
          status: 'ENDED',
          endAt: {
            gte: startOfToday,
          },
        },
      }),
      
      // Orders
      prisma.order.count(),
      prisma.order.count({
        where: {
          fulfillStatus: 'PENDING',
        },
      }),
      prisma.order.count({
        where: {
          createdAt: {
            gte: startOfToday,
          },
        },
      }),
      
      // Revenue
      prisma.order.aggregate({
        _sum: {
          total: true,
        },
        where: {
          status: 'CONFIRMED',
        },
      }),
      prisma.order.aggregate({
        _sum: {
          total: true,
        },
        where: {
          status: 'CONFIRMED',
          createdAt: {
            gte: startOfMonth,
          },
        },
      }),
      prisma.order.aggregate({
        _sum: {
          total: true,
        },
        where: {
          status: 'CONFIRMED',
          createdAt: {
            gte: startOfToday,
          },
        },
      }),
    ]);

    // Calculate active users (users with activity in the last 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const activeUsers = await prisma.auditLog.groupBy({
      by: ['actorId'],
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    const stats: DashboardStats = {
      users: {
        total: totalUsers,
        newToday: newUsersToday,
        active: activeUsers.length,
        byRole: {
          CLIENT: clientCount,
          VENDOR: vendorCount,
          ADMIN: adminCount,
        },
      },
      products: {
        total: totalProducts,
        active: activeProducts,
        draft: draftProducts,
        archived: archivedProducts,
      },
      auctions: {
        total: totalAuctions,
        running: runningAuctions,
        endingSoon: endingSoonAuctions,
        endedToday: endedTodayAuctions,
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        todayCount: todayOrders,
        todayRevenue: Number(todayRevenue._sum.total || 0),
      },
      revenue: {
        total: Number(totalRevenue._sum.total || 0),
        thisMonth: Number(monthRevenue._sum.total || 0),
        today: Number(todayRevenue._sum.total || 0),
      },
    };

    // Log dashboard access
    await activityLogger.log(
      userId,
      {
        action: 'DASHBOARD_ACCESSED',
        entity: 'Dashboard',
        entityId: userId,
        metadata: {
          timestamp: now.toISOString(),
        },
      },
      request
    );

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
