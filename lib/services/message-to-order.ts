/**
 * Message-to-Order Service
 * Handles the complete flow from product inquiry to order completion
 */

import { prisma } from '@/lib/db/prisma'
import { pusher } from '@/lib/realtime/pusher'
import { sendNotification } from '@/lib/notifications/helpers'
import { Decimal } from '@prisma/client/runtime/library'

// ============================================================================
// THREAD MANAGEMENT
// ============================================================================

export async function findOrCreateThread(
  buyerId: bigint,
  vendorId: bigint,
  productId: bigint
) {
  // Check for existing thread
  const existingThread = await prisma.messageThread.findFirst({
    where: {
      productId: productId,
      participants: {
        every: {
          userId: { in: [buyerId, vendorId] }
        }
      }
    },
    include: {
      participants: true,
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  })

  if (existingThread) {
    return existingThread
  }

  // Create new thread with transaction
  return await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: productId },
      select: { title: true, storeId: true }
    })

    if (!product) {
      throw new Error('Product not found')
    }

    const thread = await tx.messageThread.create({
      data: {
        type: 'VENDOR_CHAT',
        subject: `Inquiry about ${product.title}`,
        vendorId: vendorId,
        productId: productId,
        participants: {
          create: [
            { userId: buyerId, role: 'USER' },
            { userId: vendorId, role: 'VENDOR' }
          ]
        }
      },
      include: {
        participants: true,
        messages: true
      }
    })

    // Send initial message
    await tx.message.create({
      data: {
        threadId: thread.id,
        senderId: vendorId,
        content: `Hello! Thank you for your interest in ${product.title}. How can I help you?`
      }
    })

    return thread
  })
}

// ============================================================================
// ORDER REQUEST MANAGEMENT
// ============================================================================

export interface CreateOrderRequestInput {
  threadId: string;
  userId: bigint;
  productId: bigint;
  quantity: number;
  paymentMethod: 'cod' | 'bank' | 'inperson';
  deliveryAddress: any;
  notes?: string;
}

export async function createOrderRequest(input: CreateOrderRequestInput) {
  // Validate product availability
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    include: { store: true }
  })

  if (!product || product.status !== 'ACTIVE') {
    throw new Error('Product is not available')
  }

  // Check for existing active request
  const existingRequest = await prisma.orderRequest.findFirst({
    where: {
      userId: input.userId,
      status: { in: ['REQUESTED', 'SELLER_ACCEPTED'] }
    }
  })

  if (existingRequest) {
    throw new Error('An order request is already pending')
  }

  // Create order request
  return await prisma.$transaction(async (tx) => {
    const orderRequest = await tx.orderRequest.create({
      data: {
        userId: input.userId,
        storeId: product.storeId,
        source: 'BUY_NOW',
        address: input.deliveryAddress,
        notes: input.notes,
        status: 'REQUESTED'
      }
    })

    // Send auto-message
    await tx.message.create({
      data: {
        threadId: input.threadId,
        senderId: input.userId,
        content: '📦 Order request created. Awaiting vendor response.'
      }
    })

    // Notify vendor
    await sendNotification(
      Number(product.store.sellerId),
      'ORDER',
      'New Order Request',
      `A new order request has been created for ${product.title}`,
      { 
        orderId: Number(orderRequest.id),
        threadId: input.threadId
      }
    )

    // Trigger Pusher event for real-time updates
    await pusher.trigger(`thread-${input.threadId}`, 'order_request:created', {
      orderRequest: {
        id: orderRequest.id.toString(),
        status: orderRequest.status,
        createdAt: orderRequest.createdAt.toISOString()
      }
    })

    return orderRequest
  })
}

// ============================================================================
// VENDOR ACTIONS
// ============================================================================

export async function acceptOrderRequest(
  requestId: bigint,
  vendorId: bigint
) {
  const request = await prisma.orderRequest.findFirst({
    where: { id: requestId },
    include: { 
      user: {
        include: {
          user: true
        }
      },
      store: true
    }
  })

  if (!request) {
    throw new Error('Order request not found')
  }

  if (request.status !== 'REQUESTED') {
    throw new Error('Order request already processed')
  }

  return await prisma.$transaction(async (tx) => {
    // Update request status
    await tx.orderRequest.update({
      where: { id: requestId },
      data: {
        status: 'SELLER_ACCEPTED'
      }
    })

    // Create order
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    
    const order = await tx.order.create({
      data: {
        userId: request.userId,
        storeId: request.storeId,
        number: orderNumber,
        total: new Decimal(0), // Will be updated later
        status: 'CONFIRMED',
        fulfillStatus: 'PENDING'
      }
    })

    // Update message thread with order reference
    const thread = await tx.messageThread.findFirst({
      where: {
        participants: {
          some: {
            userId: request.userId
          }
        },
        vendorId: vendorId
      }
    })

    if (thread) {
      await tx.messageThread.update({
        where: { id: thread.id },
        data: {
          orderId: order.id,
          category: 'ORDER'
        }
      })
    }

    // Send auto-message
    await tx.message.create({
      data: {
        threadId: thread?.id || '',
        senderId: vendorId,
        content: '✅ Order request accepted! Please proceed with payment as discussed in our conversation.'
      }
    })

    // Notify buyer
    await sendNotification(
      Number(request.userId),
      'ORDER',
      'Order Request Accepted',
      `Your order request has been accepted`,
      { 
        orderId: Number(order.id),
        threadId: thread?.id || ''
      }
    )

    // Trigger Pusher event for real-time updates
    if (thread) {
      await pusher.trigger(`thread-${thread.id}`, 'order_request:accepted', {
        order: {
          id: order.id.toString(),
          status: order.status,
          createdAt: order.createdAt.toISOString()
        }
      })
    }

    return order
  })
}

