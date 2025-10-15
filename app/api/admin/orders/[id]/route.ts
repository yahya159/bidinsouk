import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig as authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { activityLogger } from '@/lib/admin/activity-logger';

/**
 * GET /api/admin/orders/[id]
 * Get order details
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;

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

    const orderId = BigInt(params.id);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                avatarUrl: true,
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
                    phone: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Format order for response
    const formattedOrder = {
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
        phone: order.user.user.phone,
        avatarUrl: order.user.user.avatarUrl,
      },
      store: {
        id: order.store.id.toString(),
        name: order.store.name,
        email: order.store.email,
        phone: order.store.phone,
        address: order.store.address,
        seller: {
          id: order.store.seller.user.id.toString(),
          name: order.store.seller.user.name,
          email: order.store.seller.user.email,
          phone: order.store.seller.user.phone,
        },
      },
    };

    // Log the access
    await activityLogger.log(
      BigInt(session.user.id),
      {
        action: 'ORDER_VIEWED',
        entity: 'Order',
        entityId: orderId,
        metadata: {
          orderNumber: order.number,
        },
      },
      request
    );

    return NextResponse.json(formattedOrder);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/orders/[id]
 * Update order status
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;

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

    const orderId = BigInt(params.id);
    const body = await request.json();
    const { status, fulfillStatus, notes } = body;

    // Get current order for logging
    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!currentOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Validate status transitions
    const validOrderStatuses = ['CONFIRMED', 'REFUSED', 'CANCELED_AFTER_CONFIRM'];
    const validFulfillStatuses = ['PENDING', 'PREPARING', 'READY_FOR_PICKUP', 'SHIPPED', 'DELIVERED', 'CANCELED'];

    if (status && !validOrderStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid order status' },
        { status: 400 }
      );
    }

    if (fulfillStatus && !validFulfillStatuses.includes(fulfillStatus)) {
      return NextResponse.json(
        { error: 'Invalid fulfillment status' },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: any = {};
    
    if (status) {
      updateData.status = status;
    }
    
    if (fulfillStatus) {
      updateData.fulfillStatus = fulfillStatus;
    }

    // Update timeline if provided
    if (notes || status || fulfillStatus) {
      const currentTimeline = (currentOrder.timeline as any) || [];
      const newTimelineEntry = {
        timestamp: new Date().toISOString(),
        actor: session.user.name,
        actorRole: 'ADMIN',
        status: fulfillStatus || currentOrder.fulfillStatus,
        orderStatus: status || currentOrder.status,
        notes: notes || undefined,
      };
      
      updateData.timeline = [...currentTimeline, newTimelineEntry];
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
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
    });

    // Log the update
    await activityLogger.log(
      BigInt(session.user.id),
      {
        action: 'ORDER_STATUS_UPDATED',
        entity: 'Order',
        entityId: orderId,
        metadata: {
          orderNumber: currentOrder.number,
          oldStatus: currentOrder.status,
          newStatus: status || currentOrder.status,
          oldFulfillStatus: currentOrder.fulfillStatus,
          newFulfillStatus: fulfillStatus || currentOrder.fulfillStatus,
          notes,
        },
      },
      request
    );

    // Format response
    const formattedOrder = {
      id: updatedOrder.id.toString(),
      number: updatedOrder.number,
      total: Number(updatedOrder.total),
      status: updatedOrder.status,
      fulfillStatus: updatedOrder.fulfillStatus,
      shipping: updatedOrder.shipping,
      timeline: updatedOrder.timeline,
      createdAt: updatedOrder.createdAt,
      user: {
        id: updatedOrder.user.user.id.toString(),
        name: updatedOrder.user.user.name,
        email: updatedOrder.user.user.email,
      },
      store: {
        id: updatedOrder.store.id.toString(),
        name: updatedOrder.store.name,
        seller: {
          id: updatedOrder.store.seller.user.id.toString(),
          name: updatedOrder.store.seller.user.name,
          email: updatedOrder.store.seller.user.email,
        },
      },
    };

    return NextResponse.json(formattedOrder);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
