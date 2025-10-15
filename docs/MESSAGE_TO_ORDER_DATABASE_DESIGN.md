# Message-to-Order Database Design

## Optimized Query Strategy

### 1. Thread Duplicate Detection

```typescript
// EFFICIENT: Single query with composite index
async function findOrCreateThread(
  buyerId: bigint,
  vendorId: bigint,
  productId: bigint
): Promise<MessageThread> {
  
  // Check existing thread
  const existingThread = await prisma.messageThread.findFirst({
    where: {
      productId,
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
    const thread = await tx.messageThread.create({
      data: {
        type: 'PRODUCT_INQUIRY',
        subject: `Inquiry about product`,
        vendorId,
        productId,
        participants: {
          create: [
            { userId: buyerId, role: 'USER' },
            { userId: vendorId, role: 'VENDOR' }
          ]
        },
        messages: {
          create: {
            senderId: vendorId, // System message
            content: 'Welcome! How can I help you with this product?',
            isRead: false
          }
        }
      },
      include: {
        participants: true,
        messages: true
      }
    })

    return thread
  })
}
```

### 2. Required Database Indexes

```sql
-- Critical for thread lookup performance
CREATE INDEX idx_thread_product_lookup 
ON MessageThread(productId, vendorId);

-- For participant queries
CREATE INDEX idx_thread_participants 
ON MessageThreadParticipant(threadId, userId);

-- For message queries
CREATE INDEX idx_messages_thread_created 
ON Message(threadId, createdAt DESC);

-- For order request queries
CREATE INDEX idx_order_request_thread 
ON OrderRequest(threadId, status);

-- For vendor dashboard
CREATE INDEX idx_order_vendor_status 
ON Order(vendorId, status, createdAt DESC);

-- For unread message counts
CREATE INDEX idx_messages_unread 
ON Message(threadId, isRead, createdAt);
```

### 3. Race Condition Prevention

```typescript
// Use database-level unique constraint
model MessageThread {
  id          BigInt   @id @default(autoincrement())
  productId   BigInt
  vendorId    BigInt
  
  @@unique([productId, vendorId, buyerId])
  @@index([productId, vendorId])
}

// Alternative: Use advisory locks
async function createThreadSafe(
  buyerId: bigint,
  vendorId: bigint,
  productId: bigint
) {
  const lockKey = `thread:${productId}:${buyerId}:${vendorId}`
  
  return await withLock(lockKey, async () => {
    return await findOrCreateThread(buyerId, vendorId, productId)
  })
}
```
