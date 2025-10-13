import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validation pour la création d'un ticket
const createTicketSchema = z.object({
  subject: z.string().min(1, 'Le sujet est obligatoire'),
  category: z.enum(['ORDER', 'PRODUCT', 'TECHNICAL', 'OTHER']),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  description: z.string().min(1, 'La description est obligatoire'),
  orderId: z.string().optional(),
  productId: z.string().optional()
});

// POST - Créer un nouveau ticket de support
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createTicketSchema.parse(body);

    // Créer le ticket de support via l'API des threads
    const ticket = await prisma.$transaction(async (tx) => {
      // Créer le thread
      const newThread = await tx.messageThread.create({
        data: {
          type: 'SUPPORT_TICKET',
          subject: validatedData.subject,
          status: 'OPEN',
          priority: validatedData.priority,
          category: validatedData.category,
          productId: validatedData.productId,
          orderId: validatedData.orderId,
          lastMessageAt: new Date()
        }
      });

      // Ajouter l'utilisateur comme participant
      await tx.messageThreadParticipant.create({
        data: {
          threadId: newThread.id,
          userId: session.user.id,
          role: 'USER'
        }
      });

      // Créer le message initial avec la description
      await tx.message.create({
        data: {
          threadId: newThread.id,
          senderId: session.user.id,
          content: validatedData.description,
          isRead: false
        }
      });

      return newThread;
    });

    return NextResponse.json({ 
      success: true, 
      ticketId: ticket.id,
      message: 'Votre demande de support a été créée avec succès. Notre équipe vous répondra dans les plus brefs délais.'
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur POST /api/support/tickets:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la création du ticket de support' },
      { status: 500 }
    );
  }
}

// GET - Récupérer les tickets de support de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Construire les filtres
    const where: any = {
      type: 'SUPPORT_TICKET',
      participants: {
        some: {
          userId: session.user.id
        }
      }
    };

    if (status && status !== 'all') {
      where.status = status;
    }

    if (category && category !== 'all') {
      where.category = category;
    }

    if (priority && priority !== 'all') {
      where.priority = priority;
    }

    // Récupérer les tickets avec pagination
    const [tickets, total] = await Promise.all([
      prisma.messageThread.findMany({
        where,
        include: {
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
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  image: true
                }
              }
            }
          },
          _count: {
            select: {
              messages: {
                where: {
                  isRead: false,
                  senderId: { not: session.user.id }
                }
              }
            }
          }
        },
        orderBy: { lastMessageAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.messageThread.count({ where })
    ]);

    // Formater les données
    const formattedTickets = tickets.map(ticket => ({
      id: ticket.id,
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      createdAt: ticket.createdAt,
      lastMessageAt: ticket.lastMessageAt,
      unreadCount: ticket._count.messages,
      product: ticket.product,
      order: ticket.order,
      lastMessage: ticket.messages[0] ? {
        content: ticket.messages[0].content,
        senderName: ticket.messages[0].sender.name,
        createdAt: ticket.messages[0].createdAt
      } : null
    }));

    return NextResponse.json({
      tickets: formattedTickets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erreur GET /api/support/tickets:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}