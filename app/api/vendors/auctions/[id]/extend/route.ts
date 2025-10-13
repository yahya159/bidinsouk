import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

// Validation schema for auction extension
const extendAuctionSchema = z.object({
  hours: z.number().min(1).max(168), // 1 hour to 7 days
  reason: z.string().optional(),
});

// POST /api/vendors/auctions/[id]/extend - Extend auction duration
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
    const { hours, reason } = extendAuctionSchema.parse(body);

    // Get existing auction to check permissions and status
    const existingAuction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        store: {
          select: {
            userId: true,
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
    const isOwner = existingAuction.store.userId === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      );
    }

    // Business rule validations
    if (existingAuction.status !== 'ACTIVE' && existingAuction.status !== 'ENDING_SOON') {
      return NextResponse.json(
        { 
          error: 'Seules les enchères actives peuvent être prolongées',
          currentStatus: existingAuction.status 
        },
        { status: 400 }
      );
    }

    const now = new Date();
    const currentEndTime = existingAuction.endTime;
    
    // Check if auction has already ended
    if (currentEndTime <= now) {
      return NextResponse.json(
        { error: 'Impossible de prolonger une enchère déjà terminée' },
        { status: 400 }
      );
    }

    // Calculate new end time
    const extensionMilliseconds = hours * 60 * 60 * 1000;
    const newEndTime = new Date(currentEndTime.getTime() + extensionMilliseconds);

    // Validate maximum auction duration (e.g., 30 days total)
    const maxDurationDays = 30;
    const maxEndTime = new Date(existingAuction.startTime.getTime() + (maxDurationDays * 24 * 60 * 60 * 1000));
    
    if (newEndTime > maxEndTime) {
      return NextResponse.json(
        { 
          error: `La durée totale de l'enchère ne peut pas dépasser ${maxDurationDays} jours`,
          maxEndTime: maxEndTime.toISOString()
        },
        { status: 400 }
      );
    }

    // Check extension limits (e.g., maximum 3 extensions per auction)
    const extensionCount = await prisma.auctionActivity?.count({
      where: {
        auctionId: auctionId,
        action: 'EXTENDED'
      }
    }).catch(() => 0) || 0;

    const maxExtensions = 3;
    if (extensionCount >= maxExtensions) {
      return NextResponse.json(
        { 
          error: `Nombre maximum d'extensions atteint (${maxExtensions})`,
          currentExtensions: extensionCount
        },
        { status: 400 }
      );
    }

    // Update the auction
    const updatedAuction = await prisma.auction.update({
      where: { id: auctionId },
      data: {
        endTime: newEndTime,
        duration: existingAuction.duration + hours,
        updatedAt: now,
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

    // Log the extension activity
    if (prisma.auctionActivity) {
      await prisma.auctionActivity.create({
        data: {
          auctionId: auctionId,
          userId: session.user.id,
          action: 'EXTENDED',
          details: {
            hoursAdded: hours,
            previousEndTime: currentEndTime.toISOString(),
            newEndTime: newEndTime.toISOString(),
            reason: reason || 'Extension requested by vendor',
            extensionNumber: extensionCount + 1,
          }
        }
      }).catch(console.error);
    }

    // Calculate time remaining
    const timeRemaining = newEndTime.getTime() - now.getTime();
    const isEndingSoon = timeRemaining > 0 && timeRemaining <= 24 * 60 * 60 * 1000; // 24 hours

    // Update auction status if needed
    let finalStatus = updatedAuction.status;
    if (isEndingSoon && updatedAuction.status === 'ACTIVE') {
      finalStatus = 'ENDING_SOON';
      await prisma.auction.update({
        where: { id: auctionId },
        data: { status: 'ENDING_SOON' }
      });
    } else if (!isEndingSoon && updatedAuction.status === 'ENDING_SOON') {
      finalStatus = 'ACTIVE';
      await prisma.auction.update({
        where: { id: auctionId },
        data: { status: 'ACTIVE' }
      });
    }

    const response = {
      message: 'Enchère prolongée avec succès',
      auction: {
        id: updatedAuction.id,
        title: updatedAuction.title,
        endTime: newEndTime,
        duration: updatedAuction.duration,
        status: finalStatus,
        bidCount: updatedAuction._count.bids,
        updatedAt: updatedAuction.updatedAt,
      },
      extension: {
        hoursAdded: hours,
        previousEndTime: currentEndTime,
        newEndTime: newEndTime,
        timeRemaining: Math.max(0, timeRemaining),
        extensionNumber: extensionCount + 1,
        remainingExtensions: maxExtensions - (extensionCount + 1),
      }
    };

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

    console.error('Error extending auction:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}