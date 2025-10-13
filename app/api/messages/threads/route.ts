import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

// Schema de validation pour la création d'un thread
const createThreadSchema = z.object({
  type: z.enum(['SUPPORT_TICKET', 'VENDOR_CHAT']),
  subject: z.string().min(1, 'Le sujet est obligatoire'),
  vendorId: z.string().optional(),
  productId: z.string().optional(),
  orderId: z.string().optional(),
  category: z.enum(['ORDER', 'PRODUCT', 'TECHNICAL', 'OTHER']).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  initialMessage: z.string().min(1, 'Le message initial est obligatoire')
});

// GET - Récupérer les threads de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'SUPPORT_TICKET' | 'VENDOR_CHAT' | null;
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Construire les filtres
    const where: any = {
      participants: {
        some: {
          userId: BigInt(session.user.id)
        }
      }
    };

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { 
          messages: {
            some: {
              content: { contains: search, mode: 'insensitive' }
            }
          }
        }
      ];
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (priority && priority !== 'all') {
      where.priority = priority;
    }

    if (category && category !== 'all') {
      where.category = category;
    }

    if (unreadOnly) {
      where.messages = {
        some: {
          isRead: false,
          senderId: { not: BigInt(session.user.id) }
        }
      };
    }

    // Récupérer les threads avec pagination
    const [threads, total] = await Promise.all([
      prisma.messageThread.findMany({
        where,
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true
                }
              }
            }
          },
          vendor: {
            include: {
              user: {
                select: {
                  name: true,
                  avatarUrl: true
                }
              },
              stores: {
                take: 1,
                select: {
                  name: true
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
              number: true
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
                  avatarUrl: true
                }
              }
            }
          },
          _count: {
            select: {
              messages: {
                where: {
                  isRead: false,
                  senderId: { not: BigInt(session.user.id) }
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

    // Calculer les compteurs non lus par type
    const unreadCounts = await prisma.messageThread.groupBy({
      by: ['type'],
      where: {
        participants: {
          some: {
            userId: BigInt(session.user.id)
          }
        },
        messages: {
          some: {
            isRead: false,
            senderId: { not: BigInt(session.user.id) }
          }
        }
      },
      _count: {
        id: true
      }
    });

    const unreadCountsMap = {
      support: unreadCounts.find(c => c.type === 'SUPPORT_TICKET')?._count.id || 0,
      messages: unreadCounts.find(c => c.type === 'VENDOR_CHAT')?._count.id || 0
    };

    // Formater les données
    const formattedThreads = threads.map(thread => {
      // Get the first store name if vendor exists and has stores
      const storeName = thread.vendor?.stores?.[0]?.name || null;
      
      return {
        id: thread.id,
        type: thread.type,
        subject: thread.subject,
        status: thread.status,
        priority: thread.priority,
        category: thread.category,
        lastMessageAt: thread.lastMessageAt,
        unreadCount: thread._count.messages,
        participants: thread.participants.map((p: any) => p.user),
        vendor: thread.vendor ? {
          id: thread.vendor.id,
          name: thread.vendor.user.name,
          storeName: storeName,
          avatar: thread.vendor.user.avatarUrl
        } : null,
        product: thread.product,
        order: thread.order,
        lastMessage: thread.messages[0] ? {
          content: thread.messages[0].content,
          senderName: thread.messages[0].sender.name,
          createdAt: thread.messages[0].createdAt
        } : null
      };
    });

    return NextResponse.json({
      threads: formattedThreads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      unreadCounts: unreadCountsMap
    });

  } catch (error) {
    console.error('Erreur GET /api/messages/threads:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau thread
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createThreadSchema.parse(body);

    // Vérifications spécifiques selon le type
    if (validatedData.type === 'VENDOR_CHAT' && !validatedData.vendorId) {
      return NextResponse.json(
        { error: 'L\'ID du vendeur est obligatoire pour un chat vendeur' },
        { status: 400 }
      );
    }

    if (validatedData.type === 'SUPPORT_TICKET' && !validatedData.category) {
      return NextResponse.json(
        { error: 'La catégorie est obligatoire pour un ticket de support' },
        { status: 400 }
      );
    }

    // Créer le thread avec le message initial
    const thread = await prisma.$transaction(async (tx) => {
      // Créer le thread
      const newThread = await tx.messageThread.create({
        data: {
          type: validatedData.type,
          subject: validatedData.subject,
          status: 'OPEN',
          priority: validatedData.priority,
          category: validatedData.category,
          vendorId: validatedData.vendorId,
          productId: validatedData.productId ? BigInt(validatedData.productId) : undefined,
          orderId: validatedData.orderId ? BigInt(validatedData.orderId) : undefined,
          lastMessageAt: new Date()
        }
      });

      // Ajouter l'utilisateur comme participant
      await tx.messageThreadParticipant.create({
        data: {
          threadId: newThread.id,
          userId: BigInt(session.user.id),
          role: 'USER'
        }
      });

      // Ajouter le vendeur comme participant si c'est un chat vendeur
      if (validatedData.vendorId) {
        const vendor = await tx.vendor.findUnique({
          where: { id: validatedData.vendorId },
          select: { userId: true }
        });

        if (vendor?.userId) {
          await tx.messageThreadParticipant.create({
            data: {
              threadId: newThread.id,
              userId: vendor.userId,
              role: 'VENDOR'
            }
          });
        }
      }

      // Créer le message initial
      await tx.message.create({
        data: {
          threadId: newThread.id,
          senderId: BigInt(session.user.id),
          content: validatedData.initialMessage,
          isRead: false
        }
      });

      return newThread;
    });

    return NextResponse.json({ 
      success: true, 
      threadId: thread.id 
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur POST /api/messages/threads:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}