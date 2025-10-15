# Message-to-Order Edge Cases & Solutions

## Critical Edge Cases

### 1. Product Deleted During Conversation

```typescript
async function handleProductDeleted(threadId: bigint) {
  // Check if product exists
  const thread = await prisma.messageThread.findUnique({
    where: { id: threadId },
    include: { product: true }
  })

  if (!thread.product || thread.product.status === 'ARCHIVED') {
    // Send auto-message
    await prisma.message.create({
      data: {
        threadId,
        senderId: thread.vendorId,
        content: '⚠️ This product is no longer available.',
        isSystem: true
      }
    })

    // Block order request creation
    return {
      canCreateOrder: false,
      reason: 'PRODUCT_UNAVAILABLE'
    }
  }
}

// In order request creation
export async function createOrderRequest(data: CreateOrderRequestInput) {
  const product = await prisma.product.findUnique({
    where: { id: data.productId }
  })

  if (!product || product.status !== 'ACTIVE') {
    throw new Error('Product is no longer available')
  }

  // Continue with order request...
}
```

### 2. Product Out of Stock

```typescript
async function checkStockBeforeOrder(productId: bigint, quantity: number) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { 
      inventory: true,
      trackQuantity: true 
    }
  })

  if (product.trackQuantity) {
    const available = product.inventory?.quantity || 0
    
    if (available < quantity) {
      return {
        available: false,
        currentStock: available,
        message: `Only ${available} items available`
      }
    }
  }

  return { available: true }
}

// Reserve stock when order request is created
async function reserveStock(productId: bigint, quantity: number) {
  await prisma.product.update({
    where: { id: productId },
    data: {
      inventory: {
        update: {
          quantity: { decrement: quantity },
          reserved: { increment: quantity }
        }
      }
    }
  })
}

// Release stock if order refused/cancelled
async function releaseStock(productId: bigint, quantity: number) {
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
}
```

### 3. User Blocked Vendor

```typescript
// Check block status before thread creation
async function canCreateThread(buyerId: bigint, vendorId: bigint) {
  const blockExists = await prisma.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: buyerId, blockedId: vendorId },
        { blockerId: vendorId, blockedId: buyerId }
      ]
    }
  })

  if (blockExists) {
    return {
      allowed: false,
      reason: 'USER_BLOCKED'
    }
  }

  return { allowed: true }
}

// Block message sending
async function sendMessage(data: SendMessageInput) {
  const canSend = await canCreateThread(data.senderId, data.recipientId)
  
  if (!canSend.allowed) {
    throw new Error('Cannot send message to blocked user')
  }

  // Continue with message creation...
}
```

### 4. Vendor Account Suspended

```typescript
async function checkVendorStatus(vendorId: bigint) {
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    select: { 
      status: true,
      suspendedAt: true,
      suspensionReason: true 
    }
  })

  if (vendor.status === 'SUSPENDED') {
    return {
      active: false,
      message: 'This vendor is currently unavailable',
      reason: vendor.suspensionReason
    }
  }

  return { active: true }
}

// Block order creation for suspended vendors
export async function createOrderRequest(data: CreateOrderRequestInput) {
  const thread = await prisma.messageThread.findUnique({
    where: { id: data.threadId },
    include: { vendor: true }
  })

  const vendorStatus = await checkVendorStatus(thread.vendorId)
  
  if (!vendorStatus.active) {
    throw new Error('Vendor is currently unavailable')
  }

  // Continue...
}
```

### 5. Duplicate Order Requests

```typescript
// Prevent multiple active order requests per thread
async function createOrderRequest(data: CreateOrderRequestInput) {
  // Check for existing active request
  const existingRequest = await prisma.orderRequest.findFirst({
    where: {
      threadId: data.threadId,
      status: { in: ['REQUESTED', 'ACCEPTED'] }
    }
  })

  if (existingRequest) {
    throw new Error('An order request is already pending for this conversation')
  }

  // Create new request...
}
```
