import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'
import { getPendingVendors } from '@/lib/services/admin'

export async function GET(request: NextRequest) {
  try {
    console.log('Vendor Pending API - Starting request processing')
    
    // Log request headers for debugging
    console.log('Vendor Pending API - Request headers:', {
      cookie: request.headers.get('cookie'),
      authorization: request.headers.get('authorization'),
    })

    const session = await getServerSession(authConfig)
    
    // Log session info for debugging
    console.log('Vendor Pending API - Session Info:', {
      hasSession: !!session,
      user: session?.user,
      role: session?.user?.role,
      timestamp: new Date().toISOString()
    })

    // Vérifier que l'utilisateur est un administrateur
    if (!session?.user) {
      console.log('Vendor Pending API - No user in session')
      return NextResponse.json({ error: 'Accès non autorisé - No user session' }, { status: 401 })
    }
    
    if (session.user.role !== 'ADMIN') {
      console.log('Vendor Pending API - Unauthorized access attempt', {
        userId: session?.user?.id,
        userRole: session?.user?.role,
        requiredRole: 'ADMIN'
      })
      return NextResponse.json({ error: 'Accès non autorisé - Not admin' }, { status: 403 })
    }

    const vendors = await getPendingVendors()
    
    // Convertir les BigInt en string pour éviter les erreurs de sérialisation
    const serializedVendors = vendors.map(vendor => ({
      ...vendor,
      id: vendor.id.toString(), // Ajout de la conversion en string
      userId: vendor.user.id.toString(),
      user: {
        ...vendor.user,
        id: vendor.user.id.toString(),
      },
      stores: vendor.stores.map(store => ({
        ...store,
        id: store.id.toString(),
        sellerId: store.sellerId.toString(), // Ajout de la conversion en string
        createdAt: store.createdAt.toString()
      }))
    }))

    console.log('Vendor Pending API - Successfully returning vendors data')
    return NextResponse.json({ vendors: serializedVendors })
  } catch (error: any) {
    console.error('Erreur lors de la récupération des vendeurs en attente:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des vendeurs' },
      { status: 500 }
    )
  }
}