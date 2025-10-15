import { prisma } from '@/lib/db/prisma';
import { getClientIp } from '@/lib/utils/ip-extractor';

/**
 * Activity log entry interface
 */
export interface ActivityLogEntry {
  id: bigint;
  actorId: bigint;
  action: string;
  entity: string;
  entityId: bigint;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: any;
  diff: any;
  createdAt: Date;
  actor: {
    id: bigint;
    name: string;
    email: string;
    role: string;
  };
}

/**
 * Options for logging an activity
 */
export interface LogOptions {
  action: string;
  entity: string;
  entityId: bigint;
  metadata?: Record<string, any>;
  diff?: Record<string, any>;
  vendorId?: bigint;
}

/**
 * Filters for querying activity logs
 */
export interface ActivityFilters {
  actorId?: bigint;
  action?: string;
  entity?: string;
  ipAddress?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
}

/**
 * Activity Logger Service
 * Handles logging of all admin and user actions with IP tracking
 */
export class ActivityLogger {
  /**
   * Log an activity with request metadata
   */
  async log(
    userId: bigint,
    options: LogOptions,
    request: Request
  ): Promise<void> {
    try {
      const ipAddress = getClientIp(request);
      const userAgent = request.headers.get('user-agent');

      await prisma.auditLog.create({
        data: {
          actorId: userId,
          action: options.action,
          entity: options.entity,
          entityId: options.entityId,
          ipAddress,
          userAgent,
          metadata: options.metadata || undefined,
          diff: options.diff || undefined,
          vendorId: options.vendorId || undefined,
        },
      });
    } catch (error) {
      // Log error but don't throw to avoid breaking the main operation
      console.error('Failed to log activity:', error);
    }
  }

  /**
   * Get activity logs for a specific user
   */
  async getUserActivity(
    userId: bigint,
    filters?: ActivityFilters
  ): Promise<{ logs: ActivityLogEntry[]; total: number }> {
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 50;
    const skip = (page - 1) * pageSize;

    const where: any = {
      actorId: userId,
    };

    if (filters?.action) {
      where.action = filters.action;
    }

    if (filters?.entity) {
      where.entity = filters.entity;
    }

    if (filters?.ipAddress) {
      where.ipAddress = filters.ipAddress;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          actor: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs: logs as any, total };
  }

  /**
   * Get system-wide activity logs (admin view)
   */
  async getSystemActivity(
    filters?: ActivityFilters
  ): Promise<{ logs: ActivityLogEntry[]; total: number }> {
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 50;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (filters?.actorId) {
      where.actorId = filters.actorId;
    }

    if (filters?.action) {
      where.action = filters.action;
    }

    if (filters?.entity) {
      where.entity = filters.entity;
    }

    if (filters?.ipAddress) {
      where.ipAddress = filters.ipAddress;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          actor: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs: logs as any, total };
  }

  /**
   * Export activity logs in CSV or JSON format
   */
  async exportLogs(
    filters: ActivityFilters,
    format: 'csv' | 'json'
  ): Promise<string> {
    // Get all logs matching filters (without pagination for export)
    const where: any = {};

    if (filters?.actorId) {
      where.actorId = filters.actorId;
    }

    if (filters?.action) {
      where.action = filters.action;
    }

    if (filters?.entity) {
      where.entity = filters.entity;
    }

    if (filters?.ipAddress) {
      where.ipAddress = filters.ipAddress;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10000, // Limit to prevent memory issues
    });

    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    }

    // CSV format
    const headers = [
      'ID',
      'Timestamp',
      'Actor ID',
      'Actor Name',
      'Actor Email',
      'Actor Role',
      'Action',
      'Entity',
      'Entity ID',
      'IP Address',
      'User Agent',
    ];

    const rows = logs.map((log) => [
      log.id.toString(),
      log.createdAt.toISOString(),
      log.actorId.toString(),
      log.actor.name,
      log.actor.email,
      log.actor.role,
      log.action,
      log.entity,
      log.entityId.toString(),
      log.ipAddress || '',
      log.userAgent || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    return csvContent;
  }
}

// Export singleton instance
export const activityLogger = new ActivityLogger();
