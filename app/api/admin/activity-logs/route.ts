import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig as authOptions } from '@/lib/auth/config';
import { activityLogger } from '@/lib/admin/activity-logger';

/**
 * GET /api/admin/activity-logs
 * Get activity logs with pagination and filters
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const actorId = searchParams.get('actorId');
    const action = searchParams.get('action');
    const entity = searchParams.get('entity');
    const ipAddress = searchParams.get('ipAddress');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build filters
    const filters: any = {
      page,
      pageSize,
    };

    if (actorId) {
      filters.actorId = BigInt(actorId);
    }

    if (action) {
      filters.action = action;
    }

    if (entity) {
      filters.entity = entity;
    }

    if (ipAddress) {
      filters.ipAddress = ipAddress;
    }

    if (dateFrom) {
      filters.dateFrom = new Date(dateFrom);
    }

    if (dateTo) {
      filters.dateTo = new Date(dateTo);
    }

    // Fetch activity logs
    const { logs, total } = await activityLogger.getSystemActivity(filters);

    // Format logs for response
    const formattedLogs = logs.map((log) => ({
      id: log.id.toString(),
      action: log.action,
      entity: log.entity,
      entityId: log.entityId.toString(),
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      metadata: log.metadata,
      diff: log.diff,
      timestamp: log.createdAt,
      actorId: log.actor.id.toString(),
      actorName: log.actor.name,
      actorEmail: log.actor.email,
      actorRole: log.actor.role,
    }));

    return NextResponse.json({
      logs: formattedLogs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
