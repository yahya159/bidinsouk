import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig as authOptions } from '@/lib/auth/config';
import { activityLogger } from '@/lib/admin/activity-logger';

/**
 * GET /api/admin/activity-logs/export
 * Export activity logs in CSV or JSON format
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const format = (searchParams.get('format') || 'csv') as 'csv' | 'json';
    const actorId = searchParams.get('actorId');
    const action = searchParams.get('action');
    const entity = searchParams.get('entity');
    const ipAddress = searchParams.get('ipAddress');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build filters
    const filters: any = {};

    if (actorId) {
      filters.actorId = BigInt(actorId);
    }

    // Handle multiple action filters
    const actions = searchParams.getAll('action');
    if (actions.length > 0) {
      // For multiple actions, we'll need to modify the query
      // For now, use the first one
      filters.action = actions[0];
    } else if (action) {
      filters.action = action;
    }

    // Handle multiple entity filters
    const entities = searchParams.getAll('entity');
    if (entities.length > 0) {
      filters.entity = entities[0];
    } else if (entity) {
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

    // Export logs
    const exportData = await activityLogger.exportLogs(filters, format);

    // Set appropriate headers based on format
    const headers: Record<string, string> = {
      'Content-Disposition': `attachment; filename="activity-logs-${new Date().toISOString()}.${format}"`,
    };

    if (format === 'csv') {
      headers['Content-Type'] = 'text/csv';
    } else {
      headers['Content-Type'] = 'application/json';
    }

    return new NextResponse(exportData, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error exporting activity logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
