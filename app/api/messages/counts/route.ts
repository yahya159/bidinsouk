import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

// Fonction utilitaire pour convertir en BigInt en toute sécurité
function safeBigInt(value: string | number | bigint | undefined): bigint | null {
  if (value === undefined) return null;
  try {
    if (typeof value === 'bigint') return value;
    if (typeof value === 'number') return BigInt(value);
    if (typeof value === 'string') {
      // Vérifier si c'est une chaîne numérique valide
      if (!/^\d+$/.test(value)) return null;
      return BigInt(value);
    }
    return null;
  } catch (error) {
    console.error('Erreur de conversion BigInt:', { value, error });
    return null;
  }
}

// GET - Récupérer les compteurs de messages non lus
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      // Retourner des valeurs par défaut si l'utilisateur n'est pas authentifié
      return NextResponse.json({
        support: 0,
        messages: 0
      });
    }

    // Vérifier et convertir l'ID utilisateur en BigInt
    const userIdBigInt = safeBigInt(session.user.id);
    if (!userIdBigInt) {
      console.error('ID utilisateur invalide:', session.user.id);
      // Retourner des valeurs par défaut en cas d'ID invalide
      return NextResponse.json({
        support: 0,
        messages: 0
      });
    }

    // Compter les tickets de support non lus
    const supportCount = await prisma.message.count({
      where: {
        thread: {
          // @ts-ignore
          type: 'SUPPORT_TICKET'
        },
        senderId: {
          not: userIdBigInt
        },
        isRead: false
      }
    });

    // Compter les messages de chat non lus
    const messagesCount = await prisma.message.count({
      where: {
        thread: {
          // @ts-ignore
          type: 'VENDOR_CHAT'
        },
        senderId: {
          not: userIdBigInt
        },
        isRead: false
      }
    });

    return NextResponse.json({
      support: Number(supportCount),
      messages: Number(messagesCount)
    });

  } catch (error) {
    console.error('Erreur GET /api/messages/counts:', error);
    // Retourner des valeurs par défaut en cas d'erreur serveur
    return NextResponse.json({
      support: 0,
      messages: 0
    });
  }
}
