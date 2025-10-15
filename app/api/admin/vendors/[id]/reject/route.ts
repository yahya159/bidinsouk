import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig as authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { createAuditLog, AuditAction } from '@/lib/audit/audit-logger';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const rejectSchema = z.object({
  reason: z.string().min(10),
  category: z.enum(['INCOMPLETE_DOCS', 'INVALID_INFO', 'POLICY_VIOLATION', 'OTHER'])
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
    const { reason, category } = rejectSchema.parse(body);
    
    const vendorId = BigInt(params.id);
    
    const vendor = await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectedBy: BigInt(session.user.id),
        rejectionReason: reason,
        rejectionCategory: category
      },
      include: { 
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });
    
    // Audit log
    await createAuditLog({
      action: AuditAction.VENDOR_REJECTED,
      actorId: session.user.id,
      entity: 'Vendor',
      entityId: vendor.id,
      metadata: { reason, category }
    });
    
    return NextResponse.json({ 
      vendor: {
        id: vendor.id.toString(),
        businessName: vendor.businessName,
        status: vendor.status,
        rejectionReason: vendor.rejectionReason
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    
    logger.error('Vendor rejection error', error);
    return NextResponse.json(
      { error: 'Failed to reject vendor' },
      { status: 500 }
    );
  }
}
