# Message-to-Order Visual Flows

## Complete State Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     MESSAGE-TO-ORDER STATE MACHINE                       │
└─────────────────────────────────────────────────────────────────────────┘

                              [BUYER VIEWS PRODUCT]
                                       │
                                       ▼
                           ┌───────────────────────┐
                           │  Click "Contact       │
                           │  Vendor" Button       │
                           └───────────┬───────────┘
                                       │
                                       ▼
                           ┌───────────────────────┐
                           │  Check Existing       │
                           │  Thread?              │
                           └─────┬─────────┬───────┘
                                 │         │
                          EXISTS │         │ NOT EXISTS
                                 │         │
                                 ▼         ▼
                           ┌─────────┐  ┌──────────────┐
                           │ Redirect│  │ Create Thread│
                           │ to      │  │ + Welcome    │
                           │ Thread  │  │ Message      │
                           └────┬────┘  └──────┬───────┘
                                │              │
                                └──────┬───────┘
                                       │
                                       ▼
                           ┌───────────────────────┐
                           │  MESSAGE NEGOTIATION  │
                           │  (Buyer ↔ Vendor)     │
                           └───────────┬───────────┘
                                       │
                                       ▼
                           ┌───────────────────────┐
                           │  Buyer Clicks         │
                           │  "Create Order        │
                           │  Request"             │
                           └───────────┬───────────┘
                                       │
                                       ▼
                           ┌───────────────────────┐
                           │  ORDER REQUEST        │
                           │  Status: REQUESTED    │
                           │  Stock: RESERVED      │
                           └───────────┬───────────┘
                                       │
                                       ▼
                           ┌───────────────────────┐
                           │  Vendor Notified      │
                           │  (Email + In-app)     │
                           └─────┬─────────┬───────┘
                                 │         │
                          ACCEPT │         │ REFUSE
                                 │         │
                                 ▼         ▼
                    ┌────────────────┐  ┌──────────────┐
                    │ ORDER CREATED  │  │ Stock        │
                    │ Status:        │  │ Released     │
                    │ CONFIRMED      │  │ Buyer        │
                    │ Payment:       │  │ Notified     │
                    │ PENDING        │  └──────────────┘
                    │ Fulfillment:   │
                    │ PREPARING      │
                    └────────┬───────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ Buyer Pays     │
                    │ (COD/Bank/     │
                    │  In-person)    │
                    └────────┬───────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ Vendor Confirms│
                    │ Payment        │
                    │ Status: PAID   │
                    └────────┬───────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ PREPARING      │
                    │ (Vendor packs) │
                    └────────┬───────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ SHIPPED        │
                    │ (+ Tracking)   │
                    └────────┬───────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ DELIVERED      │
                    │ (Complete)     │
                    └────────┬───────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ Thread Stays   │
                    │ Open for       │
                    │ Review/Dispute │
                    └────────────────┘
```

## Order Request State Transitions

```
┌──────────────────────────────────────────────────────────────┐
│                  ORDER REQUEST STATES                         │
└──────────────────────────────────────────────────────────────┘

    REQUESTED ──────┬──────> ACCEPTED ──────> [Order Created]
       │            │
       │            └──────> REFUSED ────────> [Stock Released]
       │
       └──────────────────> CANCELLED ───────> [Stock Released]
                            (by buyer)
```

## Order State Transitions

```
┌──────────────────────────────────────────────────────────────┐
│                     ORDER STATES                              │
└──────────────────────────────────────────────────────────────┘

    CONFIRMED ──────────────────────────────────> CANCELLED
       │                                              │
       │                                              ▼
       │                                         [Refund if PAID]
       │                                         [Restock Items]
       │
       └──> (Normal Flow) ──────────────────────> DELIVERED
```

## Payment Status Flow

```
┌──────────────────────────────────────────────────────────────┐
│                  PAYMENT STATUS FLOW                          │
└──────────────────────────────────────────────────────────────┘

    PENDING ────────────────────────────────────> PAID
       │                                            │
       │                                            │
       │                                            ▼
       │                                      [Fulfillment
       │                                       Continues]
       │
       └──> (If Cancelled) ──────────────────> REFUNDED
```

## Fulfillment Status Flow

```
┌──────────────────────────────────────────────────────────────┐
│                FULFILLMENT STATUS FLOW                        │
└──────────────────────────────────────────────────────────────┘

    PREPARING ──────> SHIPPED ──────> DELIVERED
       │                 │                │
       │                 │                ▼
       │                 │           [Review Window]
       │                 │           [Dispute Window]
       │                 │
       │                 └──────────> RETURNED
       │                             (if issues)
       │
       └──────────────────────────> CANCELLED
                                    (before ship)
