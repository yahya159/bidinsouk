import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig as authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

/**
 * Vendor context interface
 */
export interface VendorContext {
  session: any;
  vendor: any;
  stores: any[];
  activeStore: any | null;
}

/**
 * Get vendor context with authentication and store info
 * Throws error if user is not authenticated or not a vendor
 * 
 * @param request - NextRequest object
 * @param requireActiveStore - Whether to require at least one active store
 * @returns VendorContext with session, vendor, and stores
 */
export async function getVendorContext(
  request: NextRequest,
  requireActiveStore = false
): Promise<VendorContext> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new Error('UNAUTHORIZED');
  }
  
  const roles = session?.user?.roles as string[] | undefined;
  if (!roles?.includes('VENDOR') && !roles?.includes('ADMIN')) {
    throw new Error('VENDOR_ACCESS_REQUIRED');
  }
  
  const vendor = await prisma.vendor.findUnique({
    where: { userId: BigInt(session.user.id) },
    include: {
      stores: {
        where: { deletedAt: null }
      }
    }
  });
  
  if (!vendor) {
    throw new Error('VENDOR_PROFILE_NOT_FOUND');
  }
  
  if (vendor.status !== 'APPROVED') {
    throw new Error(`VENDOR_NOT_APPROVED: ${vendor.status}`);
  }
  
  const activeStore = vendor.stores.find(s => s.status === 'ACTIVE');
  
  if (requireActiveStore && !activeStore) {
    throw new Error('ACTIVE_STORE_REQUIRED');
  }
  
  return {
    session,
    vendor,
    stores: vendor.stores,
    activeStore: activeStore || null
  };
}

/**
 * Lightweight vendor check - just returns vendorId if exists
 * Use this when you don't need full context
 */
export async function getVendorId(request: NextRequest): Promise<bigint> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new Error('UNAUTHORIZED');
  }
  
  const vendor = await prisma.vendor.findUnique({
    where: { userId: BigInt(session.user.id) },
    select: { id: true, status: true }
  });
  
  if (!vendor) {
    throw new Error('VENDOR_PROFILE_NOT_FOUND');
  }
  
  if (vendor.status !== 'APPROVED') {
    throw new Error(`VENDOR_NOT_APPROVED: ${vendor.status}`);
  }
  
  return vendor.id;
}

