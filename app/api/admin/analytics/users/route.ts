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

    // Get total users
    const totalUsers = await prisma.user.count();

    // Get users by role
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        id: true,
      },
    });

    const roleDistribution = {
      CLIENT: usersByRole.find(r => r.role === 'CLIENT')?._count.id || 0,
      VENDOR: usersByRole.find(r => r.role === 'VENDOR')?._count.id || 0,
      ADMIN: usersByRole.find(r => r.role === 'ADMIN')?._count.id || 0,
    };

    // Get new users in current period
    const newUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });

    // Get new users in previous period
    const previousNewUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: previousStart,
          lt: previousEnd,
        },
      },
    });

    // Calculate registration trend
    const registrationTrend = previousNewUsers > 0
      ? ((newUsers - previousNewUsers) / previousNewUsers) * 100
      : newUsers > 0 ? 100 : 0;

    // Get daily registration data for the period
    const dailyRegistrations = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as count
      FROM User
      WHERE createdAt >= ${start} AND createdAt <= ${end}
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `;

    // Get active users (users with recent activity - bids, orders, messages in period)
    const activeUserIds = new Set<bigint>();

    // Users who placed bids
    const bidders = await prisma.bid.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      select: {
        client: {
          select: {
            userId: true,
          },
        },
      },
    });
    bidders.forEach(b => activeUserIds.add(b.client.userId));

    // Users who placed orders
    const buyers = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      select: {
        userId: true,
      },
    });
    buyers.forEach(o => activeUserIds.add(o.userId));

    // Users who sent messages
    const messageSenders = await prisma.message.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      select: {
        senderId: true,
      },
      distinct: ['senderId'],
    });
    messageSenders.forEach(m => activeUserIds.add(m.senderId));

    const activeUsers = activeUserIds.size;

    // Get previous period active users for comparison
    const previousActiveUserIds = new Set<bigint>();

    const previousBidders = await prisma.bid.findMany({
      where: {
        createdAt: {
          gte: previousStart,
          lt: previousEnd,
        },
      },
      select: {
        client: {
          select: {
            userId: true,
          },
        },
      },
    });
    previousBidders.forEach(b => previousActiveUserIds.add(b.client.userId));

    const previousBuyers = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: previousStart,
          lt: previousEnd,
        },
      },
      select: {
        userId: true,
      },
    });
    previousBuyers.forEach(o => previousActiveUserIds.add(o.userId));

    const previousMessageSenders = await prisma.message.findMany({
      where: {
        createdAt: {
          gte: previousStart,
          lt: previousEnd,
        },
      },
      select: {
        senderId: true,
      },
      distinct: ['senderId'],
    });
    previousMessageSenders.forEach(m => previousActiveUserIds.add(m.senderId));

    const previousActiveUsers = previousActiveUserIds.size;

    // Calculate active users trend
    const activeUsersTrend = previousActiveUsers > 0
      ? ((activeUsers - previousActiveUsers) / previousActiveUsers) * 100
      : activeUsers > 0 ? 100 : 0;

    // Calculate engagement rate (active users / total users)
    const engagementRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;

    return NextResponse.json({
      totalUsers,
      newUsers,
      activeUsers,
      roleDistribution,
      registrationTrend,
      activeUsersTrend,
      engagementRate,
      dailyRegistrations: dailyRegistrations.map(d => ({
        date: d.date,
        count: Number(d.count),
      })),
      period: {
        start,
        end,
      },
    });
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user analytics' },
      { status: 500 }
    );
  }
}
