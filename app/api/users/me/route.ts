import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: BigInt(session.user.id) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        vendor: {
          select: {
            id: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    return NextResponse.json({
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isVendor: !!user.vendor
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des informations utilisateur' },
      { status: 500 }
    )
  }
}
