# Payment Status Management

## Payment Flow (Manual/Trust-Based)

### Payment Status States

```typescript
enum PaymentStatus {
  PENDING = 'PENDING',      // Awaiting payment
  PAID = 'PAID',           // Vendor confirmed payment received
  REFUNDED = 'REFUNDED'    // Payment returned to buyer
}

enum PaymentMethod {
  COD = 'cod',              // Cash on delivery
  BANK = 'bank',            // Bank transfer
  INPERSON = 'inperson'     // In-person cash payment
}
```

### When to Mark as PAID vs PENDING

```typescript
// 1. Order created → PENDING
async function createOrderFromRequest(orderRequest: OrderRequest) {
  const order = await prisma.order.create({
    data: {
      orderRequestId: orderRequest.id,
      userId: orderRequest.userId,
      vendorId: orderRequest.vendorId,
      status: 'CONFIRMED',
      paymentStatus: 'PENDING',  // Always starts as PENDING
      paymentMethod: orderRequest.paymentMethod,
      fulfillmentStatus: 'PREPARING'
    }
  })

  return order
}

// 2. Vendor confirms payment → PAID
async function confirmPaymentReceived(
  orderId: bigint,
  vendorId: bigint,
  notes?: string
) {
  // Verify vendor owns this order
  const order = await prisma.order.findFirst({
    where: { id: orderId, vendorId }
  })

  if (!order) {
    throw new Error('Order not found')
  }

  if (order.paymentStatus === 'PAID') {
    throw new Error('Payment already confirmed')
  }

  // Update payment status
  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: 'PAID',
      paymentConfirmedAt: new Date(),
      paymentNotes: notes
    }
  })

  // Notify buyer
  await notifyPaymentConfirmed(updated)

  // Send auto-message
  await prisma.message.create({
    data: {
      threadId: order.threadId,
      senderId: vendorId,
      content: '💰 Payment confirmed! Your order is being prepared for shipment.',
      isSystem: true
    }
  })

  return updated
}

// 3. Order cancelled → REFUNDED (if already paid)
async function cancelOrder(orderId: bigint, reason: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId }
  })

  if (order.paymentStatus === 'PAID') {
    // Mark as refunded
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        paymentStatus: 'REFUNDED',
        cancellationReason: reason,
        cancelledAt: new Date()
      }
    })

    // Notify both parties about refund
    await notifyRefundRequired(order)
  } else {
    // Just cancel
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        cancellationReason: reason,
        cancelledAt: new Date()
      }
    })
  }
}
```

### Payment Method Handling

```typescript
// Different flows based on payment method
async function getPaymentInstructions(order: Order) {
  switch (order.paymentMethod) {
    case 'cod':
      return {
        title: 'Cash on Delivery',
        instructions: [
          'Pay the delivery person when your order arrives',
          'Have exact change ready if possible',
          'Get a receipt from the delivery person'
        ],
        confirmationRequired: false // Auto-confirmed on delivery
      }

    case 'bank':
      return {
        title: 'Bank Transfer',
        instructions: [
          'Transfer the amount to the vendor\'s bank account',
          'Use the order number as reference',
          'Send payment proof to the vendor via message',
          'Wait for vendor to confirm payment'
        ],
        confirmationRequired: true // Vendor must confirm
      }

    case 'inperson':
      return {
        title: 'In-Person Payment',
        instructions: [
          'Arrange a meeting location with the vendor',
          'Bring exact amount in cash',
          'Inspect the product before paying',
          'Get a receipt from the vendor'
        ],
        confirmationRequired: true // Vendor must confirm
      }
  }
}
```

### Payment Proof Upload

```typescript
// Buyer uploads payment proof
async function uploadPaymentProof(
  orderId: bigint,
  userId: bigint,
  proofUrl: string
) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId }
  })

  if (!order) {
    throw new Error('Order not found')
  }

  // Store payment proof
  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentProofUrl: proofUrl,
      paymentProofUploadedAt: new Date()
    }
  })

  // Notify vendor
  await createNotification({
    userId: order.vendorId,
    type: 'PAYMENT_PROOF_UPLOADED',
    title: 'Payment Proof Received',
    message: 'Buyer uploaded payment proof. Please verify.',
    link: `/vendor/orders/${orderId}`,
    priority: 'HIGH',
    actionRequired: true
  })

  // Send message
  await prisma.message.create({
    data: {
      threadId: order.threadId,
      senderId: userId,
      content: '📄 Payment proof uploaded. Please verify and confirm.',
      attachments: [proofUrl]
    }
  })
}
```

### Trust Score System (Optional Enhancement)

```typescript
// Track payment reliability
interface PaymentTrustScore {
  userId: bigint
  totalOrders: number
  paidOnTime: number
  disputed: number
  score: number // 0-100
}

async function calculateTrustScore(userId: bigint) {
  const orders = await prisma.order.findMany({
    where: { userId },
    select: {
      paymentStatus: true,
      paymentConfirmedAt: true,
      createdAt: true,
      disputes: true
    }
  })

  const total = orders.length
  const paid = orders.filter(o => o.paymentStatus === 'PAID').length
  const disputed = orders.filter(o => o.disputes.length > 0).length

  // Calculate score
  const score = Math.max(0, Math.min(100, 
    (paid / total * 100) - (disputed * 10)
  ))

  return {
    totalOrders: total,
    paidOnTime: paid,
    disputed,
    score: Math.round(score)
  }
}
```
