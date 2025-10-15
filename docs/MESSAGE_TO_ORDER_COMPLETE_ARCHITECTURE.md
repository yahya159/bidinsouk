# Complete Message-to-Order Architecture

## System Overview

Bidinsouk uses a **message-based commerce** model where buyers and vendors negotiate through messages before creating orders. No payment gateway integration - all payments are handled manually (cash, bank transfer, in-person).

## Complete User Flow

```
1. DISCOVERY
   └─> Buyer browses products

2. INQUIRY
   ├─> Buyer clicks "Contact Vendor"
   ├─> System checks for existing thread
   ├─> Creates thread if needed
   └─> Opens message interface

3. NEGOTIATION
   ├─> Buyer asks questions
   ├─> Vendor responds
   ├─> Discuss price, delivery, payment
   └─> Build trust

4. ORDER REQUEST
   ├─> Buyer clicks "Create Order Request"
   ├─> Selects payment method (COD/Bank/In-person)
   ├─> Provides delivery address
   ├─> System creates OrderRequest (REQUESTED)
   └─> Vendor notified

5. VENDOR DECISION
   ├─> ACCEPT → Creates Order (CONFIRMED)
   └─> REFUSE → Releases stock, notifies buyer

6. PAYMENT
   ├─> Buyer pays via agreed method
   ├─> Buyer uploads proof (if bank transfer)
   ├─> Vendor confirms payment
   └─> Order status: PAID

7. FULFILLMENT
   ├─> PREPARING → Vendor packs order
   ├─> SHIPPED → Vendor ships with tracking
   ├─> DELIVERED → Order complete
   └─> Auto-messages at each step

8. COMPLETION
   ├─> Thread stays open
   ├─> Buyer can leave review
   └─> Dispute window active (7 days)
```

## Database Schema

### Core Models

```prisma
model MessageThread {
  id            BigInt   @id @default(autoincrement())
  type          String   // PRODUCT_INQUIRY, ORDER_DISCUSSION
  subject       String
  vendorId      BigInt
  productId     BigInt?
  createdAt     DateTime @default(now())
  
  vendor        Vendor   @relation(fields: [vendorId])
  product       Product? @relation(fields: [productId])
  participants  MessageThreadParticipant[]
  messages      Message[]
  orderRequests OrderRequest[]
  
  @@index([productId, vendorId])
  @@unique([productId, vendorId, buyerId]) // Prevent duplicates
}

model MessageThreadParticipant {
  threadId  BigInt
  userId    BigInt
  role      String   // USER, VENDOR
  joinedAt  DateTime @default(now())
  
  thread    MessageThread @relation(fields: [threadId])
  user      User          @relation(fields: [userId])
  
  @@id([threadId, userId])
}

model Message {
  id          BigInt   @id @default(autoincrement())
  threadId    BigInt
  senderId    BigInt
  content     String   @db.Text
  attachments Json?
  isSystem    Boolean  @default(false)
  isRead      Boolean  @default(false)
  createdAt   DateTime @default(now())
  
  thread      MessageThread @relation(fields: [threadId])
  sender      User          @relation(fields: [senderId])
  
  @@index([threadId, createdAt])
  @@index([threadId, isRead])
}

model OrderRequest {
  id              BigInt   @id @default(autoincrement())
  threadId        BigInt
  userId          BigInt
  vendorId        BigInt
  productId       BigInt
  quantity        Int
  paymentMethod   String   // cod, bank, inperson
  deliveryAddress Json
  notes           String?  @db.Text
  status          String   // REQUESTED, ACCEPTED, REFUSED, CANCELLED
  refusalReason   String?  @db.Text
  createdAt       DateTime @default(now())
  acceptedAt      DateTime?
  refusedAt       DateTime?
  
  thread          MessageThread @relation(fields: [threadId])
  user            User          @relation(fields: [userId])
  vendor          Vendor        @relation(fields: [vendorId])
  product         Product       @relation(fields: [productId])
  order           Order?
  
  @@index([threadId, status])
  @@index([vendorId, status])
}

model Order {
  id                  BigInt   @id @default(autoincrement())
  number              String   @unique
  orderRequestId      BigInt   @unique
  userId              BigInt
  vendorId            BigInt
  productId           BigInt
  quantity            Int
  total               Decimal
  status              String   // CONFIRMED, CANCELLED
  paymentStatus       String   // PENDING, PAID, REFUNDED
  paymentMethod       String
  paymentProofUrl     String?
  paymentConfirmedAt  DateTime?
  paymentNotes        String?  @db.Text
  fulfillmentStatus   String   // PREPARING, SHIPPED, DELIVERED
  trackingNumber      String?
  deliveryAddress     Json
  shippedAt           DateTime?
  deliveredAt         DateTime?
  cancellationReason  String?  @db.Text
  cancelledAt         DateTime?
  cancelledBy         String?  // BUYER, VENDOR
  createdAt           DateTime @default(now())
  
  orderRequest        OrderRequest @relation(fields: [orderRequestId])
  user                User         @relation(fields: [userId])
  vendor              Vendor       @relation(fields: [vendorId])
  product             Product      @relation(fields: [productId])
  
  @@index([vendorId, status])
  @@index([userId, status])
  @@index([fulfillmentStatus])
}
```

