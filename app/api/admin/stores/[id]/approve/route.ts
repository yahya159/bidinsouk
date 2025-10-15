import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { ActivityLogger } from '@/lib/admin/activity-logger';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;

    const session = await getServerSession(authConfig);

    // Vérifier que l'utilisateur est un administrateur
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const storeId = BigInt(params.id);

    // Vérifier que la boutique existe et est en attente
    const store = await prisma.store.findUnique({
      where: { 
        id: storeId,
        status: 'PENDING'
      }
    });

    if (!store) {
      return NextResponse.json({ error: 'Boutique non trouvée ou déjà traitée' }, { status: 404 });
    }

    // Approuver la boutique (changer le statut en ACTIVE)
    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: { 
        status: 'ACTIVE',
      }
    });

    // Log activity
    const activityLogger = new ActivityLogger();
    await activityLogger.log(
      BigInt(session.user.id),
      {
        action: 'STORE_APPROVED',
        entity: 'Store',
        entityId: storeId,
        metadata: {
          storeName: store.name,
          previousStatus: 'PENDING',
          newStatus: 'ACTIVE',
        },
      },
      request
    );

    // Optionnellement, vous pouvez envoyer une notification à l'utilisateur
    // await sendStoreApprovedNotification(store.sellerId)

    return NextResponse.json({ 
      message: 'Boutique approuvée avec succès',
      store: {
        ...updatedStore,
        id: updatedStore.id.toString(),
        sellerId: updatedStore.sellerId.toString()
      }
    });
  } catch (error: any) {
    console.error('Erreur lors de l\'approbation de la boutique:', error);
    
    if (error.message && error.message.includes('Invalid BigInt')) {
      return NextResponse.json({ error: 'ID de boutique invalide' }, { status: 400 });
    }
    
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'approbation de la boutique' },
      { status: 500 }
    );
  }
}
