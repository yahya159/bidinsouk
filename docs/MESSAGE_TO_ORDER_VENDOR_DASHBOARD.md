# Vendor Order Dashboard Design

## Dashboard Overview

### Key Metrics Display

```typescript
interface VendorOrderMetrics {
  pending: {
    orderRequests: number      // Awaiting vendor response
    paymentConfirmation: number // Awaiting payment
    toShip: number             // Ready to ship
  }
  active: {
    preparing: number          // Being prepared
    shipped: number            // In transit
  }
  completed: {
    delivered: number          // Last 30 days
    revenue: number            // Total revenue
  }
  issues: {
    cancellationRequests: number
    disputes: number
    refundsPending: number
  }
}

async function getVendorMetrics(vendorId: bigint): Promise<VendorOrderMetrics> {
  const [
    pendingRequests,
    awaitingPayment,
    toShip,
    preparing,
    shipped,
    delivered,
    cancellations,
    disputes
  ] = await Promise.all([
    // Pending order requests
    prisma.orderRequest.count({
      where: { vendorId, status: 'REQUESTED' }
    }),
    
    // Orders awaiting payment confirmation
    prisma.order.count({
      where: { 
        vendorId, 
        paymentStatus: 'PENDING',
        paymentProofUrl: { not: null }
      }
    }),
    
    // Orders ready to ship
    prisma.order.count({
      where: { 
        vendorId, 
        paymentStatus: 'PAID',
        fulfillmentStatus: 'PREPARING'
      }
    }),
    
    // Orders being prepared
    prisma.order.count({
      where: { 
        vendorId, 
        fulfillmentStatus: 'PREPARING'
      }
    }),
    
    // Orders shipped
    prisma.order.count({
      where: { 
        vendorId, 
        fulfillmentStatus: 'SHIPPED'
      }
    }),
    
    // Delivered last 30 days
    prisma.order.count({
      where: { 
        vendorId, 
        fulfillmentStatus: 'DELIVERED',
        deliveredAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    }),
    
    // Cancellation requests
    prisma.cancellationRequest.count({
      where: { 
        order: { vendorId },
        status: 'PENDING'
      }
    }),
    
    // Active disputes
    prisma.dispute.count({
      where: { 
        order: { vendorId },
        status: { in: ['OPEN', 'IN_REVIEW'] }
      }
    })
  ])

  // Calculate revenue
  const revenue = await prisma.order.aggregate({
    where: {
      vendorId,
      fulfillmentStatus: 'DELIVERED',
      deliveredAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }
    },
    _sum: { total: true }
  })

  return {
    pending: {
      orderRequests: pendingRequests,
      paymentConfirmation: awaitingPayment,
      toShip
    },
    active: {
      preparing,
      shipped
    },
    completed: {
      delivered,
      revenue: Number(revenue._sum.total || 0)
    },
    issues: {
      cancellationRequests: cancellations,
      disputes,
      refundsPending: 0 // Calculate separately
    }
  }
}
```

## Order List with Filters

```typescript
interface OrderFilters {
  status?: OrderStatus[]
  paymentStatus?: PaymentStatus[]
  fulfillmentStatus?: FulfillmentStatus[]
  dateFrom?: Date
  dateTo?: Date
  search?: string
  sortBy?: 'createdAt' | 'total' | 'status'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

async function getVendorOrders(
  vendorId: bigint,
  filters: OrderFilters
) {
  const where: any = { vendorId }

  // Status filters
  if (filters.status?.length) {
    where.status = { in: filters.status }
  }
  if (filters.paymentStatus?.length) {
    where.paymentStatus = { in: filters.paymentStatus }
  }
  if (filters.fulfillmentStatus?.length) {
    where.fulfillmentStatus = { in: filters.fulfillmentStatus }
  }

  // Date range
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {}
    if (filters.dateFrom) where.createdAt.gte = filters.dateFrom
    if (filters.dateTo) where.createdAt.lte = filters.dateTo
  }

  // Search
  if (filters.search) {
    where.OR = [
      { number: { contains: filters.search } },
      { user: { name: { contains: filters.search } } },
      { user: { email: { contains: filters.search } } }
    ]
  }

  // Pagination
  const page = filters.page || 1
  const limit = filters.limit || 20
  const skip = (page - 1) * limit

  // Get orders
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        product: {
          select: { id: true, title: true, images: true }
        },
        orderRequest: {
          select: { threadId: true }
        }
      },
      orderBy: {
        [filters.sortBy || 'createdAt']: filters.sortOrder || 'desc'
      },
      skip,
      take: limit
    }),
    prisma.order.count({ where })
  ])

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  }
}
```

