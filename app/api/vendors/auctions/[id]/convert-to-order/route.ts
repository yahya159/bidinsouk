import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { convertAuctionToOrder } from '@/lib/services/auction-to-order';

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

    // Get the vendor
    const vendor = await prisma.vendor.findUnique({
      where: { userId: BigInt(session.user.id) }
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Profil vendeur non trouvé' }, { status: 404 });
    }

    // Convert auction to order
    const result = await convertAuctionToOrder(auctionId, vendor.id);

    return NextResponse.json({
      message: 'Commande créée avec succès',
      order: {
        id: result.order.id.toString(),
        number: result.order.number,
        total: Number(result.order.total),
        status: result.order.status,
        fulfillStatus: result.order.fulfillStatus,
        createdAt: result.order.createdAt.toISOString()
      },
      threadId: result.thread.id
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error converting auction to order:', error);
    
    if (error.message === 'Auction not found') {
      return NextResponse.json({ error: 'Enchère non trouvée' }, { status: 404 });
    }
    
    if (error.message === 'Auction is not ended') {
      return NextResponse.json({ error: 'L\'enchère n\'est pas terminée' }, { status: 400 });
    }
    
    if (error.message === 'No winner for this auction') {
      return NextResponse.json({ error: 'Aucun gagnant pour cette enchère' }, { status: 400 });
    }
    
    if (error.message === 'Unauthorized: Vendor does not own this auction') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    
    if (error.message === 'Order already exists for this auction') {
      return NextResponse.json({ error: 'Une commande existe déjà pour cette enchère' }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}