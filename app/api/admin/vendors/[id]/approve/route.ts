import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig as authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { createAuditLog, AuditAction } from '@/lib/audit/audit-logger';
import { logger } from '@/lib/logger';

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
    
    const vendorId = BigInt(params.id);
    
    const vendor = await prisma.$transaction(async (tx) => {
      // Update vendor status
      const updatedVendor = await tx.vendor.update({
        where: { id: vendorId },
        data: {
          status: 'APPROVED',
          approvedAt: new Date(),
          approvedBy: BigInt(session.user.id)
        },
        include: { 
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              roles: true
            }
          }
        }
      });
      
      // Add VENDOR role to user if not already present
      const currentRoles = updatedVendor.user.roles as any;
      let rolesArray: string[] = [];
      
      if (Array.isArray(currentRoles)) {
        rolesArray = currentRoles;
      } else if (typeof currentRoles === 'string') {
        try {
          rolesArray = JSON.parse(currentRoles);
        } catch {
          rolesArray = [currentRoles];
        }
      }
      
      if (!rolesArray.includes('VENDOR')) {
        rolesArray.push('VENDOR');
        
        await tx.user.update({
          where: { id: updatedVendor.userId },
          data: {
            roles: rolesArray
          }
        });
      }
      
      return updatedVendor;
    });
    
    // Audit log
    await createAuditLog({
      action: AuditAction.VENDOR_APPROVED,
      actorId: session.user.id,
      entity: 'Vendor',
      entityId: vendor.id,
      metadata: {
        businessName: vendor.businessName
      }
    });
    
    return NextResponse.json({ 
      vendor: {
        id: vendor.id.toString(),
        businessName: vendor.businessName,
        status: vendor.status
      }
    });
  } catch (error) {
    logger.error('Vendor approval error', error);
    return NextResponse.json(
      { error: 'Failed to approve vendor' },
      { status: 500 }
    );
  }
}
