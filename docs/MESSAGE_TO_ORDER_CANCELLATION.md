# Order Cancellation & Refund Flow

## Cancellation Scenarios

### 1. Buyer Cancels Before Vendor Accepts

```typescript
async function cancelOrderRequest(
  requestId: bigint,
  userId: bigint,
  reason: string
) {
  const request = await prisma.orderRequest.findFirst({
    where: { id: requestId, userId }
  })

  if (!request) {
    throw new Error('Order request not found')
  }

  if (request.status !== 'REQUESTED') {
    throw new Error('Can only cancel pending requests')
  }

  // Cancel request
  await prisma.orderRequest.update({
    where: { id: requestId },
    data: {
      status: 'CANCELLED',
      cancellationReason: reason,
      cancelledAt: new Date()
    }
  })

  // No inventory to restock (not reserved yet)

  // Notify vendor
  await createNotification({
    userId: request.vendorId,
    type: 'ORDER_REQUEST_CANCELLED',
    title: 'Order Request Cancelled',
    message: 'The buyer cancelled their order request',
    link: `/messages/${request.threadId}`
  })

  // Send auto-message
  await prisma.message.create({
    data: {
      threadId: request.threadId,
      senderId: userId,
      content: `❌ Order request cancelled. Reason: ${reason}`,
      isSystem: true
    }
  })
}
```

### 2. Buyer Cancels After Acceptance (Before Payment)

```typescript
async function cancelOrderBeforePayment(
  orderId: bigint,
  userId: bigint,
  reason: string
) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { orderRequest: true }
  })

  if (!order) {
    throw new Error('Order not found')
  }

  if (order.paymentStatus === 'PAID') {
    throw new Error('Cannot cancel paid order without vendor approval')
  }

  // Cancel order
  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'CANCELLED',
      cancellationReason: reason,
      cancelledAt: new Date()
    }
  })

  // Restock inventory
  await restockInventory(order.productId, order.quantity)

  // Notify vendor
  await notifyOrderCancelled(order, reason)

  // Send auto-message
  await prisma.message.create({
    data: {
      threadId: order.threadId,
      senderId: userId,
      content: `❌ Order cancelled. Reason: ${reason}`,
      isSystem: true
    }
  })
}
```

### 3. Buyer Cancels After Payment (Requires Refund)

```typescript
async function requestCancellationWithRefund(
  orderId: bigint,
  userId: bigint,
  reason: string
) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId }
  })

  if (!order) {
    throw new Error('Order not found')
  }

  if (order.paymentStatus !== 'PAID') {
    throw new Error('No payment to refund')
  }

  if (order.fulfillmentStatus === 'DELIVERED') {
    throw new Error('Cannot cancel delivered order')
  }

  // Create cancellation request
  const cancellationRequest = await prisma.cancellationRequest.create({
    data: {
      orderId,
      requestedBy: userId,
      reason,
      status: 'PENDING',
      requiresRefund: true
    }
  })

  // Notify vendor (requires approval)
  await createNotification({
    userId: order.vendorId,
    type: 'CANCELLATION_REQUEST',
    title: 'Cancellation Request',
    message: 'Buyer requested to cancel a paid order',
    link: `/vendor/orders/${orderId}`,
    priority: 'HIGH',
    actionRequired: true
  })

  // Send auto-message
  await prisma.message.create({
    data: {
      threadId: order.threadId,
      senderId: userId,
      content: `⚠️ Cancellation requested. Reason: ${reason}. Awaiting vendor approval.`,
      isSystem: true
    }
  })

  return cancellationRequest
}
```

### 4. Vendor Approves Cancellation with Refund

