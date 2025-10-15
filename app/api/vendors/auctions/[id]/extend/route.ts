import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { extendAuction } from '@/lib/services/auction-extensions';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Check if user is vendor or admin
    if (session?.user?.role !== 'VENDOR' && session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const resolvedParams = await params;
    const auctionId = BigInt(resolvedParams.id);
    
    const body = await request.json();
    const { hours } = body;
    
    if (!hours || typeof hours !== 'number') {
      return NextResponse.json({ error: 'Nombre d\'heures requis' }, { status: 400 });
    }

    // Get the auction and verify ownership
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: { store: true }
    });

    if (!auction) {
      return NextResponse.json({ error: 'Enchère non trouvée' }, { status: 404 });
    }

    // Verify the vendor owns this auction
    const vendor = await prisma.vendor.findUnique({
      where: { userId: BigInt(session.user.id) }
    });

    if (!vendor || auction.store.sellerId !== vendor.id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Extend the auction
    const extendMinutes = Math.round(hours * 60);
    const updatedAuction = await extendAuction(auctionId, extendMinutes);

    return NextResponse.json({
      message: `Enchère prolongée de ${hours} heures`,
      auction: {
        id: updatedAuction.id.toString(),
        endAt: updatedAuction.endAt.toISOString(),
        extensionCount: updatedAuction.extensionCount
      }
    });

  } catch (error: any) {
    console.error('Error extending auction:', error);
    
    if (error.message === 'Auction not found') {
      return NextResponse.json({ error: 'Enchère non trouvée' }, { status: 404 });
    }
    
    if (error.message === 'Auction is not active') {
      return NextResponse.json({ error: 'L\'enchère n\'est pas active' }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
