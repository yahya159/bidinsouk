import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig as authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/admin/activity-logs/[id]
 * Get a single activity log by ID
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

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

    const logId = BigInt(id);

    // Fetch the log
    const log = await prisma.auditLog.findUnique({
      where: { id: logId },
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
    });

    if (!log) {
      return NextResponse.json(
        { error: 'Activity log not found' },
        { status: 404 }
      );
    }

    // Format log for response
    const formattedLog = {
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
    };

    return NextResponse.json(formattedLog);
  } catch (error) {
    console.error('Error fetching activity log:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
