# Message-to-Order State Machine

## Complete Order Lifecycle States

```
┌─────────────────────────────────────────────────────────────────┐
│                    MESSAGE-TO-ORDER LIFECYCLE                    │
└─────────────────────────────────────────────────────────────────┘

1. THREAD_CREATION
   ├─> Check existing thread (buyer + vendor + product)
   ├─> Create if not exists
   └─> Send auto-welcome message

2. NEGOTIATION (Messages exchanged)
   ├─> Buyer asks questions
   ├─> Vendor responds
   └─> Discuss price, delivery, payment

3. ORDER_REQUEST_CREATED
   ├─> Status: REQUESTED
   ├─> Linked to thread
   ├─> Vendor notified
   └─> Auto-message sent

4. VENDOR_DECISION
   ├─> ACCEPT → Go to step 5
   └─> REFUSE → Go to step 9

5. ORDER_CONFIRMED
   ├─> Status: CONFIRMED
   ├─> Payment: PENDING
   ├─> Fulfillment: PREPARING
   └─> Auto-message sent

6. PAYMENT_RECEIVED (Manual by vendor)
   ├─> Payment: PAID
   ├─> Fulfillment: PREPARING → SHIPPED
   └─> Auto-message sent

7. ORDER_FULFILLMENT
   ├─> PREPARING → Vendor packing
   ├─> SHIPPED → In transit (tracking number added)
   ├─> DELIVERED → Completed
   └─> Auto-message at each step

8. ORDER_COMPLETED
   ├─> Thread stays open
   ├─> Buyer can leave review
   └─> Dispute window active

9. ORDER_REFUSED/CANCELLED
   ├─> Inventory restocked
   ├─> Both parties notified
   └─> Thread stays open
```

## State Transitions

### OrderRequest States
```typescript
enum OrderRequestStatus {
  REQUESTED = 'REQUESTED',    // Initial state
  ACCEPTED = 'ACCEPTED',      // Vendor accepted
  REFUSED = 'REFUSED',        // Vendor refused
  CANCELLED = 'CANCELLED'     // Buyer cancelled
}
```

### Order States
```typescript
enum OrderStatus {
  CONFIRMED = 'CONFIRMED',    // Created from accepted request
  CANCELLED = 'CANCELLED'     // Order cancelled
}

enum PaymentStatus {
  PENDING = 'PENDING',        // Awaiting payment
  PAID = 'PAID',             // Vendor confirmed payment
  REFUNDED = 'REFUNDED'      // Payment returned
}

enum FulfillmentStatus {
  PREPARING = 'PREPARING',    // Vendor preparing order
  SHIPPED = 'SHIPPED',        // Order in transit
  DELIVERED = 'DELIVERED',    // Order completed
  RETURNED = 'RETURNED'       // Order returned
}
```
