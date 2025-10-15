import { NextRequest, NextResponse } from 'next/server';
import { deleteStore, updateStoreStatus } from '@/lib/services/admin';
import { requireRole } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/db/prisma';
import { ActivityLogger } from '@/lib/admin/activity-logger';

// GET /api/admin/stores/[id] - Get store details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;

    const user = await requireRole(request, ['ADMIN']);
    
    const store = await prisma.store.findUnique({
      where: { id: BigInt(params.id) },
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
        products: {
          select: {
            id: true,
            title: true,
            status: true,
            price: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        auctions: {
          select: {
            id: true,
            title: true,
            status: true,
            currentBid: true,
            endAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        _count: {
          select: {
            products: true,
            auctions: true,
            orders: true,
          },
        },
      },
    });
    
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }
    
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
      products: store.products.map(p => ({
        ...p,
        id: p.id.toString(),
        price: p.price?.toString(),
      })),
      auctions: store.auctions.map(a => ({
        ...a,
        id: a.id.toString(),
        currentBid: a.currentBid.toString(),
      })),
    };
    
    return NextResponse.json({ store: serializedStore });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    console.error('Error fetching store:', error);
    return NextResponse.json({ error: 'Failed to fetch store' }, { status: 500 });
  }
}

// PUT /api/admin/stores/[id] - Update store
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;

    const user = await requireRole(request, ['ADMIN']);
    
    const body = await request.json();
    const { name, email, phone, address, socials, seo, status } = body;
    
    // Check if store exists
    const existingStore = await prisma.store.findUnique({
      where: { id: BigInt(params.id) },
    });
    
    if (!existingStore) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }
    
    // Prepare update data
    const updateData: any = {};
    
    if (name !== undefined) {
      updateData.name = name;
      // Update slug if name changes
      updateData.slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }
    
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (socials !== undefined) updateData.socials = socials;
    if (seo !== undefined) updateData.seo = seo;
    if (status !== undefined) {
      if (!['ACTIVE', 'SUSPENDED', 'PENDING'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      updateData.status = status;
    }
    
    // Update store
    const store = await prisma.store.update({
      where: { id: BigInt(params.id) },
      data: updateData,
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
        action: 'STORE_UPDATED',
        entity: 'Store',
        entityId: store.id,
        metadata: {
          storeName: store.name,
          changes: Object.keys(updateData),
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
    
    return NextResponse.json({ store: serializedStore });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    console.error('Error updating store:', error);
    return NextResponse.json({ error: 'Failed to update store' }, { status: 500 });
  }
}

// DELETE /api/admin/stores/[id] - Delete store
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;

    const user = await requireRole(req, ['ADMIN']);
    
    // Get store details before deletion for logging
    const store = await prisma.store.findUnique({
      where: { id: BigInt(params.id) },
      select: { id: true, name: true },
    });
    
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    await deleteStore(BigInt(params.id));
    
    // Log activity
    const activityLogger = new ActivityLogger();
    await activityLogger.log(
      BigInt(user.userId),
      {
        action: 'STORE_DELETED',
        entity: 'Store',
        entityId: store.id,
        metadata: {
          storeName: store.name,
        },
      },
      req
    );
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    if (error.message === 'Forbidden') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    console.error('Error deleting store:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// PATCH /api/admin/stores/[id] - Update store status (legacy support)
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;

    const user = await requireRole(req, ['ADMIN']);

    const { status } = await req.json();
    if (!['ACTIVE', 'SUSPENDED', 'PENDING'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const store = await updateStoreStatus(BigInt(params.id), status);
    
    // Log activity
    const activityLogger = new ActivityLogger();
    await activityLogger.log(
      BigInt(user.userId),
      {
        action: 'STORE_STATUS_CHANGED',
        entity: 'Store',
        entityId: BigInt(params.id),
        metadata: {
          newStatus: status,
        },
      },
      req
    );
    
    return NextResponse.json({ store });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    if (error.message === 'Forbidden') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
