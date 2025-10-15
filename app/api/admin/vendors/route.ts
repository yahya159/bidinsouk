import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig as authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    const roles = session?.user?.roles as string[] | undefined;
    if (!session?.user || !roles?.includes('ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const vendors = await prisma.vendor.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        stores: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
    
    // Convert BigInt to string for JSON serialization
    const serializedVendors = vendors.map(vendor => ({
      ...vendor,
      id: vendor.id.toString(),
      userId: vendor.userId.toString(),
      approvedBy: vendor.approvedBy?.toString(),
      rejectedBy: vendor.rejectedBy?.toString(),
      reinstatedBy: vendor.reinstatedBy?.toString(),
      user: {
        ...vendor.user,
        id: vendor.user.id.toString()
      },
      stores: vendor.stores.map(store => ({
        ...store,
        id: store.id.toString()
      }))
    }));
    
    return NextResponse.json({ vendors: serializedVendors });
  } catch (error) {
    logger.error('Fetch vendors error', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendors' },
      { status: 500 }
    );
  }
}
