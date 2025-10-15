import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const auctionId = id;
    
    // Fetch auction with related data
    const auction = await prisma.auction.findUnique({
      where: { id: BigInt(auctionId) },
      include: {
        product: {
          include: {
            store: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        bids: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            client: {
              include: {
                user: {
                  select: {
                    name: true,
                    avatarUrl: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!auction) {
      return NextResponse.json({ error: 'Enchère non trouvée' }, { status: 404 });
    }

    // Normalize images to always be an array of objects with url property
    let formattedImages: Array<{ url: string }> = [];
    if (auction.images) {
      const imagesData = auction.images as any;
      if (Array.isArray(imagesData)) {
        // If it's already an array, map to ensure correct format
        formattedImages = imagesData.map((img: any) => {
          if (typeof img === 'string') {
            return { url: img };
          }
          return { url: img.url || img };
        });
      } else if (typeof imagesData === 'string') {
        // If it's a single URL string
        formattedImages = [{ url: imagesData }];
      }
    }
    
    // Fallback to placeholder if no images
    if (formattedImages.length === 0) {
      formattedImages = [{ url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800' }];
    }

    // Convert BigInt values to strings and format the response
    const formattedAuction = {
      id: auction.id.toString(),
      title: auction.title,
      description: auction.product?.description || 'Description non disponible',
      images: formattedImages,
      category: auction.product?.category || 'Autre',
      condition: auction.product?.condition || 'USED',
      startPrice: parseFloat(auction.startPrice.toString()),
      reservePrice: auction.reservePrice ? parseFloat(auction.reservePrice.toString()) : 0,
      currentBid: parseFloat(auction.currentBid.toString()),
      minIncrement: parseFloat(auction.minIncrement.toString()),
      startAt: auction.startAt.toISOString(),
      endAt: auction.endAt.toISOString(),
      status: auction.status,
      bidsCount: auction.bids.length,
      watchers: 0, // TODO: Implement watchers functionality
      seller: {
        id: auction.product?.store?.id?.toString() || '',
        name: auction.product?.store?.name || 'Vendeur anonyme',
        email: auction.product?.store?.email || ''
      },
      bids: auction.bids.map(bid => ({
        id: bid.id.toString(),
        amount: parseFloat(bid.amount.toString()),
        createdAt: bid.createdAt.toISOString(),
        bidder: {
          name: bid.client?.user?.name || 'Enchérisseur anonyme',
          avatar: bid.client?.user?.avatarUrl || null
        }
      }))
    };

    return NextResponse.json(formattedAuction);
  } catch (error) {
    console.error('Error fetching auction:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'enchère' },
      { status: 500 }
    );
  }
}
