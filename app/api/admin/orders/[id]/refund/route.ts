import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig as authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { activityLogger } from '@/lib/admin/activity-logger';

/**
 * POST /api/admin/orders/[id]/refund
 * Process order refund
 */
export async function POST(
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
    const { reason, amount, notes } = body;

    // Validate input
    if (!reason) {
      return NextResponse.json(
        { error: 'Refund reason is required' },
        { status: 400 }
      );
    }

    // Get current order
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

    // Validate refund amount
    const refundAmount = amount ? parseFloat(amount) : Number(order.total);
    if (refundAmount <= 0 || refundAmount > Number(order.total)) {
      return NextResponse.json(
        { error: 'Invalid refund amount' },
        { status: 400 }
      );
    }

    // Check if order can be refunded
    if (order.status === 'CANCELED_AFTER_CONFIRM') {
      return NextResponse.json(
        { error: 'Order is already canceled' },
        { status: 400 }
      );
    }

    // Update order status and timeline
    const currentTimeline = (order.timeline as any) || [];
    const newTimelineEntry = {
      timestamp: new Date().toISOString(),
      actor: session.user.name,
      actorRole: 'ADMIN',
      action: 'REFUND_PROCESSED',
      status: order.fulfillStatus,
      orderStatus: 'CANCELED_AFTER_CONFIRM',
      refundAmount,
      reason,
      notes: notes || undefined,
    };

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELED_AFTER_CONFIRM',
        fulfillStatus: 'CANCELED',
        timeline: [...currentTimeline, newTimelineEntry],
      },
    });

    // Log the refund
    await activityLogger.log(
      BigInt(session.user.id),
      {
        action: 'ORDER_REFUNDED',
        entity: 'Order',
        entityId: orderId,
        metadata: {
          orderNumber: order.number,
          refundAmount,
          reason,
          notes,
          buyerId: order.user.user.id.toString(),
          buyerEmail: order.user.user.email,
        },
      },
      request
    );

    // TODO: In a real implementation, integrate with payment gateway to process actual refund
    // For now, we just update the order status

    return NextResponse.json({
      success: true,
      message: 'Refund processed successfully',
      order: {
        id: updatedOrder.id.toString(),
        number: updatedOrder.number,
        status: updatedOrder.status,
        fulfillStatus: updatedOrder.fulfillStatus,
        refundAmount,
      },
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
