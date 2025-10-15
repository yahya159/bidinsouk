import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig as authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { isAdmin } from '@/lib/admin/permissions';
import { ActivityLogger } from '@/lib/admin/activity-logger';
import { ProductCondition, ProductStatus } from '@prisma/client';

// GET /api/admin/products - List products with pagination, search, and filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const storeId = searchParams.get('storeId');
    const category = searchParams.get('category');
    const status = searchParams.get('status') as ProductStatus | null;
    const condition = searchParams.get('condition') as ProductCondition | null;
    const priceMin = searchParams.get('priceMin');
    const priceMax = searchParams.get('priceMax');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { brand: { contains: search } },
      ];
    }

    if (storeId) {
      where.storeId = BigInt(storeId);
    }

    if (category) {
      where.category = category;
    }

    if (status) {
      where.status = status;
    }

    if (condition) {
      where.condition = condition;
    }

    if (priceMin || priceMax) {
      where.price = {};
      if (priceMin) {
        where.price.gte = parseFloat(priceMin);
      }
      if (priceMax) {
        where.price.lte = parseFloat(priceMax);
      }
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: pageSize,
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
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST endpoint removed - Admins cannot create products
// Products should only be created by vendors through their own dashboard
