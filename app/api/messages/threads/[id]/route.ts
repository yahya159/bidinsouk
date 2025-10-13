import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validation pour la mise à jour d'un thread
const updateThreadSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  subject: z.string().min(1).optional()
});

// GET - Récupérer un thread spécifique
export async function GET(
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
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        },
        vendor: {
          select: {
            id: true,
            storeName: true,
            user: {
              select: {
                name: true,
                image: true
              }
            }
          }
        },
        product: {
          select: {
            id: true,
            title: true,
            images: true
          }
        },
        order: {
          select: {
            id: true,
            reference: true
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

    // Formater les données
    const formattedThread = {
      id: thread.id,
      type: thread.type,
      subject: thread.subject,
      status: thread.status,
      priority: thread.priority,
      category: thread.category,
      lastMessageAt: thread.lastMessageAt,
      createdAt: thread.createdAt,
      participants: thread.participants.map(p => p.user),
      vendor: thread.vendor ? {
        id: thread.vendor.id,
        name: thread.vendor.user.name,
        storeName: thread.vendor.storeName,
        avatar: thread.vendor.user.image
      } : null,
      product: thread.product,
      order: thread.order
    };

    return NextResponse.json({ thread: formattedThread });

  } catch (error) {
    console.error('Erreur GET /api/messages/threads/[id]:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour un thread
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
    const body = await request.json();
    const validatedData = updateThreadSchema.parse(body);

    // Vérifier que l'utilisateur est participant du thread
    const existingThread = await prisma.messageThread.findFirst({
      where: {
        id: threadId,
        participants: {
          some: {
            userId: session.user.id
          }
        }
      }
    });

    if (!existingThread) {
      return NextResponse.json(
        { error: 'Thread non trouvé' },
        { status: 404 }
      );
    }

    // Mettre à jour le thread
    const updatedThread = await prisma.messageThread.update({
      where: { id: threadId },
      data: validatedData
    });

    return NextResponse.json({ 
      success: true, 
      thread: updatedThread 
    });

  } catch (error) {
    console.error('Erreur PUT /api/messages/threads/[id]:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un thread
export async function DELETE(
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
    const existingThread = await prisma.messageThread.findFirst({
      where: {
        id: threadId,
        participants: {
          some: {
            userId: session.user.id
          }
        }
      }
    });

    if (!existingThread) {
      return NextResponse.json(
        { error: 'Thread non trouvé' },
        { status: 404 }
      );
    }

    // Supprimer le thread et toutes ses données associées
    await prisma.$transaction(async (tx) => {
      // Supprimer les messages
      await tx.message.deleteMany({
        where: { threadId }
      });

      // Supprimer les participants
      await tx.messageThreadParticipant.deleteMany({
        where: { threadId }
      });

      // Supprimer le thread
      await tx.messageThread.delete({
        where: { id: threadId }
      });
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Erreur DELETE /api/messages/threads/[id]:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}