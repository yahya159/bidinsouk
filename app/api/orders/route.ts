import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'
import { listOrders } from '@/lib/services/orders'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
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

    const orders = await listOrders(client.id)

    return NextResponse.json(orders)
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des commandes' },
      { status: 500 }
    )
  }
}

// GET /api/orders/count - Get orders count
export async function GET_count(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return NextResponse.json({ count: 0 })
    }

    const client = await prisma.client.findUnique({
      where: { userId: BigInt(session.user.id) }
    })

    if (!client) {
      return NextResponse.json({ count: 0 })
    }

    const count = await prisma.order.count({
      where: {
        userId: client.id
      }
    })

    return NextResponse.json({ count })
  } catch (error: any) {
    return NextResponse.json({ count: 0 })
  }
}