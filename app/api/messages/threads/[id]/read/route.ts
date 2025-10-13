import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PUT - Marquer tous les messages d'un thread comme lus
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const threadId = params.id;

    // Vérifier que l'utilisateur est participant du thread
    const thread = await prisma.messageThread.findFirst({
      where: {
        id: threadId,
        participants: {
          some: {
            userId: session.user.id
          }
        }
      }
    });

    if (!thread) {
      return NextResponse.json(
        { error: 'Thread non trouvé' },
        { status: 404 }
      );
    }

    // Marquer tous les messages non lus comme lus pour cet utilisateur
    const updatedMessages = await prisma.message.updateMany({
      where: {
        threadId,
        senderId: { not: session.user.id }, // Ne pas marquer ses propres messages
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      updatedCount: updatedMessages.count
    });

  } catch (error) {
    console.error('Erreur PUT /api/messages/threads/[id]/read:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}