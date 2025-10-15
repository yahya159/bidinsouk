import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig as authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { activityLogger } from '@/lib/admin/activity-logger';

/**
 * GET /api/admin/orders
 * Get orders list with pagination, search, and filters
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const search = searchParams.get('search');
    const fulfillStatus = searchParams.get('fulfillStatus');
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const storeId = searchParams.get('storeId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const amountMin = searchParams.get('amountMin');
    const amountMax = searchParams.get('amountMax');

    // Build where clause
    const where: any = {};

    // Search by order number
    if (search) {
      where.number = {
        contains: search,
      };
    }

    if (fulfillStatus) {
      where.fulfillStatus = fulfillStatus;
    }

    if (status) {
      where.status = status;
    }

    if (userId) {
      where.userId = BigInt(userId);
    }

    if (storeId) {
      where.storeId = BigInt(storeId);
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    // Amount range filter
    if (amountMin || amountMax) {
      where.total = {};
      if (amountMin) {
        where.total.gte = parseFloat(amountMin);
      }
      if (amountMax) {
        where.total.lte = parseFloat(amountMax);
      }
    }

    // Fetch orders with pagination
    const skip = (page - 1) * pageSize;
    
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          store: {
            include: {
              seller: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ]);

    // Format orders for response
    const formattedOrders = orders.map((order) => ({
      id: order.id.toString(),
      number: order.number,
      total: Number(order.total),
      status: order.status,
      fulfillStatus: order.fulfillStatus,
      shipping: order.shipping,
      timeline: order.timeline,
      createdAt: order.createdAt,
      user: {
        id: order.user.user.id.toString(),
        name: order.user.user.name,
        email: order.user.user.email,
      },
      store: {
        id: order.store.id.toString(),
        name: order.store.name,
        seller: {
          id: order.store.seller.user.id.toString(),
          name: order.store.seller.user.name,
          email: order.store.seller.user.email,
        },
      },
    }));

    // Log the access
    await activityLogger.log(
      BigInt(session.user.id),
      {
        action: 'ORDERS_VIEWED',
        entity: 'Order',
        entityId: BigInt(0),
        metadata: {
          filters: { search, fulfillStatus, status, userId, storeId, dateFrom, dateTo, amountMin, amountMax },
          resultCount: total,
        },
      },
      request
    );

    return NextResponse.json({
      orders: formattedOrders,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
