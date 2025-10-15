import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

// Validation schema for product updates
const updateProductSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(2000).optional(),
  images: z.array(z.string().url()).min(1).max(10).optional(),
  category: z.string().min(1).optional(),
  price: z.number().min(0.01).max(1000000).optional(),
  compareAtPrice: z.number().min(0).max(1000000).optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  trackQuantity: z.boolean().optional(),
  quantity: z.number().min(0).optional(),
  allowBackorder: z.boolean().optional(),
  weight: z.number().min(0).optional(),
  dimensions: z.object({
    length: z.number().min(0).optional(),
    width: z.number().min(0).optional(),
    height: z.number().min(0).optional(),
  }).optional(),
  tags: z.array(z.string()).optional(),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
  variants: z.array(z.object({
    name: z.string(),
    values: z.array(z.string()),
  })).optional(),
});

// Database-based product operations

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// GET /api/vendors/products/[id] - Get product details
export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (session?.user?.role !== 'VENDOR' && session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const productId = BigInt(id);
    
    // Build where clause for access control
    const where: any = { id: productId };
    if (session?.user?.role === 'VENDOR') {
      // Get vendor's store
      const vendor = await prisma.vendor.findUnique({
        where: { userId: BigInt(session.user.id) },
        include: { stores: true }
      });
      
      if (!vendor || vendor.stores.length === 0) {
        return NextResponse.json({ error: 'Aucune boutique trouvée' }, { status: 404 });
      }
      
      where.storeId = { in: vendor.stores.map(store => store.id) };
    }

    const product = await prisma.product.findFirst({
      where,
      include: {
        store: {
          select: { id: true, name: true }
        }
      }
    });

    if (!product) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 });
    }

    return NextResponse.json({ product });

  } catch (error) {
    console.error('Error fetching product details:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// PUT /api/vendors/products/[id] - Update product
export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (session?.user?.role !== 'VENDOR' && session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const productId = BigInt(id);
    
    // Build where clause for access control
    const where: any = { id: productId };
    if (session?.user?.role === 'VENDOR') {
      // Get vendor's store
      const vendor = await prisma.vendor.findUnique({
        where: { userId: BigInt(session.user.id) },
        include: { stores: true }
      });
      
      if (!vendor || vendor.stores.length === 0) {
        return NextResponse.json({ error: 'Aucune boutique trouvée' }, { status: 404 });
      }
      
      where.storeId = { in: vendor.stores.map(store => store.id) };
    }

    const existingProduct = await prisma.product.findFirst({ where });
    if (!existingProduct) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = updateProductSchema.parse(body);

    // Prepare update data with proper type conversions
    const updateData: any = {};
    
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.images !== undefined) updateData.images = validatedData.images;
    if (validatedData.category !== undefined) updateData.category = validatedData.category;
    if (validatedData.price !== undefined) updateData.price = validatedData.price;
    if (validatedData.compareAtPrice !== undefined) updateData.compareAtPrice = validatedData.compareAtPrice;
    if (validatedData.sku !== undefined) updateData.sku = validatedData.sku;
    if (validatedData.barcode !== undefined) updateData.barcode = validatedData.barcode;
    if (validatedData.status !== undefined) updateData.status = validatedData.status;
    if (validatedData.tags !== undefined) updateData.tags = validatedData.tags;
    if (validatedData.seoTitle !== undefined || validatedData.seoDescription !== undefined) {
      updateData.seoData = {
        title: validatedData.seoTitle,
        description: validatedData.seoDescription,
      };
    }
    if (validatedData.variants !== undefined) updateData.variants = validatedData.variants;
    if (validatedData.trackQuantity !== undefined || validatedData.quantity !== undefined || validatedData.allowBackorder !== undefined) {
      updateData.inventory = {
        trackQuantity: validatedData.trackQuantity,
        quantity: validatedData.quantity,
        allowBackorder: validatedData.allowBackorder,
      };
    }

    // Update product in database
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        store: {
          select: { id: true, name: true }
        }
      }
    });

    return NextResponse.json({
      message: 'Produit mis à jour avec succès',
      product: updatedProduct,
    });

  } catch (error) {
    console.error('Error updating product:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// DELETE /api/vendors/products/[id] - Delete product
export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (session?.user?.role !== 'VENDOR' && session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const productId = BigInt(id);
    
    // Build where clause for access control
    const where: any = { id: productId };
    if (session?.user?.role === 'VENDOR') {
      // Get vendor's store
      const vendor = await prisma.vendor.findUnique({
        where: { userId: BigInt(session.user.id) },
        include: { stores: true }
      });
      
      if (!vendor || vendor.stores.length === 0) {
        return NextResponse.json({ error: 'Aucune boutique trouvée' }, { status: 404 });
      }
      
      where.storeId = { in: vendor.stores.map(store => store.id) };
    }

    const product = await prisma.product.findFirst({ where });
    if (!product) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 });
    }

    // Delete product from database
    await prisma.product.delete({
      where: { id: productId }
    });

    return NextResponse.json({
      message: 'Produit supprimé avec succès',
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