## Bulk Actions

```typescript
interface BulkAction {
  orderIds: bigint[]
  action: 'confirmPayment' | 'markShipped' | 'markDelivered' | 'cancel'
  data?: any
}

async function performBulkAction(
  vendorId: bigint,
  action: BulkAction
) {
  // Verify all orders belong to vendor
  const orders = await prisma.order.findMany({
    where: {
      id: { in: action.orderIds },
      vendorId
    }
  })

  if (orders.length !== action.orderIds.length) {
    throw new Error('Some orders not found or unauthorized')
  }

  const results = []

  switch (action.action) {
    case 'confirmPayment':
      for (const order of orders) {
        if (order.paymentStatus === 'PENDING') {
          await confirmPaymentReceived(order.id, vendorId)
          results.push({ orderId: order.id, success: true })
        } else {
          results.push({ 
            orderId: order.id, 
            success: false, 
            reason: 'Already paid' 
          })
        }
      }
      break

    case 'markShipped':
      for (const order of orders) {
        if (order.fulfillmentStatus === 'PREPARING') {
          await updateFulfillmentStatus(
            order.id, 
            vendorId, 
            'SHIPPED',
            action.data?.trackingNumber
          )
          results.push({ orderId: order.id, success: true })
        } else {
          results.push({ 
            orderId: order.id, 
            success: false, 
            reason: 'Not ready to ship' 
          })
        }
      }
      break

    case 'markDelivered':
      for (const order of orders) {
        if (order.fulfillmentStatus === 'SHIPPED') {
          await updateFulfillmentStatus(order.id, vendorId, 'DELIVERED')
          results.push({ orderId: order.id, success: true })
        } else {
          results.push({ 
            orderId: order.id, 
            success: false, 
            reason: 'Not shipped yet' 
          })
        }
      }
      break

    case 'cancel':
      for (const order of orders) {
        await vendorCancelOrder(
          order.id, 
          vendorId, 
          action.data?.reason || 'Bulk cancellation'
        )
        results.push({ orderId: order.id, success: true })
      }
      break
  }

  return results
}
```

## Quick Actions Panel

```typescript
interface QuickAction {
  id: string
  label: string
  count: number
  link: string
  priority: 'high' | 'medium' | 'low'
}

async function getQuickActions(vendorId: bigint): Promise<QuickAction[]> {
  const metrics = await getVendorMetrics(vendorId)

  const actions: QuickAction[] = []

  // High priority actions
  if (metrics.pending.orderRequests > 0) {
    actions.push({
      id: 'pending-requests',
      label: 'Review Order Requests',
      count: metrics.pending.orderRequests,
      link: '/vendor/orders/requests',
      priority: 'high'
    })
  }

  if (metrics.issues.cancellationRequests > 0) {
    actions.push({
      id: 'cancellation-requests',
      label: 'Handle Cancellations',
      count: metrics.issues.cancellationRequests,
      link: '/vendor/orders?filter=cancellation-requested',
      priority: 'high'
    })
  }

  // Medium priority
  if (metrics.pending.paymentConfirmation > 0) {
    actions.push({
      id: 'confirm-payments',
      label: 'Confirm Payments',
      count: metrics.pending.paymentConfirmation,
      link: '/vendor/orders?filter=payment-pending',
      priority: 'medium'
    })
  }

  if (metrics.pending.toShip > 0) {
    actions.push({
      id: 'ready-to-ship',
      label: 'Ready to Ship',
      count: metrics.pending.toShip,
      link: '/vendor/orders?filter=ready-to-ship',
      priority: 'medium'
    })
  }

  return actions
}
```

## Export Functionality

```typescript
async function exportOrders(
  vendorId: bigint,
  filters: OrderFilters,
  format: 'csv' | 'excel' | 'pdf'
) {
  const { orders } = await getVendorOrders(vendorId, {
    ...filters,
    limit: 10000 // Max export
  })

  const data = orders.map(order => ({
    'Order Number': order.number,
    'Date': order.createdAt.toISOString(),
    'Customer': order.user.name,
    'Product': order.product.title,
    'Amount': order.total,
    'Payment Status': order.paymentStatus,
    'Payment Method': order.paymentMethod,
    'Fulfillment Status': order.fulfillmentStatus,
    'Tracking Number': order.trackingNumber || 'N/A'
  }))

  switch (format) {
    case 'csv':
      return generateCSV(data)
    case 'excel':
      return generateExcel(data)
    case 'pdf':
      return generatePDF(data)
  }
}
```
