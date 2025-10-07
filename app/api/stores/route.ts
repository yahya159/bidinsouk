import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'
import { CreateStoreDto } from '@/lib/validations/stores'
import { createStore } from '@/lib/services/stores'
import { prisma } from '@/lib/db/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const vendor = await prisma.vendor.findUnique({
      where: { userId: BigInt(session.user.id) }
    })

    if (!vendor) {
      return NextResponse.json({ error: 'Accès vendeur requis' }, { status: 403 })
    }

    const body = await request.json()
    const data = CreateStoreDto.parse(body)

    const store = await createStore(vendor.id, data)

    return NextResponse.json({ message: 'Boutique créée avec succès', store })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création de la boutique' },
      { status: 500 }
    )
  }
}
