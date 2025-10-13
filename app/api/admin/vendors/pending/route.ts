import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'
import { getPendingVendors } from '@/lib/services/admin'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig)

    // Vérifier que l'utilisateur est un administrateur
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const vendors = await getPendingVendors()
    
    // Convertir les BigInt en string pour éviter les erreurs de sérialisation
    const serializedVendors = vendors.map(vendor => ({
      ...vendor,
      id: vendor.id,
      userId: vendor.user.id.toString(),
      user: {
        ...vendor.user,
        id: vendor.user.id.toString(),
      },
      stores: vendor.stores.map(store => ({
        ...store,
        id: store.id.toString(),
        sellerId: store.sellerId,
        createdAt: store.createdAt.toString()
      }))
    }))

    return NextResponse.json({ vendors: serializedVendors })
  } catch (error: any) {
    console.error('Erreur lors de la récupération des vendeurs en attente:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des vendeurs' },
      { status: 500 }
    )
  }
}