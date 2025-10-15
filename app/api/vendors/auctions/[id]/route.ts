import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

// Validation schema for auction updates
const updateAuctionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(2000).optional(),
  images: z.array(z.string().url()).optional(),
  category: z.string().min(1).optional(),
  startPrice: z.number().positive().optional(),
  reservePrice: z.number().positive().optional(),
  duration: z.number().min(1).max(168).optional(), // 1 hour to 7 days
  endAt: z.string().datetime().optional(),
  status: z.enum(['SCHEDULED', 'RUNNING', 'ENDING_SOON', 'ENDED', 'ARCHIVED']).optional(),
});

// GET /api/vendors/auctions/[id] - Get auction details with bid history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const auctionId = BigInt(id);
    
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: 'ID d\'enchère invalide' },
        { status: 400 }
      );
    }

    // Get auction with related data
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            seller: {
              select: {
                userId: true,
              }
            }
          }
        },
        bids: {
          orderBy: { createdAt: 'desc' },
          take: 50, // Last 50 bids
          include: {
            client: {
              select: {
                id: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            bids: true,
          }
        }
      }
    });

    if (!auction) {
      return NextResponse.json(
        { error: 'Enchère non trouvée' },
        { status: 404 }
      );
    }

    // Check access permissions
    const isOwner = auction.store.seller.userId.toString() === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      );
    }

    // Anonymize bidder information for privacy
    const anonymizedBids = auction.bids.map((bid: any) => ({
      id: bid.id,
      amount: bid.amount,
      createdAt: bid.createdAt,
      isAuto: bid.isAuto,
      bidder: {
        id: isAdmin ? bid.client.user.id : 'anonymous',
        name: isAdmin ? bid.client.user.name : `Utilisateur ${bid.client.user.id.toString().slice(-4)}`,
        email: isAdmin ? bid.client.user.email : null,
      }
    }));

    // Calculate auction statistics
    const now = new Date();
    const timeRemaining = auction.endAt.getTime() - now.getTime();
    const isEndingSoon = timeRemaining > 0 && timeRemaining <= 24 * 60 * 60 * 1000; // 24 hours

    const auctionDetails = {
      id: auction.id,
      title: auction.title,
      description: auction.description,
      images: auction.images,
      category: auction.category,
      startPrice: auction.startPrice,
      reservePrice: auction.reservePrice,
      currentBid: auction.currentBid,
      bidCount: auction._count.bids,
      status: auction.status,
      startAt: auction.startAt,
      endAt: auction.endAt,
      duration: auction.duration,
      views: auction.views,
      watchers: auction.watchers,
      store: {
        id: auction.store.id,
        name: auction.store.name,
      },
      createdAt: auction.createdAt,
      updatedAt: auction.updatedAt,
      bids: anonymizedBids,
      statistics: {
        totalBids: auction._count.bids,
        uniqueBidders: new Set(auction.bids.map((bid: any) => bid.clientId)).size,
        averageBidAmount: auction.bids.length > 0 
          ? auction.bids.reduce((sum: number, bid: any) => sum + Number(bid.amount), 0) / auction.bids.length 
          : 0,
        timeRemaining: Math.max(0, timeRemaining),
        isEndingSoon,
        views: auction.views,
        watchers: auction.watchers,
      }
    };

    return NextResponse.json(auctionDetails);

  } catch (error) {
    console.error('Error fetching auction details:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// PUT /api/vendors/auctions/[id] - Update auction information
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const auctionId = BigInt(id);
    
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: 'ID d\'enchère invalide' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateAuctionSchema.parse(body);

    // Get existing auction to check permissions and status
    const existingAuction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        store: {
          select: {
            seller: {
              select: {
                userId: true,
              }
            }
          }
        },
        _count: {
          select: {
            bids: true,
          }
        }
      }
    });

    if (!existingAuction) {
      return NextResponse.json(
        { error: 'Enchère non trouvée' },
        { status: 404 }
      );
    }

    // Check access permissions
    const isOwner = existingAuction.store.seller.userId.toString() === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      );
    }

    // Business rule validations
    if (existingAuction.status === 'RUNNING' && existingAuction._count.bids > 0) {
      // Restrict what can be updated for active auctions with bids
      const allowedFields = ['description', 'endTime'];
      const attemptedFields = Object.keys(validatedData);
      const invalidFields = attemptedFields.filter(field => !allowedFields.includes(field));
      
      if (invalidFields.length > 0) {
        return NextResponse.json(
          { 
            error: 'Impossible de modifier ces champs pour une enchère active avec des mises',
            invalidFields 
          },
          { status: 400 }
        );
      }
    }

    if (existingAuction.status === 'ENDED' || existingAuction.status === 'ARCHIVED') {
      return NextResponse.json(
        { error: 'Impossible de modifier une enchère terminée ou annulée' },
        { status: 400 }
      );
    }

    // Validate reserve price if provided
    if (validatedData.reservePrice && validatedData.startPrice) {
      if (validatedData.reservePrice < validatedData.startPrice) {
        return NextResponse.json(
          { error: 'Le prix de réserve doit être supérieur ou égal au prix de départ' },
          { status: 400 }
        );
      }
    }

    // Validate end time if provided
    if (validatedData.endAt) {
      const newEndTime = new Date(validatedData.endAt);
      const now = new Date();
      
      if (newEndTime <= now) {
        return NextResponse.json(
          { error: 'La date de fin doit être dans le futur' },
          { status: 400 }
        );
      }

      // Minimum extension of 1 hour for active auctions
      if (existingAuction.status === 'RUNNING') {
        const minEndTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
        if (newEndTime < minEndTime) {
          return NextResponse.json(
            { error: 'L\'enchère doit être prolongée d\'au moins 1 heure' },
            { status: 400 }
          );
        }
      }
    }

    // Update the auction
    const updatedAuction = await prisma.auction.update({
      where: { id: auctionId },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
          }
        },
        _count: {
          select: {
            bids: true,
          }
        }
      }
    });

    // Log the activity
    if (prisma.auctionActivity) {
      await prisma.auctionActivity.create({
        data: {
          auctionId: BigInt(auctionId),
          userId: BigInt(session.user.id),
          activityType: 'UPDATED',
          metadata: {
            updatedFields: Object.keys(validatedData),
            changes: validatedData,
          }
        }
      }).catch(console.error);
    }

    return NextResponse.json({
      id: updatedAuction.id,
      title: updatedAuction.title,
      description: updatedAuction.description,
      images: updatedAuction.images,
      category: updatedAuction.category,
      startPrice: updatedAuction.startPrice,
      reservePrice: updatedAuction.reservePrice,
      currentBid: updatedAuction.currentBid,
      bidCount: updatedAuction._count.bids,
      status: updatedAuction.status,
      startAt: updatedAuction.startAt,
      endAt: updatedAuction.endAt,
      duration: updatedAuction.duration,
      store: updatedAuction.store,
      createdAt: updatedAuction.createdAt,
      updatedAt: updatedAuction.updatedAt,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Données invalides',
          details: error.issues 
        },
        { status: 400 }
      );
    }

    console.error('Error updating auction:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// DELETE /api/vendors/auctions/[id] - Cancel/archive auction
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const auctionId = parseInt(id);
    
    if (isNaN(auctionId)) {
      return NextResponse.json(
        { error: 'ID d\'enchère invalide' },
        { status: 400 }
      );
    }

    // Get existing auction to check permissions and status
    const existingAuction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        store: {
          select: {
            seller: {
              select: {
                userId: true,
              }
            }
          }
        },
        _count: {
          select: {
            bids: true,
          }
        }
      }
    });

    if (!existingAuction) {
      return NextResponse.json(
        { error: 'Enchère non trouvée' },
        { status: 404 }
      );
    }

    // Check access permissions
    const isOwner = existingAuction.store.seller.userId.toString() === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      );
    }

    // Business rule validations
    if (existingAuction.status === 'ENDED') {
      return NextResponse.json(
        { error: 'Impossible de supprimer une enchère terminée' },
        { status: 400 }
      );
    }

    if (existingAuction.status === 'ARCHIVED' || existingAuction.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Cette enchère est déjà annulée' },
        { status: 400 }
      );
    }

    // Check if auction has bids
    if (existingAuction._count.bids > 0) {
      // For auctions with bids, we cancel instead of delete
      const cancelledAuction = await prisma.auction.update({
        where: { id: auctionId },
        data: {
          status: 'CANCELLED',
          updatedAt: new Date(),
        }
      });

      // Log the cancellation
      if (prisma.auctionActivity) {
        await prisma.auctionActivity.create({
          data: {
            auctionId: BigInt(auctionId),
            userId: BigInt(session.user.id),
            activityType: 'CANCELLED',
            metadata: {
              reason: 'Cancelled by vendor',
              hadBids: true,
              bidCount: existingAuction._count.bids,
            }
          }
        }).catch(console.error);
      }

      return NextResponse.json({
        message: 'Enchère annulée avec succès',
        auction: {
          id: cancelledAuction.id,
          status: cancelledAuction.status,
          updatedAt: cancelledAuction.updatedAt,
        }
      });
    } else {
      // For draft or scheduled auctions without bids, we can actually delete
      if (existingAuction.status === 'DRAFT' || existingAuction.status === 'SCHEDULED') {
        await prisma.auction.delete({
          where: { id: auctionId }
        });

        return NextResponse.json({
          message: 'Enchère supprimée avec succès'
        });
      } else {
        // For scheduled/active auctions without bids, cancel them
        const cancelledAuction = await prisma.auction.update({
          where: { id: auctionId },
          data: {
            status: 'CANCELLED',
            updatedAt: new Date(),
          }
        });

        // Log the cancellation
        if (prisma.auctionActivity) {
          await prisma.auctionActivity.create({
            data: {
              auctionId: BigInt(auctionId),
              userId: BigInt(session.user.id),
              activityType: 'CANCELLED',
              metadata: {
                reason: 'Cancelled by vendor',
                hadBids: false,
              }
            }
          }).catch(console.error);
        }

        return NextResponse.json({
          message: 'Enchère annulée avec succès',
          auction: {
            id: cancelledAuction.id,
            status: cancelledAuction.status,
            updatedAt: cancelledAuction.updatedAt,
          }
        });
      }
    }

  } catch (error) {
    console.error('Error deleting/cancelling auction:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}