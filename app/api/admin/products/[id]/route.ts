import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig as authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { isAdmin } from '@/lib/admin/permissions';
import { ActivityLogger } from '@/lib/admin/activity-logger';
import { ProductCondition, ProductStatus } from '@prisma/client';

// GET /api/admin/products/[id] - Get product details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const product = await prisma.product.findUnique({
      where: { id: BigInt(params.id) },
      select: {
        id: true,
        title: true,
        description: true,
        brand: true,
        category: true,
        condition: true,
        status: true,
        price: true,
        compareAtPrice: true,
        sku: true,
        barcode: true,
        images: true,
        tags: true,
        seoData: true,
        variants: true,
        inventory: true,
        views: true,
        createdAt: true,
        updatedAt: true,
        store: {
          select: {
            id: true,
            name: true,
            seller: {
              select: {
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
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/products/[id] - Update product
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      brand,
      category,
      condition,
      status,
      price,
      compareAtPrice,
      storeId,
      images,
      tags,
      sku,
      barcode,
    } = body;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: BigInt(params.id) },
      select: {
        id: true,
        title: true,
        status: true,
        storeId: true,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Validation
    if (condition && !['NEW', 'USED'].includes(condition)) {
      return NextResponse.json(
        { error: 'Invalid condition. Must be NEW or USED' },
        { status: 400 }
      );
    }

    if (status && !['DRAFT', 'ACTIVE', 'ARCHIVED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be DRAFT, ACTIVE, or ARCHIVED' },
        { status: 400 }
      );
    }

    // If storeId is being changed, verify new store exists
    if (storeId && BigInt(storeId) !== existingProduct.storeId) {
      const store = await prisma.store.findUnique({
        where: { id: BigInt(storeId) },
      });

      if (!store) {
        return NextResponse.json(
          { error: 'Store not found' },
          { status: 404 }
        );
      }
    }

    // Build update data
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description || null;
    if (brand !== undefined) updateData.brand = brand || null;
    if (category !== undefined) updateData.category = category || null;
    if (condition !== undefined) updateData.condition = condition as ProductCondition;
    if (status !== undefined) updateData.status = status as ProductStatus;
    if (price !== undefined) updateData.price = price ? parseFloat(price) : null;
    if (compareAtPrice !== undefined) updateData.compareAtPrice = compareAtPrice ? parseFloat(compareAtPrice) : null;
    if (storeId !== undefined) updateData.storeId = BigInt(storeId);
    if (images !== undefined) updateData.images = images;
    if (tags !== undefined) updateData.tags = tags;
    if (sku !== undefined) updateData.sku = sku || null;
    if (barcode !== undefined) updateData.barcode = barcode || null;

    // Update product
    const product = await prisma.product.update({
      where: { id: BigInt(params.id) },
      data: updateData,
      select: {
        id: true,
        title: true,
        description: true,
        brand: true,
        category: true,
        condition: true,
        status: true,
        price: true,
        compareAtPrice: true,
        images: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Log activity
    const activityLogger = new ActivityLogger();
    await activityLogger.log(
      BigInt(session.user.id),
      {
        action: 'PRODUCT_UPDATED',
        entity: 'Product',
        entityId: product.id,
        metadata: {
          productTitle: product.title,
          changes: Object.keys(updateData),
          statusChanged: status !== undefined && status !== existingProduct.status,
        },
      },
      request
    );

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/products/[id] - Delete product
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: BigInt(params.id) },
      select: {
        id: true,
        title: true,
        auctions: {
          select: { id: true, status: true },
        },
        watchlistItems: {
          select: { id: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check for active auctions
    const activeAuctions = product.auctions.filter(
      (auction) => auction.status === 'RUNNING' || auction.status === 'ENDING_SOON'
    );

    if (activeAuctions.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete product with active auctions' },
        { status: 409 }
      );
    }

    // Delete related data first
    await prisma.$transaction([
      // Delete watchlist items
      prisma.watchlistItem.deleteMany({
        where: { productId: BigInt(params.id) },
      }),
      // Delete reviews
      prisma.review.deleteMany({
        where: { productId: BigInt(params.id) },
      }),
      // Delete offers
      prisma.offer.deleteMany({
        where: { productId: BigInt(params.id) },
      }),
      // Delete message threads
      prisma.messageThread.deleteMany({
        where: { productId: BigInt(params.id) },
      }),
      // Delete the product
      prisma.product.delete({
        where: { id: BigInt(params.id) },
      }),
    ]);

    // Log activity
    const activityLogger = new ActivityLogger();
    await activityLogger.log(
      BigInt(session.user.id),
      {
        action: 'PRODUCT_DELETED',
        entity: 'Product',
        entityId: BigInt(params.id),
        metadata: {
          productTitle: product.title,
          watchlistCount: product.watchlistItems.length,
          auctionCount: product.auctions.length,
        },
      },
      request
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
