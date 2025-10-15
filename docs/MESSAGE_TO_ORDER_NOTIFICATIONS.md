# Message-to-Order Notification System

## Notification Trigger Points

### 1. Thread Creation
```typescript
async function notifyThreadCreated(thread: MessageThread) {
  await createNotification({
    userId: thread.vendorId,
    type: 'NEW_MESSAGE_THREAD',
    title: 'New Product Inquiry',
    message: `A buyer is interested in your product`,
    link: `/messages/${thread.id}`,
    priority: 'NORMAL'
  })
}
```

### 2. New Message Received
```typescript
async function notifyNewMessage(message: Message) {
  const thread = await prisma.messageThread.findUnique({
    where: { id: message.threadId },
    include: { participants: true }
  })

  // Notify all participants except sender
  const recipients = thread.participants
    .filter(p => p.userId !== message.senderId)
    .map(p => p.userId)

  for (const userId of recipients) {
    await createNotification({
      userId,
      type: 'NEW_MESSAGE',
      title: 'New Message',
      message: message.content.substring(0, 50) + '...',
      link: `/messages/${thread.id}`,
      priority: 'NORMAL'
    })
  }
}
```

### 3. Order Request Created
```typescript
async function notifyOrderRequestCreated(orderRequest: OrderRequest) {
  await createNotification({
    userId: orderRequest.vendorId,
    type: 'ORDER_REQUEST_RECEIVED',
    title: 'New Order Request',
    message: `A buyer wants to purchase your product`,
    link: `/vendor/orders/requests/${orderRequest.id}`,
    priority: 'HIGH',
    actionRequired: true
  })

  // Send auto-message in thread
  await prisma.message.create({
    data: {
      threadId: orderRequest.threadId,
      senderId: orderRequest.vendorId,
      content: '📦 Order request created. The vendor will review and respond soon.',
      isSystem: true
    }
  })
}
```

### 4. Order Request Accepted
```typescript
async function notifyOrderRequestAccepted(orderRequest: OrderRequest) {
  await createNotification({
    userId: orderRequest.userId,
    type: 'ORDER_REQUEST_ACCEPTED',
    title: 'Order Request Accepted',
    message: `Your order request has been accepted!`,
    link: `/orders/${orderRequest.orderId}`,
    priority: 'HIGH'
  })

  // Send auto-message
  await prisma.message.create({
    data: {
      threadId: orderRequest.threadId,
      senderId: orderRequest.vendorId,
      content: '✅ Order request accepted! Please proceed with payment using the agreed method.',
      isSystem: true
    }
  })
}
```

### 5. Order Request Refused
```typescript
async function notifyOrderRequestRefused(
  orderRequest: OrderRequest,
  reason: string
) {
  await createNotification({
    userId: orderRequest.userId,
    type: 'ORDER_REQUEST_REFUSED',
    title: 'Order Request Declined',
    message: `The vendor declined your order request`,
    link: `/messages/${orderRequest.threadId}`,
    priority: 'NORMAL'
  })

  // Send auto-message with reason
  await prisma.message.create({
    data: {
      threadId: orderRequest.threadId,
      senderId: orderRequest.vendorId,
      content: `❌ Order request declined. Reason: ${reason}`,
      isSystem: true
    }
  })
}
```

### 6. Payment Confirmed
```typescript
async function notifyPaymentConfirmed(order: Order) {
  await createNotification({
    userId: order.userId,
    type: 'PAYMENT_CONFIRMED',
    title: 'Payment Confirmed',
    message: `The vendor confirmed receiving your payment`,
    link: `/orders/${order.id}`,
    priority: 'NORMAL'
  })

  // Send auto-message
  await prisma.message.create({
    data: {
      threadId: order.threadId,
      senderId: order.vendorId,
      content: '💰 Payment confirmed! Your order is being prepared.',
      isSystem: true
    }
  })
}
```

### 7. Order Shipped
```typescript
async function notifyOrderShipped(order: Order, trackingNumber?: string) {
  const message = trackingNumber
    ? `Your order has been shipped! Tracking: ${trackingNumber}`
    : `Your order has been shipped!`

  await createNotification({
    userId: order.userId,
    type: 'ORDER_SHIPPED',
    title: 'Order Shipped',
    message,
    link: `/orders/${order.id}`,
    priority: 'NORMAL'
  })

  // Send auto-message
  await prisma.message.create({
    data: {
      threadId: order.threadId,
      senderId: order.vendorId,
      content: `🚚 ${message}`,
      isSystem: true
    }
  })
}
```

### 8. Order Delivered
```typescript
async function notifyOrderDelivered(order: Order) {
  await createNotification({
    userId: order.userId,
    type: 'ORDER_DELIVERED',
    title: 'Order Delivered',
    message: `Your order has been delivered. Please confirm receipt.`,
    link: `/orders/${order.id}`,
    priority: 'NORMAL',
    actionRequired: true
  })

  // Send auto-message
  await prisma.message.create({
    data: {
      threadId: order.threadId,
      senderId: order.vendorId,
      content: '✅ Order delivered! Please confirm receipt and leave a review.',
      isSystem: true
    }
  })
}
```

## Notification Schema

```typescript
interface Notification {
  id: bigint
  userId: bigint
  type: NotificationType
  title: string
  message: string
  link?: string
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  actionRequired: boolean
  isRead: boolean
  createdAt: Date
}

enum NotificationType {
  NEW_MESSAGE_THREAD = 'NEW_MESSAGE_THREAD',
  NEW_MESSAGE = 'NEW_MESSAGE',
  ORDER_REQUEST_RECEIVED = 'ORDER_REQUEST_RECEIVED',
  ORDER_REQUEST_ACCEPTED = 'ORDER_REQUEST_ACCEPTED',
  ORDER_REQUEST_REFUSED = 'ORDER_REQUEST_REFUSED',
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',
  ORDER_SHIPPED = 'ORDER_SHIPPED',
  ORDER_DELIVERED = 'ORDER_DELIVERED',
  ORDER_CANCELLED = 'ORDER_CANCELLED'
}
```