## Performance Optimization

### Critical Indexes

```sql
-- Thread lookup (most frequent query)
CREATE INDEX idx_thread_product_vendor ON MessageThread(productId, vendorId);

-- Message queries
CREATE INDEX idx_messages_thread_time ON Message(threadId, createdAt DESC);
CREATE INDEX idx_messages_unread ON Message(threadId, isRead, createdAt);

-- Order request queries
CREATE INDEX idx_order_request_vendor_status ON OrderRequest(vendorId, status);
CREATE INDEX idx_order_request_thread ON OrderRequest(threadId, status);

-- Order queries
CREATE INDEX idx_order_vendor_status ON Order(vendorId, status, createdAt DESC);
CREATE INDEX idx_order_fulfillment ON Order(fulfillmentStatus, createdAt DESC);
```

### Query Optimization

```typescript
// GOOD: Single query with includes
const thread = await prisma.messageThread.findFirst({
  where: {
    productId,
    participants: {
      every: { userId: { in: [buyerId, vendorId] } }
    }
  },
  include: {
    participants: true,
    messages: { take: 20, orderBy: { createdAt: 'desc' } }
  }
})

// BAD: Multiple queries
const thread = await prisma.messageThread.findFirst({ where: { productId } })
const participants = await prisma.messageThreadParticipant.findMany({ where: { threadId: thread.id } })
const messages = await prisma.message.findMany({ where: { threadId: thread.id } })
```

## UI/UX Considerations

### Product Page
- Prominent "Contact Vendor" button
- Show vendor response time
- Display trust score/ratings
- Preview recent reviews

### Message Interface
- Real-time message updates
- "Create Order Request" button (only for buyers)
- Order status timeline
- Payment instructions panel
- File attachment support

### Order Request Form
- Payment method selection with descriptions
- Address autocomplete
- Quantity selector with stock check
- Estimated delivery time
- Terms and conditions

### Vendor Dashboard
- Pending requests counter (red badge)
- Quick action buttons
- Bulk operations
- Export functionality
- Performance metrics

## Security Considerations

### Thread Access Control
```typescript
async function canAccessThread(userId: bigint, threadId: bigint) {
  const participant = await prisma.messageThreadParticipant.findUnique({
    where: {
      threadId_userId: { threadId, userId }
    }
  })
  return !!participant
}
```

### Order Request Validation
```typescript
// Prevent duplicate requests
// Check product availability
// Verify stock levels
// Validate payment method
// Sanitize delivery address
```

### Payment Confirmation
```typescript
// Only vendor can confirm
// Require payment proof for bank transfers
// Log all payment actions
// Send confirmation emails
```

## Notification Strategy

### Real-time (WebSocket/Pusher)
- New messages
- Order status changes
- Payment confirmations

### Email Notifications
- Order request created
- Order accepted/refused
- Payment confirmed
- Order shipped
- Order delivered

### In-app Notifications
- All events
- Persistent until read
- Action buttons
- Deep links

## Testing Strategy

### Unit Tests
- Thread creation logic
- Order request validation
- Payment confirmation
- Stock management

### Integration Tests
- Complete order flow
- Cancellation scenarios
- Refund processing
- Notification delivery

### E2E Tests
- Buyer creates order request
- Vendor accepts/refuses
- Payment confirmation
- Order fulfillment
- Review submission

## Monitoring & Analytics

### Key Metrics
- Thread creation rate
- Order request conversion
- Average response time
- Payment confirmation time
- Delivery success rate
- Cancellation rate

### Alerts
- High cancellation rate
- Slow vendor response
- Payment disputes
- Stock issues
- System errors

---

**Related Documentation:**
- [State Machine](./MESSAGE_TO_ORDER_STATE_MACHINE.md)
- [Database Design](./MESSAGE_TO_ORDER_DATABASE_DESIGN.md)
- [Edge Cases](./MESSAGE_TO_ORDER_EDGE_CASES.md)
- [Notifications](./MESSAGE_TO_ORDER_NOTIFICATIONS.md)
- [Payment Flow](./MESSAGE_TO_ORDER_PAYMENT_FLOW.md)
- [Cancellation](./MESSAGE_TO_ORDER_CANCELLATION.md)
- [Vendor Dashboard](./MESSAGE_TO_ORDER_VENDOR_DASHBOARD.md)