```typescript
async function approveCancellationWithRefund(
  cancellationRequestId: bigint,
  vendorId: bigint,
  refundMethod: string
) {
  const request = await prisma.cancellationRequest.findUnique({
    where: { id: cancellationRequestId },
    include: { order: true }
  })

  if (!request || request.order.vendorId !== vendorId) {
    throw new Error('Cancellation request not found')
  }

  // Update cancellation request
  await prisma.cancellationRequest.update({
    where: { id: cancellationRequestId },
    data: {
      status: 'APPROVED',
      approvedAt: new Date(),
      refundMethod
    }
  })

  // Update order
  await prisma.order.update({
    where: { id: request.orderId },
    data: {
      status: 'CANCELLED',
      paymentStatus: 'REFUNDED',
      cancellationReason: request.reason,
      cancelledAt: new Date()
    }
  })

  // Restock inventory
  await restockInventory(request.order.productId, request.order.quantity)

  // Notify buyer
  await createNotification({
    userId: request.order.userId,
    type: 'CANCELLATION_APPROVED',
    title: 'Cancellation Approved',
    message: `Your cancellation was approved. Refund via ${refundMethod}`,
    link: `/orders/${request.orderId}`
  })

  // Send auto-message
  await prisma.message.create({
    data: {
      threadId: request.order.threadId,
      senderId: vendorId,
      content: `✅ Cancellation approved. Refund will be processed via ${refundMethod}.`,
      isSystem: true
    }
  })
}
```

### 5. Vendor Cancels Order (Out of Stock)

```typescript
async function vendorCancelOrder(
  orderId: bigint,
  vendorId: bigint,
  reason: string
) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, vendorId }
  })

  if (!order) {
    throw new Error('Order not found')
  }

  const requiresRefund = order.paymentStatus === 'PAID'

  // Cancel order
  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'CANCELLED',
      paymentStatus: requiresRefund ? 'REFUNDED' : order.paymentStatus,
      cancellationReason: reason,
      cancelledAt: new Date(),
      cancelledBy: 'VENDOR'
    }
  })

  // Restock inventory
  await restockInventory(order.productId, order.quantity)

  // Notify buyer
  await createNotification({
    userId: order.userId,
    type: 'ORDER_CANCELLED_BY_VENDOR',
    title: 'Order Cancelled',
    message: `Vendor cancelled your order. ${requiresRefund ? 'Refund will be processed.' : ''}`,
    link: `/orders/${orderId}`,
    priority: 'HIGH'
  })

  // Send auto-message
  await prisma.message.create({
    data: {
      threadId: order.threadId,
      senderId: vendorId,
      content: `❌ Order cancelled by vendor. Reason: ${reason}. ${requiresRefund ? 'Refund will be processed.' : ''}`,
      isSystem: true
    }
  })
}
```

## Inventory Restocking

```typescript
async function restockInventory(productId: bigint, quantity: number) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { trackQuantity: true }
  })

  if (!product.trackQuantity) {
    return // No inventory tracking
  }

  // Return items to available stock
  await prisma.product.update({
    where: { id: productId },
    data: {
      inventory: {
        update: {
          quantity: { increment: quantity },
          reserved: { decrement: quantity }
        }
      }
    }
  })

  // Log inventory change
  await prisma.inventoryLog.create({
    data: {
      productId,
      type: 'RESTOCK',
      quantity,
      reason: 'Order cancelled',
      timestamp: new Date()
    }
  })
}
```

## Cancellation Policies

```typescript
interface CancellationPolicy {
  allowedBefore: {
    acceptance: boolean      // Can cancel before vendor accepts
    payment: boolean         // Can cancel before payment
    shipment: boolean        // Can cancel before shipment
    delivery: boolean        // Can cancel after delivery
  }
  refundPolicy: {
    fullRefund: boolean      // Full refund available
    partialRefund: boolean   // Partial refund (restocking fee)
    noRefund: boolean        // No refund after certain point
  }
  timeWindows: {
    freeCancel: number       // Hours for free cancellation
    refundWindow: number     // Days for refund eligibility
  }
}

const defaultPolicy: CancellationPolicy = {
  allowedBefore: {
    acceptance: true,
    payment: true,
    shipment: true,
    delivery: false
  },
  refundPolicy: {
    fullRefund: true,
    partialRefund: false,
    noRefund: false
  },
  timeWindows: {
    freeCancel: 24,
    refundWindow: 7
  }
}
```
