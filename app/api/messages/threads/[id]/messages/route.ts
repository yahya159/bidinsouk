import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validation pour l'envoi d'un message
const sendMessageSchema = z.object({
  content: z.string().min(1, 'Le contenu du message est obligatoire'),
  attachmentIds: z.array(z.string()).optional().default([])
});

// GET - Récupérer les messages d'un thread
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
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

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

    // Récupérer les messages avec pagination
    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { threadId },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          },
          attachments: {
            select: {
              id: true,
              filename: true,
              url: true,
              size: true,
              mimeType: true
            }
          }
        },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.message.count({ where: { threadId } })
    ]);

    // Marquer les messages comme lus pour l'utilisateur actuel
    await prisma.message.updateMany({
      where: {
        threadId,
        senderId: { not: session.user.id },
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    // Formater les données
    const formattedMessages = messages.map(message => ({
      id: message.id,
      threadId: message.threadId,
      senderId: message.senderId,
      content: message.content,
      isRead: message.isRead,
      readAt: message.readAt,
      createdAt: message.createdAt,
      sender: {
        id: message.sender.id,
        name: message.sender.name,
        email: message.sender.email,
        avatar: message.sender.image,
        role: message.senderId === session.user.id ? 'USER' : 'OTHER'
      },
      attachments: message.attachments
    }));

    return NextResponse.json({
      messages: formattedMessages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erreur GET /api/messages/threads/[id]/messages:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Envoyer un nouveau message
export async function POST(
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
    const validatedData = sendMessageSchema.parse(body);

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

    // Vérifier que le thread n'est pas fermé
    if (thread.status === 'CLOSED') {
      return NextResponse.json(
        { error: 'Impossible d\'envoyer un message dans un thread fermé' },
        { status: 400 }
      );
    }

    // Créer le message avec les pièces jointes
    const message = await prisma.$transaction(async (tx) => {
      // Créer le message
      const newMessage = await tx.message.create({
        data: {
          threadId,
          senderId: session.user.id,
          content: validatedData.content,
          isRead: false
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          }
        }
      });

      // Associer les pièces jointes si présentes
      if (validatedData.attachmentIds.length > 0) {
        await tx.messageAttachment.updateMany({
          where: {
            id: { in: validatedData.attachmentIds },
            messageId: null // Seulement les attachments non encore associés
          },
          data: {
            messageId: newMessage.id
          }
        });
      }

      // Mettre à jour la date du dernier message du thread
      await tx.messageThread.update({
        where: { id: threadId },
        data: { 
          lastMessageAt: new Date(),
          // Rouvrir le thread s'il était résolu
          status: thread.status === 'RESOLVED' ? 'IN_PROGRESS' : thread.status
        }
      });

      return newMessage;
    });

    // Récupérer le message complet avec les pièces jointes
    const completeMessage = await prisma.message.findUnique({
      where: { id: message.id },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        attachments: {
          select: {
            id: true,
            filename: true,
            url: true,
            size: true,
            mimeType: true
          }
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: completeMessage 
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur POST /api/messages/threads/[id]/messages:', error);
    
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