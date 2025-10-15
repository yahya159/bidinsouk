import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'
import { getOrder } from '@/lib/services/orders'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const params = await paramsPromise
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const client = await prisma.client.findUnique({
      where: { userId: BigInt(session.user.id) }
    })

    if (!client) {
      return NextResponse.json({ error: 'Profil client requis' }, { status: 403 })
    }

    const order = await getOrder(BigInt(params.id), client.id)

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la commande' },
      { status: 500 }
    )
  }
}
