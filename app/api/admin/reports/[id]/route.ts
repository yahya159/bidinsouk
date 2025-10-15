import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig as authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { isAdmin } from '@/lib/admin/permissions';
import { activityLogger } from '@/lib/admin/activity-logger';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;

    const session = await getServerSession(authOptions);
    
    if (!session?.user || !isAdmin(session)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const reportId = BigInt(params.id);

    const report = await prisma.abuseReport.findUnique({
      where: { id: reportId },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            phone: true,
            createdAt: true,
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Fetch target information
    let targetInfo = null;
    let reportedUser = null;

    if (report.targetType === 'Product') {
      targetInfo = await prisma.product.findUnique({
        where: { id: report.targetId },
        include: {
          store: {
            include: {
              seller: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      phone: true,
                      avatarUrl: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
      if (targetInfo) {
        reportedUser = targetInfo.store.seller.user;
      }
    } else if (report.targetType === 'Auction') {
      targetInfo = await prisma.auction.findUnique({
        where: { id: report.targetId },
        include: {
          product: {
            select: {
              id: true,
              title: true,
              images: true,
            },
          },
          store: {
            include: {
              seller: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      phone: true,
                      avatarUrl: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
      if (targetInfo) {
        reportedUser = targetInfo.store.seller.user;
      }
    } else if (report.targetType === 'User') {
      targetInfo = await prisma.user.findUnique({
        where: { id: report.targetId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatarUrl: true,
          role: true,
          createdAt: true,
        },
      });
      reportedUser = targetInfo;
    }

    // Log activity
    await activityLogger.log(
      BigInt(session.user.id),
      {
        action: 'REPORT_VIEWED',
        entity: 'AbuseReport',
        entityId: reportId,
        metadata: { reportId: params.id },
      },
      request
    );

    return NextResponse.json({
      report: {
        ...report,
        targetInfo,
        reportedUser,
      },
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;

    const session = await getServerSession(authOptions);
    
    if (!session?.user || !isAdmin(session)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const reportId = BigInt(params.id);
    const body = await request.json();
    const { status, action } = body;

    // Validate status
    const validStatuses = ['OPEN', 'REVIEWING', 'RESOLVED', 'REJECTED'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Fetch the report first
    const existingReport = await prisma.abuseReport.findUnique({
      where: { id: reportId },
    });

    if (!existingReport) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Update report status
    const updatedReport = await prisma.abuseReport.update({
      where: { id: reportId },
      data: {
        status: status || existingReport.status,
      },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // If action is specified, take action on the reported content
    if (action) {
      if (action === 'remove' && existingReport.targetType === 'Product') {
        await prisma.product.update({
          where: { id: existingReport.targetId },
          data: { status: 'ARCHIVED' },
        });
      } else if (action === 'remove' && existingReport.targetType === 'Auction') {
        await prisma.auction.update({
          where: { id: existingReport.targetId },
          data: { status: 'ARCHIVED' },
        });
      } else if (action === 'suspend' && existingReport.targetType === 'User') {
        // Note: User suspension would require a status field on User model
        // For now, we'll just log the action
        console.log(`User suspension requested for user ${existingReport.targetId}`);
      }
    }

    // Log activity
    await activityLogger.log(
      BigInt(session.user.id),
      {
        action: 'REPORT_UPDATED',
        entity: 'AbuseReport',
        entityId: reportId,
        metadata: {
          reportId: params.id,
          oldStatus: existingReport.status,
          newStatus: status,
          action,
        },
      },
      request
    );

    return NextResponse.json({
      report: updatedReport,
      message: 'Report updated successfully',
    });
  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json(
      { error: 'Failed to update report' },
      { status: 500 }
    );
  }
}
