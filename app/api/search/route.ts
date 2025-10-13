import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const searchQuerySchema = z.object({
  q: z.string().min(1, 'Query is required'),
  type: z.enum(['all', 'auctions', 'products', 'stores']).optional().default('all'),
  limit: z.string().optional().default('20'),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchQuerySchema.parse({
      q: searchParams.get('q') || '',
      type: searchParams.get('type') || 'all',
      limit: searchParams.get('limit') || '20',
    });

    const searchTerm = query.q.toLowerCase();
    const limit = parseInt(query.limit);

    let results: any = {
      auctions: [],
      products: [],
      stores: [],
      total: 0
    };

    // Search Auctions
    if (query.type === 'all' || query.type === 'auctions') {
      const auctions = await prisma.auction.findMany({
        where: {
          title: { contains: searchTerm }
        },
        take: Math.floor(limit / 3),
        orderBy: { createdAt: 'desc' }
      });

      results.auctions = auctions.map(auction => ({
        id: auction.id.toString(),
        type: 'auction',
        title: auction.title,
        description: auction.description || '',
        category: auction.category || '',
        currentBid: parseFloat(auction.currentBid.toString()),
        endAt: auction.endAt.toISOString(),
        status: auction.status,
        url: `/auction/${auction.id}`
      }));
    }

    // Search Products
    if (query.type === 'all' || query.type === 'products') {
      const products = await prisma.product.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm } },
            { category: { contains: searchTerm } },
            { description: { contains: searchTerm } },
          ],
          status: 'ACTIVE'
        },
        take: Math.floor(limit / 3),
        orderBy: { createdAt: 'desc' }
      });

      results.products = products.map(product => ({
        id: product.id.toString(),
        type: 'product',
        title: product.title,
        description: product.description || '',
        category: product.category || '',
        condition: product.condition,
        store: '',
        url: `/products/${product.id}`
      }));
    }

    // Search Stores
    if (query.type === 'all' || query.type === 'stores') {
      const stores = await prisma.store.findMany({
        where: {
          name: { contains: searchTerm },
          status: 'ACTIVE'
        },
        take: Math.floor(limit / 3),
        orderBy: { createdAt: 'desc' }
      });

      results.stores = stores.map(store => ({
        id: store.id.toString(),
        type: 'store',
        title: store.name,
        description: '',
        email: store.email,
        url: `/stores/${store.slug || store.id}`
      }));
    }

    results.total = results.auctions.length + results.products.length + results.stores.length;

    // If searching for specific type, flatten results
    if (query.type !== 'all') {
      const flatResults = results[query.type] || [];
      return NextResponse.json({
        results: flatResults,
        total: flatResults.length,
        type: query.type
      });
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Search error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid search parameters', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}