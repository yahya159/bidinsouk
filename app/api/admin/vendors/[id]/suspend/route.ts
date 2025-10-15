import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig as authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { createAuditLog, AuditAction } from '@/lib/audit/audit-logger';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const suspendSchema = z.object({
  reason: z.string().min(10)
});

export async function POST(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const params = await paramsPromise
  try {
    const session = await getServerSession(authOptions);
    
    const roles = session?.user?.roles as string[] | undefined;
    if (!session?.user || !roles?.includes('ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const body = await request.json();
    const { reason } = suspendSchema.parse(body);
    
    const vendorId = BigInt(params.id);
    
    const result = await prisma.$transaction(async (tx) => {
      // Suspend vendor
      const vendor = await tx.vendor.update({
        where: { id: vendorId },
        data: {
          status: 'SUSPENDED',
          suspendedAt: new Date(),
          suspensionReason: reason
        }
      });
      
      // Suspend all stores
      await tx.store.updateMany({
        where: { sellerId: vendorId },
        data: {
          status: 'SUSPENDED',
          suspendedAt: new Date()
        }
      });
      
      // Hide all products
      const products = await tx.product.updateMany({
        where: {
          store: {
            sellerId: vendorId
          }
        },
        data: {
          status: 'ARCHIVED'
        }
      });
      
      // Cancel active auctions
      const auctions = await tx.auction.updateMany({
        where: {
          store: {
            sellerId: vendorId
          },
          status: { in: ['ACTIVE', 'RUNNING', 'SCHEDULED'] }
        },
        data: {
          status: 'CANCELLED'
        }
      });
      
      return { vendor, productsHidden: products.count, auctionsCancelled: auctions.count };
    });
    
    // Audit log
    await createAuditLog({
      action: AuditAction.VENDOR_SUSPENDED,
      actorId: session.user.id,
      entity: 'Vendor',
      entityId: vendorId,
      metadata: { 
        reason,
        productsHidden: result.productsHidden,
        auctionsCancelled: result.auctionsCancelled
      }
    });
    
    return NextResponse.json({ 
      vendor: {
        id: result.vendor.id.toString(),
        status: result.vendor.status
      },
      productsHidden: result.productsHidden,
      auctionsCancelled: result.auctionsCancelled
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    
    logger.error('Vendor suspension error', error);
    return NextResponse.json(
      { error: 'Failed to suspend vendor' },
      { status: 500 }
    );
  }
}
