import { prisma } from '@/lib/db/prisma';

export enum AuditAction {
  // Vendor Actions
  VENDOR_APPLICATION_SUBMITTED = 'VENDOR_APPLICATION_SUBMITTED',
  VENDOR_APPROVED = 'VENDOR_APPROVED',
  VENDOR_REJECTED = 'VENDOR_REJECTED',
  VENDOR_SUSPENDED = 'VENDOR_SUSPENDED',
  VENDOR_REINSTATED = 'VENDOR_REINSTATED',
  VENDOR_REAPPLIED = 'VENDOR_REAPPLIED',
  
  // Store Actions
  STORE_CREATED = 'STORE_CREATED',
  STORE_APPROVED = 'STORE_APPROVED',
  STORE_REJECTED = 'STORE_REJECTED',
  STORE_SUSPENDED = 'STORE_SUSPENDED',
  
  // Product Actions
  PRODUCT_CREATED = 'PRODUCT_CREATED',
  PRODUCT_HIDDEN = 'PRODUCT_HIDDEN',
  PRODUCT_RESTORED = 'PRODUCT_RESTORED',
  
  // Bulk Actions
  VENDOR_BULK_APPROVE = 'VENDOR_BULK_APPROVE',
  VENDOR_BULK_REJECT = 'VENDOR_BULK_REJECT'
}

interface AuditLogData {
  action: AuditAction | string;
  actorId: string | bigint;
  entity: string;
  entityId: string | bigint;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  diff?: Record<string, any>;
  vendorId?: string | bigint;
}

export async function createAuditLog(data: AuditLogData) {
  try {
    return await prisma.auditLog.create({
      data: {
        action: data.action,
        actorId: BigInt(data.actorId),
        entity: data.entity,
        entityId: BigInt(data.entityId),
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        metadata: data.metadata || {},
        diff: data.diff,
        vendorId: data.vendorId ? BigInt(data.vendorId) : null
      }
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging should not break the main flow
  }
}

export async function getAuditLogs(filters: {
  action?: string;
  actorId?: string | bigint;
  entityId?: string | bigint;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  return await prisma.auditLog.findMany({
    where: {
      action: filters.action,
      actorId: filters.actorId ? BigInt(filters.actorId) : undefined,
      entityId: filters.entityId ? BigInt(filters.entityId) : undefined,
      createdAt: {
        gte: filters.startDate,
        lte: filters.endDate
      }
    },
    include: {
      actor: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: filters.limit || 100
  });
}
