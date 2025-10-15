import { prisma } from '@/lib/db/prisma'
import { Decimal } from '@prisma/client/runtime/library'

export async function createOrder(data: {
  userId: bigint
  storeId: bigint
  total: number
  addressId: bigint
  paymentMethod: string
}) {
  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

  return prisma.order.create({
    data: {
      userId: data.userId,
      storeId: data.storeId,
      number: orderNumber,
      total: new Decimal(data.total),
      status: 'CONFIRMED',
      fulfillStatus: 'PENDING'
    }
  })
}

export async function getOrder(orderId: bigint, userId: bigint) {
  return prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { store: true }
  })
}

export async function listOrders(userId: bigint) {
  return prisma.order.findMany({
    where: { userId },
    include: { store: true },
    orderBy: { createdAt: 'desc' }
  })
}
