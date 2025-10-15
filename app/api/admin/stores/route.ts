import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireRole } from '@/lib/auth/api-auth';
import { ActivityLogger } from '@/lib/admin/activity-logger';

// GET /api/admin/stores - List all stores with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, ['ADMIN']);
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') as 'ACTIVE' | 'SUSPENDED' | 'PENDING' | null;
    const sellerId = searchParams.get('sellerId');
    
    const skip = (page - 1) * pageSize;
    
    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { seller: { user: { name: { contains: search } } } },
        { seller: { user: { email: { contains: search } } } },
      ];
    }
    
    if (status) {
      where.status = status;
    }
    
    if (sellerId) {
      where.sellerId = BigInt(sellerId);
    }
    
    // Get total count
    const totalCount = await prisma.store.count({ where });
    
    // Get stores with pagination
    const stores = await prisma.store.findMany({
      where,
      skip,
      take: pageSize,
      include: {
        seller: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            products: true,
            auctions: true,
            orders: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // Serialize BigInt values
    const serializedStores = stores.map(store => ({
      ...store,
      id: store.id.toString(),
      sellerId: store.sellerId.toString(),
      seller: {
        ...store.seller,
        id: store.seller.id.toString(),
        userId: store.seller.userId.toString(),
        user: {
          ...store.seller.user,
          id: store.seller.user.id.toString(),
        },
      },
    }));
    
    return NextResponse.json({
      stores: serializedStores,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    console.error('Error fetching stores:', error);
    return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 });
  }
}

// POST /api/admin/stores - Create a new store
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(request, ['ADMIN']);
    
    const body = await request.json();
    const { name, email, phone, sellerId, address, socials, seo, status } = body;
    
    // Validate required fields
    if (!name || !email || !sellerId) {
      return NextResponse.json(
        { error: 'Name, email, and seller are required' },
        { status: 400 }
      );
    }
    
    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Check if slug already exists
    const existingStore = await prisma.store.findUnique({
      where: { slug },
    });
    
    if (existingStore) {
      return NextResponse.json(
        { error: 'A store with this name already exists' },
        { status: 400 }
      );
    }
    
    // Verify seller exists
    const seller = await prisma.vendor.findUnique({
      where: { id: BigInt(sellerId) },
    });
    
    if (!seller) {
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      );
    }
    
    // Create store
    const store = await prisma.store.create({
      data: {
        name,
        slug,
        email,
        phone: phone || null,
        sellerId: BigInt(sellerId),
        address: address || null,
        socials: socials || null,
        seo: seo || null,
        status: status || 'PENDING',
      },
      include: {
        seller: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
    
    // Log activity
    const activityLogger = new ActivityLogger();
    await activityLogger.log(
      BigInt(user.userId),
      {
        action: 'STORE_CREATED',
        entity: 'Store',
        entityId: store.id,
        metadata: {
          storeName: store.name,
          sellerId: sellerId,
        },
      },
      request
    );
    
    // Serialize BigInt values
    const serializedStore = {
      ...store,
      id: store.id.toString(),
      sellerId: store.sellerId.toString(),
      seller: {
        ...store.seller,
        id: store.seller.id.toString(),
        userId: store.seller.userId.toString(),
        user: {
          ...store.seller.user,
          id: store.seller.user.id.toString(),
        },
      },
    };
    
    return NextResponse.json({ store: serializedStore }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    console.error('Error creating store:', error);
    return NextResponse.json({ error: 'Failed to create store' }, { status: 500 });
  }
}