export async function refuseOrderRequest(
  requestId: bigint,
  vendorId: bigint,
  reason: string
) {
  const request = await prisma.orderRequest.findFirst({
    where: { id: requestId },
    include: { 
      user: {
        include: {
          user: true
        }
      },
      store: true
    }
  })

  if (!request) {
    throw new Error('Order request not found')
  }

  if (request.status !== 'REQUESTED') {
    throw new Error('Order request already processed')
  }

  // Find the thread
  const thread = await prisma.messageThread.findFirst({
    where: {
      participants: {
        some: {
          userId: request.userId
        }
      },
      vendorId: vendorId
    }
  })

  return await prisma.$transaction(async (tx) => {
    // Update request status
    await tx.orderRequest.update({
      where: { id: requestId },
      data: {
        status: 'SELLER_REFUSED',
        notes: reason
      }
    })

    // Send auto-message
    await tx.message.create({
      data: {
        threadId: thread?.id || '',
        senderId: vendorId,
        content: `❌ Order request declined. Reason: ${reason}`
      }
    })

    // Notify buyer
    await sendNotification(
      Number(request.userId),
      'ORDER',
      'Order Request Declined',
      `Your order request has been declined. Reason: ${reason}`,
      { 
        requestId: Number(requestId),
        threadId: thread?.id || ''
      }
    )

    // Trigger Pusher event for real-time updates
    if (thread) {
      await pusher.trigger(`thread-${thread.id}`, 'order_request:refused', {
        reason,
        refusedAt: new Date().toISOString()
      })
    }
  })
}

// ============================================================================
// PAYMENT MANAGEMENT
// ============================================================================

export async function initiatePayment(
  orderId: bigint,
  vendorId: bigint,
  paymentDetails: {
    method: 'cod' | 'bank' | 'inperson';
    instructions: string;
  }
) {
  const order = await prisma.order.findFirst({
    where: { id: orderId },
    include: { 
      user: {
        include: {
          user: true
        }
      }
    }
  })

  if (!order) {
    throw new Error('Order not found')
  }

  // Find the thread
  const thread = await prisma.messageThread.findFirst({
    where: {
      orderId: orderId
    }
  })

  return await prisma.$transaction(async (tx) => {
    // Send payment instructions message
    let methodLabel = '';
    switch (paymentDetails.method) {
      case 'cod': methodLabel = 'Cash on Delivery'; break;
      case 'bank': methodLabel = 'Bank Transfer'; break;
      case 'inperson': methodLabel = 'In Person'; break;
    }

    await tx.message.create({
      data: {
        threadId: thread?.id || '',
        senderId: vendorId,
        content: `💳 Payment Instructions

Payment Method: ${methodLabel}

${paymentDetails.instructions}

Please confirm when payment is completed.`
      }
    })

    // Notify buyer
    await sendNotification(
      Number(order.userId),
      'ORDER',
      'Payment Instructions',
      `Payment instructions for your order #${order.number} have been provided`,
      { 
        orderId: Number(order.id),
        threadId: thread?.id || ''
      }
    )

    // Trigger Pusher event for real-time updates
    if (thread) {
      await pusher.trigger(`thread-${thread.id}`, 'payment:initiated', {
        orderId: orderId.toString(),
        method: paymentDetails.method
      })
    }

    return order
  })
}

export async function confirmPaymentReceived(
  orderId: bigint,
  vendorId: bigint,
  notes?: string
) {
  const order = await prisma.order.findFirst({
    where: { id: orderId },
    include: { 
      user: {
        include: {
          user: true
        }
      }
    }
  })

  if (!order) {
    throw new Error('Order not found')
  }

  // Find the thread
  const thread = await prisma.messageThread.findFirst({
    where: {
      orderId: orderId
    }
  })

  return await prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        status: 'CONFIRMED'
      }
    })

    // Send auto-message
    await tx.message.create({
      data: {
        threadId: thread?.id || '',
        senderId: vendorId,
        content: `💰 Payment confirmed!${notes ? `

Notes: ${notes}` : ''}

Your order is being prepared for fulfillment.`
      }
    })

    // Notify buyer
    await sendNotification(
      Number(order.userId),
      'ORDER',
      'Payment Confirmed',
      `Payment for your order #${order.number} has been confirmed`,
      { 
        orderId: Number(order.id),
        threadId: thread?.id || ''
      }
    )

    // Trigger Pusher event for real-time updates
    if (thread) {
      await pusher.trigger(`thread-${thread.id}`, 'payment:confirmed', {
        orderId: orderId.toString(),
        confirmedAt: new Date().toISOString()
      })
    }

    return updated
  })
}

