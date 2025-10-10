import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig)

    // Vérifier que l'utilisateur est un administrateur
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    // Récupérer les boutiques en attente d'approbation
    const stores = await prisma.store.findMany({
      where: { 
        status: 'PENDING'
      },
      include: {
        seller: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Convertir les BigInt en string pour éviter les erreurs de sérialisation
    const serializedStores = stores.map(store => ({
      ...store,
      id: store.id.toString(),
      sellerId: store.sellerId.toString(),
      seller: {
        ...store.seller,
        id: store.seller.id.toString(),
        userId: store.seller.userId.toString(),
        user: store.seller.user
      }
    }))

    return NextResponse.json({ stores: serializedStores })
  } catch (error: any) {
    console.error('Erreur lors de la récupération des boutiques en attente:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des boutiques' },
      { status: 500 }
    )
  }
}