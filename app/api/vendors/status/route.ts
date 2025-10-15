import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig as authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

/**
 * GET /api/vendors/status
 * Get current user's vendor status
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const vendor = await prisma.vendor.findUnique({
      where: { userId: BigInt(session.user.id) },
      include: {
        stores: {
          select: {
            id: true,
            name: true,
            status: true,
            slug: true
          }
        }
      }
    });
    
    if (!vendor) {
      return NextResponse.json({ vendor: null });
    }
    
    // Calculate if can reapply
    let canReapply = false;
    let daysUntilReapply = 0;
    
    if (vendor.status === 'REJECTED' && vendor.rejectedAt) {
      const daysSince = Math.floor(
        (Date.now() - vendor.rejectedAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      canReapply = daysSince >= 30;
      daysUntilReapply = Math.max(0, 30 - daysSince);
    }
    
    return NextResponse.json({
      vendor: {
        id: vendor.id.toString(),
        businessName: vendor.businessName,
        status: vendor.status,
        rejectionReason: vendor.rejectionReason,
        rejectionCategory: vendor.rejectionCategory,
        suspensionReason: vendor.suspensionReason,
        canReapply,
        daysUntilReapply,
        stores: vendor.stores.map(store => ({
          id: store.id.toString(),
          name: store.name,
          status: store.status,
          slug: store.slug
        })),
        store: vendor.stores[0] ? {
          id: vendor.stores[0].id.toString(),
          name: vendor.stores[0].name,
          status: vendor.stores[0].status,
          slug: vendor.stores[0].slug
        } : null,
        createdAt: vendor.createdAt
      }
    });
  } catch (error) {
    logger.error('Vendor status error', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendor status' },
      { status: 500 }
    );
  }
}

