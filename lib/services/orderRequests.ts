import { prisma } from '@/lib/db/prisma'
import { pusher } from '@/lib/realtime/pusher'
import { sendNotification } from '@/lib/notifications/helpers'
import { sendSystemEmail } from '@/lib/email/helpers'

interface CreateOrderRequestInput {
  userId: bigint
  storeId: bigint
  source: string
  address: any
  expiresAt?: Date
}

interface AcceptOrderRequestInput {
  actorId: bigint
  requestId: bigint
}

interface RefuseOrderRequestInput {
  actorId: bigint
  requestId: bigint
  reason?: string
}

export async function createOrderRequest(input: CreateOrderRequestInput) {
  const { userId, storeId, source, address, expiresAt } = input

  // Create the order request
  const orderRequest = await prisma.orderRequest.create({
    data: {
      userId,
      storeId,
      source,
      address,
      expiresAt,
      status: 'requested',
      requestAt: new Date()
    }
  })

  // Notify the store owner/vendor
  const store = await prisma.store.findUnique({
    where: { id: storeId }
  })

  if (store) {
    // Get the store owner
    const storeOwner = await prisma.user.findUnique({
      where: { id: store.sellerId }
    })

    if (storeOwner) {
      // Send notification
      await sendNotification(
        Number(storeOwner.id),
        'order',
        'New Order Request',
        `A new order request has been created for your store ${store.name}`,
        { orderId: Number(orderRequest.id) }
      )

      // Trigger Pusher event for the store
      await pusher.trigger(`store-${storeId}`, 'order_request:created', {
        orderRequest,
        createdAt: new Date()
      })
    }
  }

  return orderRequest
}

export async function acceptOrderRequest(input: AcceptOrderRequestInput) {
  const { actorId, requestId } = input

  // Get the order request
  const orderRequest = await prisma.orderRequest.findUnique({
    where: { id: requestId }
  })

  if (!orderRequest) {
    throw new Error('Order request not found')
  }

  // Check if the actor is the store owner
  const store = await prisma.store.findUnique({
    where: { id: orderRequest.storeId }
  })

  if (!store || store.sellerId !== actorId) {
    throw new Error('Unauthorized: Only store owners can accept order requests')
  }

  // Update the order request status in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Update the order request status
    const updatedRequest = await tx.orderRequest.update({
      where: { id: requestId },
      data: { status: 'seller_accepted' }
    })

    // Create the order
    const order = await tx.order.create({
      data: {
        userId: orderRequest.userId,
        storeId: orderRequest.storeId,
        status: 'pending'
      }
    })

    return { updatedRequest, order }
  })

  // Notify the client
  const client = await prisma.user.findUnique({
    where: { id: orderRequest.userId }
  })

  if (client) {
    // Send notification
    await sendNotification(
      Number(client.id),
      'order',
      'Order Request Accepted',
      `Your order request for store ${store?.name} has been accepted`,
      { orderId: Number(result.order.id) }
    )

    // TODO: Send email notification
    // await sendSystemEmail(
    //   client.email,
    //   'Order Request Accepted',
    //   // Add email template here
    // )
  }

  // Trigger Pusher event for the store
  await pusher.trigger(`store-${orderRequest.storeId}`, 'order_request:accepted', {
    orderRequest: result.updatedRequest,
    order: result.order,
    createdAt: new Date()
  })

  return result
}

export async function refuseOrderRequest(input: RefuseOrderRequestInput) {
  const { actorId, requestId, reason } = input

  // Get the order request
  const orderRequest = await prisma.orderRequest.findUnique({
    where: { id: requestId }
  })

  if (!orderRequest) {
    throw new Error('Order request not found')
  }

  // Check if the actor is the store owner
  const store = await prisma.store.findUnique({
    where: { id: orderRequest.storeId }
  })

  if (!store || store.sellerId !== actorId) {
    throw new Error('Unauthorized: Only store owners can refuse order requests')
  }

  // Update the order request status
  const updatedRequest = await prisma.orderRequest.update({
    where: { id: requestId },
    data: { 
      status: 'seller_refused',
      ...(reason && { details: reason })
    }
  })

  // Notify the client
  const client = await prisma.user.findUnique({
    where: { id: orderRequest.userId }
  })

  if (client) {
    // Send notification
    await sendNotification(
      Number(client.id),
      'order',
      'Order Request Refused',
      `Your order request for store ${store?.name} has been refused${reason ? `: ${reason}` : ''}`,
      { orderId: Number(orderRequest.id) }
    )

    // TODO: Send email notification
    // await sendSystemEmail(
    //   client.email,
    //   'Order Request Refused',
    //   // Add email template here
    // )
  }

  // Trigger Pusher event for the store
  await pusher.trigger(`store-${orderRequest.storeId}`, 'order_request:refused', {
    orderRequest: updatedRequest,
    createdAt: new Date()
  })

  return updatedRequest
}

export async function expireOrderRequest(requestId: bigint) {
  // Update the order request status
  const updatedRequest = await prisma.orderRequest.update({
    where: { id: requestId },
    data: { status: 'expired' }
  })

  // Get the store
  const store = await prisma.store.findUnique({
    where: { id: updatedRequest.storeId }
  })

  if (store) {
    // Trigger Pusher event for the store
    await pusher.trigger(`store-${updatedRequest.storeId}`, 'order_request:expired', {
      orderRequest: updatedRequest,
      createdAt: new Date()
    })
  }

  return updatedRequest
}