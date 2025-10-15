import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

// Validation schemas
const createProductSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(200, 'Le titre ne peut pas dépasser 200 caractères'),
  description: z.string().min(1, 'La description est requise').max(2000, 'La description ne peut pas dépasser 2000 caractères').optional(),
  images: z.array(z.string().url('URL d\'image invalide')).min(1, 'Au moins une image est requise').max(10, 'Maximum 10 images autorisées').optional(),
  category: z.string().min(1, 'La catégorie est requise'),
  price: z.number().min(0.01, 'Le prix doit être supérieur à 0').max(1000000, 'Prix trop élevé').optional(),
  compareAtPrice: z.number().min(0).max(1000000).optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  trackQuantity: z.boolean().optional().default(false),
  quantity: z.number().min(0).optional().default(0),
  allowBackorder: z.boolean().optional().default(false),
  weight: z.number().min(0).optional(),
  dimensions: z.object({
    length: z.number().min(0).optional(),
    width: z.number().min(0).optional(),
    height: z.number().min(0).optional(),
  }).optional(),
  tags: z.array(z.string()).optional().default([]),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional().default('DRAFT'),
  variants: z.array(z.object({
    name: z.string(),
    values: z.array(z.string()),
  })).optional().default([]),
});

const querySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  search: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
  category: z.string().optional(),
  sortBy: z.enum(['createdAt', 'title', 'price', 'status']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Empty products array - ready for new products
let mockProducts: any[] = [];

// GET /api/vendors/products - List products with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Check if user is vendor or admin
    if (session?.user?.role !== 'VENDOR' && session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const query = querySchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      category: searchParams.get('category') || undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    });

    const page = parseInt(query.page);
    const limit = parseInt(query.limit);
    const offset = (page - 1) * limit;

    // Get user ID for database operations
    const userId = BigInt(session.user.id);
    const isAdminUser = session.user.role === 'ADMIN';

    try {
      // Build where clause for filtering
      const whereClause: any = {};

      // If not admin, restrict to user's store
      if (!isAdminUser) {
        // Find user's store
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            vendor: {
              include: {
                stores: true
              }
            }
          }
        });

        if (!user) {
          return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
        }

        // Check if vendor profile exists
        const vendor = user.vendor;
        if (!vendor) {
          return NextResponse.json(
            { 
              error: 'Vendor profile required',
              message: 'Please complete vendor application first'
            },
            { status: 403 }
          );
        }

        // Check if vendor has at least one active store
        const activeStore = vendor.stores.find(s => s.status === 'ACTIVE');
        if (!activeStore) {
          return NextResponse.json(
            { 
              error: 'Active store required',
              message: 'Please create and get approval for a store first'
            },
            { status: 403 }
          );
        }

        // Restrict to vendor's store
        whereClause.storeId = activeStore.id;
      }
      // Admin can see all products, no storeId restriction

      // Search filter
      if (query.search) {
        whereClause.OR = [
          { title: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
          { category: { contains: query.search, mode: 'insensitive' } }
        ];
      }

      // Status filter
      if (query.status) {
        whereClause.status = query.status;
      }

      // Category filter
      if (query.category) {
        whereClause.category = query.category;
      }

      // Get total count for pagination
      const totalCount = await prisma.product.count({ where: whereClause });
      const totalPages = Math.ceil(totalCount / limit);

      // Get products with pagination and sorting
      // @ts-ignore - TypeScript doesn't recognize all Product properties correctly
      const products = await prisma.product.findMany({
        where: whereClause,
        orderBy: {
          [query.sortBy]: query.sortOrder
        },
        skip: offset,
        take: limit,
      });

      // Calculate statistics
      // @ts-ignore - TypeScript doesn't recognize all Product properties correctly
      const statsWhereClause = isAdminUser ? {} : { storeId: whereClause.storeId };
      const allProducts = await prisma.product.findMany({
        where: statsWhereClause,
      });

      const stats = {
        totalProducts: allProducts.length,
        activeProducts: allProducts.filter((p: any) => p.status === 'ACTIVE').length,
        draftProducts: allProducts.filter((p: any) => p.status === 'DRAFT').length,
        archivedProducts: allProducts.filter((p: any) => p.status === 'ARCHIVED').length,
        totalValue: allProducts.reduce((sum: number, p: any) => sum + Number(p.price || 0), 0),
        lowStockProducts: 0, // Will implement inventory tracking later
      };

      // Transform products to match expected format
      const transformedProducts = products.map((product: any) => ({
        id: product.id.toString(),
        title: product.title,
        description: product.description || '',
        images: (product.images as string[]) || ['https://placehold.co/400x400'],
        category: product.category || '',
        price: Number(product.price || 0),
        compareAtPrice: Number(product.compareAtPrice || 0),
        sku: product.sku || '',
        stock: 0, // Will implement inventory tracking later
        status: product.status,
        condition: product.condition || 'USED',
        views: product.views || 0,
        storeId: product.storeId.toString(),
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt ? product.updatedAt.toISOString() : product.createdAt.toISOString(),
      }));

      return NextResponse.json({
        products: transformedProducts,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        stats,
      });

    } catch (dbError) {
      console.error('Database error:', dbError);
      // Fallback to mock data if database fails
      return NextResponse.json({
        products: mockProducts.slice(offset, offset + limit),
        pagination: {
          page,
          limit,
          totalCount: mockProducts.length,
          totalPages: Math.ceil(mockProducts.length / limit),
          hasNext: page < Math.ceil(mockProducts.length / limit),
          hasPrev: page > 1,
        },
        stats: {
          totalProducts: mockProducts.length,
          activeProducts: mockProducts.filter((p: any) => p.status === 'ACTIVE').length,
          draftProducts: mockProducts.filter((p: any) => p.status === 'DRAFT').length,
          archivedProducts: mockProducts.filter((p: any) => p.status === 'ARCHIVED').length,
          totalValue: mockProducts.reduce((sum: number, p: any) => sum + (p.price || 0), 0),
          lowStockProducts: 0,
        },
      });
    }

  } catch (error) {
    console.error('Error fetching products:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Paramètres de requête invalides', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// POST /api/vendors/products - Create new product
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Check if user is vendor or admin
    if (session?.user?.role !== 'VENDOR' && session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createProductSchema.parse(body);

    // Get user ID for database operations
    const userId = BigInt(session.user.id);

    try {
      // Find user with vendor profile and stores
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          vendor: {
            include: {
              stores: true
            }
          }
        }
      });

      if (!user) {
        return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
      }

      // Check if vendor profile exists
      const vendor = user.vendor;
      if (!vendor) {
        return NextResponse.json(
          { 
            error: 'Vendor profile required',
            message: 'Please complete vendor application first'
          },
          { status: 403 }
        );
      }

      // Check if vendor has at least one active store
      const activeStore = vendor.stores.find(s => s.status === 'ACTIVE');
      if (!activeStore) {
        return NextResponse.json(
          { 
            error: 'Active store required',
            message: 'Please create and get approval for a store first'
          },
          { status: 403 }
        );
      }

      const storeId = activeStore.id;

      // Create product in database
      const newProduct = await prisma.product.create({
        data: {
          storeId: storeId,
          title: validatedData.title,
          description: validatedData.description,
          category: validatedData.category,
          price: validatedData.price,
          compareAtPrice: validatedData.compareAtPrice,
          sku: validatedData.sku,
          barcode: validatedData.barcode,
          images: validatedData.images,
          tags: validatedData.tags,
          seoData: {
            title: validatedData.seoTitle,
            description: validatedData.seoDescription,
          },
          variants: validatedData.variants,
          inventory: {
            trackQuantity: validatedData.trackQuantity,
            quantity: validatedData.quantity,
            allowBackorder: validatedData.allowBackorder,
            weight: validatedData.weight,
            dimensions: validatedData.dimensions,
          },
          status: validatedData.status,
          condition: 'USED', // Default condition
        }
      });
      
      // Get the created product
      // @ts-ignore - TypeScript doesn't recognize all Product properties correctly
      const createdProduct = await prisma.product.findFirst({
        where: {
          storeId: storeId,
          title: validatedData.title,
        },
        orderBy: {
          createdAt: 'desc'
        },
        // @ts-ignore - Ignore fields that don't exist in the database
        select: {
          id: true,
          title: true,
          category: true,
          status: true,
          storeId: true,
          createdAt: true,
        }
      });
      
      if (!createdProduct) {
        throw new Error('Failed to create product');
      }

      // Transform to expected format
      const transformedProduct = {
        id: newProduct.id.toString(),
        title: newProduct.title,
        description: newProduct.description || '',
        images: (newProduct.images as string[]) || ['https://placehold.co/400x400'],
        category: newProduct.category || '',
        price: Number(newProduct.price || 0),
        compareAtPrice: Number(newProduct.compareAtPrice || 0),
        sku: newProduct.sku || '',
        stock: 0, // Will implement inventory tracking later
        status: newProduct.status,
        condition: newProduct.condition || 'USED',
        views: newProduct.views || 0,
        storeId: newProduct.storeId.toString(),
        createdAt: newProduct.createdAt.toISOString(),
        updatedAt: newProduct.updatedAt ? newProduct.updatedAt.toISOString() : newProduct.createdAt.toISOString(),
      };

      return NextResponse.json(
        { 
          message: 'Produit créé avec succès',
          product: transformedProduct 
        },
        { status: 201 }
      );

    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({
        error: 'Erreur lors de la création en base de données',
        details: dbError instanceof Error ? dbError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error creating product:', error);
    
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