// ============================================================================
// FULFILLMENT MANAGEMENT
// ============================================================================

export async function updateFulfillmentStatus(
  orderId: bigint,
  vendorId: bigint,
  status: 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'READY_FOR_PICKUP' | 'CANCELED',
  trackingNumber?: string
) {
  const order = await prisma.order.findFirst({
    where: { id: orderId },
    include: { 
      user: {
        include: {
          user: true
        }
      }
    }
  })

  if (!order) {
    throw new Error('Order not found')
  }

  // Find the thread
  const thread = await prisma.messageThread.findFirst({
    where: {
      orderId: orderId
    }
  })

  return await prisma.$transaction(async (tx) => {
    const updateData: any = {
      fulfillStatus: status
    }

    if (status === 'SHIPPED') {
      updateData.shipping = {
        shippedAt: new Date(),
        ...(trackingNumber && { trackingNumber })
      }
    } else if (status === 'DELIVERED') {
      updateData.timeline = {
        ...(order.timeline as object || {}),
        deliveredAt: new Date()
      }
    } else if (status === 'CANCELED') {
      updateData.timeline = {
        ...(order.timeline as object || {}),
        cancelledAt: new Date()
      }
    }

    const updated = await tx.order.update({
      where: { id: orderId },
      data: updateData
    })

    // Send auto-message
    let message = ''
    if (status === 'SHIPPED') {
      message = trackingNumber
        ? `🚚 Order shipped! Tracking: ${trackingNumber}`
        : '🚚 Order shipped!'
    } else if (status === 'DELIVERED') {
      message = '✅ Order delivered! Please confirm receipt.'
    } else if (status === 'READY_FOR_PICKUP') {
      message = '📦 Order ready for pickup!'
    } else if (status === 'CANCELED') {
      message = '❌ Order has been cancelled.'
    } else if (status === 'PREPARING') {
      message = '🔧 Order is being prepared.'
    }

    if (message) {
      await tx.message.create({
        data: {
          threadId: thread?.id || '',
          senderId: vendorId,
          content: message
        }
      })

      // Notify buyer
      await sendNotification(
        Number(order.userId),
        'ORDER',
        'Order Status Updated',
        `Your order #${order.number} status has been updated to ${status}`,
        { 
          orderId: Number(order.id),
          threadId: thread?.id || ''
        }
      )
    }

    // Trigger Pusher event for real-time updates
    if (thread) {
      await pusher.trigger(`thread-${thread.id}`, 'fulfillment:updated', {
        orderId: orderId.toString(),
        status: status,
        updatedAt: new Date().toISOString()
      })
    }

    return updated
  })
}

// ============================================================================
// CANCELLATION MANAGEMENT
// ============================================================================

export async function cancelOrder(
  orderId: bigint,
  userId: bigint,
  reason: string,
  isVendor: boolean = false
) {
  const order = await prisma.order.findFirst({
    where: { 
      id: orderId
    },
    include: { 
      user: {
        include: {
          user: true
        }
      }
    }
  })

  if (!order) {
    throw new Error('Order not found')
  }

  // Find the thread
  const thread = await prisma.messageThread.findFirst({
    where: {
      orderId: orderId
    }
  })

  return await prisma.$transaction(async (tx) => {
    // Update order
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELED_AFTER_CONFIRM',
        timeline: {
          ...(order.timeline as object || {}),
          cancelledAt: new Date(),
          cancellationReason: reason,
          cancelledBy: isVendor ? 'VENDOR' : 'BUYER'
        }
      }
    })

    // Send auto-message
    const actor = isVendor ? 'Vendor' : 'Buyer'
    
    await tx.message.create({
      data: {
        threadId: thread?.id || '',
        senderId: userId,
        content: `❌ Order cancelled by ${actor}. Reason: ${reason}.`
      }
    })

    // Notify the other party
    const notifyUserId = isVendor ? Number(order.userId) : Number(order.storeId);
    await sendNotification(
      notifyUserId,
      'ORDER',
      'Order Cancelled',
      `Order #${order.number} has been cancelled by ${actor}. Reason: ${reason}`,
      { 
        orderId: Number(order.id),
        threadId: thread?.id || ''
      }
    )

    // Trigger Pusher event for real-time updates
    if (thread) {
      await pusher.trigger(`thread-${thread.id}`, 'order:cancelled', {
        orderId: orderId.toString(),
        status: 'CANCELED_AFTER_CONFIRM',
        cancelledAt: new Date().toISOString()
      })
    }
  })
}