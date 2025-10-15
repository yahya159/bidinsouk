import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { successResponse, ErrorResponses } from '@/lib/api/responses';
import { getProductRatingStats, getStoreRatingStats, getProductReviews } from '@/lib/services/reviews';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;

    // Fetch product with related data
    const product = await prisma.product.findUnique({
      where: { id: BigInt(productId) },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            logo: true,
          }
        },
        productImages: true,
        _count: {
          select: {
            reviews: true,
          }
        }
      }
    });

    if (!product) {
      return ErrorResponses.notFound('Product');
    }

    // Get rating stats and reviews
    const [ratingStats, storeRatingStats, reviewsData] = await Promise.all([
      getProductRatingStats(product.id),
      product.store ? getStoreRatingStats(product.store.id) : Promise.resolve({ average: 0, total: 0 }),
      getProductReviews(product.id, { status: 'APPROVED', limit: 10 })
    ]);

    // Format response
    const response = {
      id: product.id.toString(),
      title: product.title,
      description: product.description,
      price: product.price,
      category: product.category || 'Non classé',
      condition: product.condition,
      images: product.productImages?.map(img => ({
        url: img.url,
        alt: img.altText || product.title,
      })) || [],
      inventory: product.inventory,
      store: {
        id: product.store?.id.toString(),
        name: product.store?.name || 'Boutique inconnue',
        rating: storeRatingStats.average,
        logo: product.store?.logo,
      },
      tags: product.tags || [],
      rating: ratingStats.average,
      ratingDistribution: ratingStats.distribution,
      reviewsCount: product._count.reviews,
      reviews: reviewsData.reviews.map(review => ({
        id: review.id.toString(),
        rating: review.rating,
        body: review.body,
        photos: review.photos,
        verified: review.verified,
        createdAt: review.createdAt.toISOString(),
        user: {
          name: review.client.user.name,
          avatarUrl: review.client.user.avatarUrl
        }
      })),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };

    return successResponse({ data: response });

  } catch (error) {
    logger.error('Failed to fetch product details', error);
    return ErrorResponses.serverError('Failed to fetch product details', error);
  }
}