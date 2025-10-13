import { prisma } from '@/lib/db/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 20;
    const category = searchParams.get('category');
    const condition = searchParams.get('condition');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'newest';
    const priceMin = Number(searchParams.get('priceMin')) || 0;
    const priceMax = Number(searchParams.get('priceMax')) || 999999;

    // Build where clause
    const where: any = {
      status: 'ACTIVE'
    };

    if (category) {
      where.category = {
        contains: category
      };
    }

    if (condition) {
      where.condition = condition;
    }

    if (search) {
      where.title = {
        contains: search
      };
    }

    if (priceMin > 0 || priceMax < 999999) {
      where.price = {
        gte: priceMin,
        lte: priceMax
      };
    }

    // Build orderBy clause
    let orderBy: any = { createdAt: 'desc' };
    switch (sort) {
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'popular':
        orderBy = { createdAt: 'desc' }; // Fallback since we don't have views in DB yet
        break;
      case 'rating':
        orderBy = { createdAt: 'desc' }; // Fallback since we don't have ratings in DB yet
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    // Get products with pagination
    const skip = (page - 1) * limit;
    
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          store: {
            select: {
              name: true,
              slug: true
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.product.count({ where })
    ]);

    // Convert BigInt IDs to strings for JSON serialization
    const serializedProducts = products.map(product => ({
      ...product,
      id: product.id.toString(),
      storeId: product.storeId.toString(),
      price: product.price ? Number(product.price) : null,
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null
    }));

    const result = {
      products: serializedProducts,
      total,
      page,
      pages: Math.ceil(total / limit),
      hasMore: page * limit < total
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des produits' },
      { status: 500 }
    );
  }
}