import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { auctionId } = body;

    if (!auctionId) {
      return NextResponse.json({ error: 'ID d\'enchère requis' }, { status: 400 });
    }

    // Get client profile
    const client = await prisma.client.findUnique({
      where: { userId: BigInt(session.user.id) }
    });

    if (!client) {
      return NextResponse.json({ error: 'Profil client requis' }, { status: 403 });
    }

    // Get the auction and verify it's ended and the user is the winner
    const auction = await prisma.auction.findUnique({
      where: { id: BigInt(auctionId) },
      include: {
        store: true,
        product: true
      }
    });

    if (!auction) {
      return NextResponse.json({ error: 'Enchère non trouvée' }, { status: 404 });
    }

    if (auction.status !== 'ENDED') {
      return NextResponse.json({ error: 'L\'enchère n\'est pas encore terminée' }, { status: 400 });
    }

    if (!auction.winnerId || auction.winnerId !== client.id) {
      return NextResponse.json({ error: 'Vous n\'êtes pas le gagnant de cette enchère' }, { status: 403 });
    }

    // Check if an order already exists for this auction
    const existingOrder = await prisma.order.findFirst({
      where: { 
        userId: client.id,
        storeId: auction.storeId
      }
    });

    if (existingOrder) {
      return NextResponse.json({ 
        error: 'Une commande existe déjà pour cette enchère',
        orderId: existingOrder.id.toString()
      }, { status: 400 });
    }

    // Create the order
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const order = await prisma.order.create({
      data: {
        userId: client.id,
        storeId: auction.storeId,
        number: orderNumber,
        total: auction.currentBid,
        status: 'CONFIRMED',
        fulfillStatus: 'PENDING'
      }
    });

    // Create a message thread between buyer and seller
    const thread = await prisma.messageThread.create({
      data: {
        type: 'VENDOR_CHAT',
        subject: `Commande #${orderNumber} - ${auction.product?.title || auction.title}`,
        status: 'OPEN',
        priority: 'NORMAL',
        productId: auction.productId,
        orderId: order.id,
        participants: {
          create: [
            {
              userId: client.userId,
              role: 'USER'
            },
            {
              userId: auction.store.sellerId,
              role: 'VENDOR'
            }
          ]
        }
      }
    });

    return NextResponse.json({
      message: 'Commande créée avec succès',
      order: {
        id: order.id.toString(),
        number: order.number,
        total: Number(order.total),
        status: order.status,
        fulfillStatus: order.fulfillStatus,
        createdAt: order.createdAt.toISOString()
      },
      threadId: thread.id
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating order from auction:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la commande' },
      { status: 500 }
    );
  }
}
