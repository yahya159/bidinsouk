import { getServerSession } from 'next-auth';
import { authConfig as authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

export class VendorError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 403
  ) {
    super(message);
    this.name = 'VendorError';
  }
}

export async function requireVendor() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new VendorError('Authentication required', 'UNAUTHORIZED', 401);
  }
  
  // Check if user has VENDOR role (in roles array)
  const roles = session.user.roles as string[] | undefined;
  if (!roles?.includes('VENDOR')) {
    throw new VendorError('Vendor role required', 'FORBIDDEN', 403);
  }
  
  const vendor = await prisma.vendor.findUnique({
    where: { userId: BigInt(session.user.id) },
    include: {
      stores: true,
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
  
  if (!vendor) {
    throw new VendorError('Vendor profile not found', 'VENDOR_NOT_FOUND', 404);
  }
  
  if (vendor.status === 'PENDING') {
    throw new VendorError(
      'Your vendor application is pending review',
      'VENDOR_PENDING',
      403
    );
  }
  
  if (vendor.status === 'REJECTED') {
    const canReapply = vendor.rejectedAt && 
      Date.now() - vendor.rejectedAt.getTime() > 30 * 24 * 60 * 60 * 1000;
    
    throw new VendorError(
      canReapply 
        ? 'Your application was rejected. You can reapply now.'
        : 'Your application was rejected. Please wait before reapplying.',
      'VENDOR_REJECTED',
      403
    );
  }
  
  if (vendor.status === 'SUSPENDED') {
    throw new VendorError(
      `Your vendor account is suspended: ${vendor.suspensionReason}`,
      'VENDOR_SUSPENDED',
      403
    );
  }
  
  if (vendor.status !== 'APPROVED') {
    throw new VendorError(
      `Invalid vendor status: ${vendor.status}`,
      'INVALID_VENDOR_STATUS',
      403
    );
  }
  
  return { session, vendor };
}

export async function requireActiveStore() {
  const { session, vendor } = await requireVendor();
  
  const store = vendor.stores[0]; // One store per vendor
  
  if (!store) {
    throw new VendorError(
      'Store not found. Please create a store first.',
      'STORE_NOT_FOUND',
      404
    );
  }
  
  if (store.status === 'PENDING') {
    throw new VendorError(
      'Your store is pending approval',
      'STORE_PENDING',
      403
    );
  }
  
  if (store.status === 'SUSPENDED') {
    throw new VendorError(
      'Your store is suspended',
      'STORE_SUSPENDED',
      403
    );
  }
  
  if (store.status !== 'ACTIVE') {
    throw new VendorError(
      `Invalid store status: ${store.status}`,
      'INVALID_STORE_STATUS',
      403
    );
  }
  
  return { session, vendor, store };
}
