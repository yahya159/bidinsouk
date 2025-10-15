import { prisma } from '@/lib/db/prisma'

export async function createAuditLog(data: {
  actorId: bigint
  vendorId?: bigint
  action: string
  entity: string
  entityId: bigint
  diff: any
}) {
  return prisma.auditLog.create({
    data: {
      actorId: data.actorId,
      vendorId: data.vendorId,
      action: data.action,
      entity: data.entity,
      entityId: data.entityId,
      diff: data.diff
    }
  })
}

export async function getAuditLogs(filters?: {
  vendorId?: bigint
  entity?: string
  entityId?: bigint
  limit?: number
  offset?: number
}) {
  const where: any = {}
  if (filters?.vendorId) where.vendorId = filters.vendorId
  if (filters?.entity) where.entity = filters.entity
  if (filters?.entityId) where.entityId = filters.entityId

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        actor: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 100,
      skip: filters?.offset || 0
    }),
    prisma.auditLog.count({ where })
  ])

  return { logs, total }
}

// Helper to log product changes
export async function logProductChange(
  actorId: bigint,
  vendorId: bigint,
  productId: bigint,
  before: any,
  after: any
) {
  const diff = {
    before,
    after,
    changes: Object.keys(after).filter(key => before[key] !== after[key])
  }

  return createAuditLog({
    actorId,
    vendorId,
    action: 'UPDATE',
    entity: 'Product',
    entityId: productId,
    diff
  })
}

// Helper to log auction changes
export async function logAuctionChange(
  actorId: bigint,
  vendorId: bigint,
  auctionId: bigint,
  before: any,
  after: any
) {
  const diff = {
    before,
    after,
    changes: Object.keys(after).filter(key => before[key] !== after[key])
  }

  return createAuditLog({
    actorId,
    vendorId,
    action: 'UPDATE',
    entity: 'Auction',
    entityId: auctionId,
    diff
  })
}

// Helper to log order changes
export async function logOrderChange(
  actorId: bigint,
  vendorId: bigint,
  orderId: bigint,
  before: any,
  after: any
) {
  const diff = {
    before,
    after,
    changes: Object.keys(after).filter(key => before[key] !== after[key])
  }

  return createAuditLog({
    actorId,
    vendorId,
    action: 'UPDATE',
    entity: 'Order',
    entityId: orderId,
    diff
  })
}
