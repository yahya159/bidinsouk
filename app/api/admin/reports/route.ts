import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig as authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { isAdmin } from '@/lib/admin/permissions';
import { activityLogger } from '@/lib/admin/activity-logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !isAdmin(session)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const status = searchParams.get('status');
    const targetType = searchParams.get('targetType');
    const search = searchParams.get('search');

    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (targetType) {
      where.targetType = targetType;
    }

    if (search) {
      where.OR = [
        { reason: { contains: search } },
        { details: { contains: search } },
      ];
    }

    // Fetch reports with pagination
    const [reports, totalCount] = await Promise.all([
      prisma.abuseReport.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          reporter: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.abuseReport.count({ where }),
    ]);

    // Enrich reports with target information
    const enrichedReports = await Promise.all(
      reports.map(async (report) => {
        let targetInfo = null;

        if (report.targetType === 'Product') {
          targetInfo = await prisma.product.findUnique({
            where: { id: report.targetId },
            select: {
              id: true,
              title: true,
              status: true,
              store: {
                select: {
                  name: true,
                  seller: {
                    select: {
                      user: {
                        select: {
                          name: true,
                          email: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          });
        } else if (report.targetType === 'Auction') {
          targetInfo = await prisma.auction.findUnique({
            where: { id: report.targetId },
            select: {
              id: true,
              title: true,
              status: true,
              store: {
                select: {
                  name: true,
                  seller: {
                    select: {
                      user: {
                        select: {
                          name: true,
                          email: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          });
        } else if (report.targetType === 'User') {
          targetInfo = await prisma.user.findUnique({
            where: { id: report.targetId },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          });
        }

        return {
          ...report,
          targetInfo,
        };
      })
    );

    // Log activity
    await activityLogger.log(
      BigInt(session.user.id),
      {
        action: 'REPORTS_VIEWED',
        entity: 'AbuseReport',
        entityId: BigInt(0),
        metadata: { page, pageSize, filters: { status, targetType, search } },
      },
      request
    );

    return NextResponse.json({
      reports: enrichedReports,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}