```

## Notification Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    NOTIFICATION TRIGGERS                      │
└──────────────────────────────────────────────────────────────┘

Event                          Recipient       Type
─────────────────────────────────────────────────────────────
Thread Created                 Vendor          Email + In-app
New Message                    Other Party     Push + In-app
Order Request Created          Vendor          Email + In-app + SMS
Order Request Accepted         Buyer           Email + In-app
Order Request Refused          Buyer           Email + In-app
Payment Confirmed              Buyer           Email + In-app
Order Shipped                  Buyer           Email + In-app + SMS
Order Delivered                Buyer           Email + In-app
Order Cancelled                Both            Email + In-app
```

## Decision Tree: Can Create Order Request?

```
┌──────────────────────────────────────────────────────────────┐
│              ORDER REQUEST VALIDATION TREE                    │
└──────────────────────────────────────────────────────────────┘

Is user authenticated?
├─ NO ──> Error: "Please sign in"
└─ YES
    │
    Is product active?
    ├─ NO ──> Error: "Product not available"
    └─ YES
        │
        Is product in stock?
        ├─ NO ──> Error: "Out of stock"
        └─ YES
            │
            Is vendor active?
            ├─ NO ──> Error: "Vendor unavailable"
            └─ YES
                │
                Is user blocked by vendor?
                ├─ YES ──> Error: "Cannot contact vendor"
                └─ NO
                    │
                    Existing active request?
                    ├─ YES ──> Error: "Request pending"
                    └─ NO
                        │
                        ✅ CREATE ORDER REQUEST
```

## Cancellation Decision Tree

```
┌──────────────────────────────────────────────────────────────┐
│                 CANCELLATION FLOW TREE                        │
└──────────────────────────────────────────────────────────────┘

Who is cancelling?
├─ BUYER
│   │
│   Payment status?
│   ├─ PENDING ──> Cancel immediately, no refund needed
│   └─ PAID
│       │
│       Fulfillment status?
│       ├─ PREPARING ──> Request cancellation, needs vendor approval
│       ├─ SHIPPED ──> Cannot cancel, can return after delivery
│       └─ DELIVERED ──> Cannot cancel, can open dispute
│
└─ VENDOR
    │
    Payment status?
    ├─ PENDING ──> Cancel immediately, notify buyer
    └─ PAID ──> Cancel + auto-refund, notify buyer
```

## Stock Management Flow

```
┌──────────────────────────────────────────────────────────────┐
│                  INVENTORY MANAGEMENT                         │
└──────────────────────────────────────────────────────────────┘

Order Request Created
    │
    ▼
Reserve Stock
    quantity -= requested
    reserved += requested
    │
    ├─ Request ACCEPTED ──> Keep reserved
    │                       (will deduct on delivery)
    │
    ├─ Request REFUSED ──> Release stock
    │                      quantity += requested
    │                      reserved -= requested
    │
    └─ Request CANCELLED ──> Release stock
                            quantity += requested
                            reserved -= requested

Order Delivered
    │
    ▼
Finalize Stock
    reserved -= delivered
    (quantity already decremented)

Order Cancelled
    │
    ▼
Restock Items
    quantity += cancelled
    reserved -= cancelled
```

## Trust Score Calculation

```
┌──────────────────────────────────────────────────────────────┐
│                    TRUST SCORE SYSTEM                         │
└──────────────────────────────────────────────────────────────┘

Base Score: 50

Positive Factors:
+ Completed orders: +2 per order
+ On-time payments: +3 per payment
+ Positive reviews: +5 per review
+ Quick responses: +1 per fast reply

Negative Factors:
- Cancelled orders: -5 per cancellation
- Payment disputes: -10 per dispute
- Negative reviews: -8 per review
- Slow responses: -2 per slow reply

Final Score: Max(0, Min(100, calculated_score))

Score Ranges:
0-30:   ⚠️  Low Trust (require prepayment)
31-60:  ⚡ Medium Trust (normal flow)
61-85:  ✅ Good Trust (priority support)
86-100: 🌟 Excellent Trust (VIP benefits)
```

---

**Related Documentation:**
- [Complete Architecture](./MESSAGE_TO_ORDER_COMPLETE_ARCHITECTURE.md)
- [Implementation Guide](../MESSAGE_TO_ORDER_IMPLEMENTATION_GUIDE.md)
