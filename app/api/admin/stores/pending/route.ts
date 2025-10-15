import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('Stores Pending API - Starting request processing')
    
    // Log request headers for debugging
    console.log('Stores Pending API - Request headers:', {
      cookie: request.headers.get('cookie'),
      authorization: request.headers.get('authorization'),
    })

    const session = await getServerSession(authConfig)
    
    // Log session info for debugging
    console.log('Stores Pending API - Session Info:', {
      hasSession: !!session,
      user: session?.user,
      role: session?.user?.role,
      timestamp: new Date().toISOString()
    })

    // Vérifier que l'utilisateur est un administrateur
    if (!session?.user) {
      console.log('Stores Pending API - No user in session')
      return NextResponse.json({ error: 'Accès non autorisé - No user session' }, { status: 401 })
    }
    
    if (session.user.role !== 'ADMIN') {
      console.log('Stores Pending API - Unauthorized access attempt', {
        userId: session?.user?.id,
        userRole: session?.user?.role,
        requiredRole: 'ADMIN'
      })
      return NextResponse.json({ error: 'Accès non autorisé - Not admin' }, { status: 403 })
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

    console.log('Stores Pending API - Successfully returning stores data')
    return NextResponse.json({ stores: serializedStores })
  } catch (error: any) {
    console.error('Erreur lors de la récupération des boutiques en attente:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des boutiques' },
      { status: 500 }
    )
  }
}
