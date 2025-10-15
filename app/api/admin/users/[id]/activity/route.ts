import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig as authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { isAdmin } from '@/lib/admin/permissions';

// GET /api/admin/users/[id]/activity - Get user activity logs
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = BigInt(params.id);
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const action = searchParams.get('action') || '';
    const entity = searchParams.get('entity') || '';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: any = {
      actorId: userId,
    };

    if (action) {
      where.action = action;
    }

    if (entity) {
      where.entity = entity;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    const [logs, totalCount] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: pageSize,
        select: {
          id: true,
          action: true,
          entity: true,
          entityId: true,
          ipAddress: true,
          userAgent: true,
          metadata: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user activity' },
      { status: 500 }
    );
  }
}
