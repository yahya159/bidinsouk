import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'
import { approveVendor } from '@/lib/services/admin'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig)

    // Vérifier que l'utilisateur est un administrateur
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const result = await approveVendor(params.id)
    
    return NextResponse.json({ 
      message: 'Vendeur approuvé avec succès',
      result
    })
  } catch (error: any) {
    console.error('Erreur lors de l\'approbation du vendeur:', error)
    
    if (error.message && error.message.includes('Invalid BigInt')) {
      return NextResponse.json({ error: 'ID de vendeur invalide' }, { status: 400 })
    }
    
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'approbation du vendeur' },
      { status: 500 }
    )
  }
}