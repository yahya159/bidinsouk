import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { placeBid } from '@/lib/services/bids';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { auctionId, amount } = body;

    // Validation
    if (!auctionId || !amount || typeof amount !== 'number') {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Get client ID
    const client = await prisma.client.findUnique({
      where: { userId: BigInt(session.user.id) }
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client profile required' },
        { status: 403 }
      );
    }

    // Place the bid using the service
    const result = await placeBid(
      Number(auctionId),
      Number(client.id),
      amount
    );

    return NextResponse.json({
      success: true,
      bid: {
        id: result.bid.id.toString(),
        bidder: {
          id: session.user.id,
          displayName: session.user.name,
          avatarUrl: null // Would need to get from user profile
        },
        amount,
        placedAtISO: result.bid.createdAt.toISOString()
      },
      newCurrentBid: Number(result.updatedAuction.currentBid)
    });

  } catch (error: any) {
    console.error('Error placing bid:', error);
    
    if (error.message === 'Auction not found') {
      return NextResponse.json(
        { error: 'Enchère non trouvée' },
        { status: 404 }
      );
    }
    
    if (error.message === 'Auction is not running') {
      return NextResponse.json(
        { error: 'Cette enchère n\'est pas active' },
        { status: 400 }
      );
    }
    
    if (error.message === 'Auction has ended') {
      return NextResponse.json(
        { error: 'Cette enchère est terminée' },
        { status: 400 }
      );
    }
    
    if (error.message.startsWith('Bid must be at least')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
