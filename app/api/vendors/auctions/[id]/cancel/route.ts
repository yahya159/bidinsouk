import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

// Validation schema for auction cancellation
const cancelAuctionSchema = z.object({
  reason: z.string().min(1).max(500),
  refundBidders: z.boolean().default(true),
  notifyBidders: z.boolean().default(true),
});

// POST /api/vendors/auctions/[id]/cancel - Cancel auction
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const auctionId = parseInt(params.id);
    
    if (isNaN(auctionId)) {
      return NextResponse.json(
        { error: 'ID d\'enchère invalide' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { reason, refundBidders, notifyBidders } = cancelAuctionSchema.parse(body);

    // Get existing auction to check permissions and status
    const existingAuction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        store: {
          select: {
            userId: true,
            name: true,
          }
        },
        bids: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' }
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
    const isOwner = existingAuction.store.userId === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      );
    }

    // Business rule validations
    if (existingAuction.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Cette enchère est déjà annulée' },
        { status: 400 }
      );
    }

    if (existingAuction.status === 'ENDED') {
      return NextResponse.json(
        { error: 'Impossible d\'annuler une enchère terminée' },
        { status: 400 }
      );
    }

    const now = new Date();
    const hasBids = existingAuction._count.bids > 0;
    
    // Additional validation for auctions with bids
    if (hasBids && !isAdmin) {
      // Check if auction is close to ending (within 1 hour)
      const timeRemaining = existingAuction.endTime.getTime() - now.getTime();
      const oneHour = 60 * 60 * 1000;
      
      if (timeRemaining <= oneHour && timeRemaining > 0) {
        return NextResponse.json(
          { 
            error: 'Impossible d\'annuler une enchère avec des mises dans la dernière heure',
            timeRemaining: Math.max(0, timeRemaining)
          },
          { status: 400 }
        );
      }
    }

    // Start transaction for cancellation
    const result = await prisma.$transaction(async (tx) => {
      // Update auction status
      const cancelledAuction = await tx.auction.update({
        where: { id: auctionId },
        data: {
          status: 'CANCELLED',
          updatedAt: now,
        }
      });

      // Log the cancellation activity
      if (tx.auctionActivity) {
        await tx.auctionActivity.create({
          data: {
            auctionId: auctionId,
            userId: session.user.id,
            action: 'CANCELLED',
            details: {
              reason: reason,
              cancelledBy: isAdmin ? 'admin' : 'vendor',
              hadBids: hasBids,
              bidCount: existingAuction._count.bids,
              refundBidders: refundBidders,
              notifyBidders: notifyBidders,
              timeRemaining: Math.max(0, existingAuction.endTime.getTime() - now.getTime()),
            }
          }
        }).catch(console.error);
      }

      return cancelledAuction;
    });

    // Prepare response data
    const uniqueBidders = new Set(existingAuction.bids.map((bid: any) => bid.userId));
    const affectedBidders = Array.from(uniqueBidders).map((userId: any) => {
      const bidder = existingAuction.bids.find((bid: any) => bid.userId === userId);
      return {
        id: userId,
        name: bidder?.user.name,
        email: bidder?.user.email,
        highestBid: Math.max(...existingAuction.bids
          .filter((bid: any) => bid.userId === userId)
          .map((bid: any) => bid.amount)
        )
      };
    });

    // TODO: Implement actual refund and notification logic
    // This would typically involve:
    // 1. Processing refunds through payment gateway
    // 2. Sending email notifications to bidders
    // 3. Creating notification records in the database
    
    const response = {
      message: 'Enchère annulée avec succès',
      auction: {
        id: result.id,
        title: existingAuction.title,
        status: result.status,
        updatedAt: result.updatedAt,
        cancellationReason: reason,
      },
      impact: {
        totalBids: existingAuction._count.bids,
        uniqueBidders: uniqueBidders.size,
        affectedBidders: hasBids ? affectedBidders.length : 0,
        refundsToProcess: refundBidders && hasBids ? affectedBidders.length : 0,
        notificationsToSend: notifyBidders && hasBids ? affectedBidders.length : 0,
      },
      actions: {
        refundBidders: refundBidders && hasBids,
        notifyBidders: notifyBidders && hasBids,
      }
    };

    // If there are bidders and notifications are requested, add them to response
    if (hasBids && (refundBidders || notifyBidders)) {
      (response as any).affectedUsers = affectedBidders.map((bidder: any) => ({
        id: bidder.id,
        name: isAdmin ? bidder.name : `Utilisateur ${bidder.id.toString().slice(-4)}`,
        highestBid: bidder.highestBid,
        needsRefund: refundBidders,
        needsNotification: notifyBidders,
      }));
    }

    return NextResponse.json(response);

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

    console.error('Error cancelling auction:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}