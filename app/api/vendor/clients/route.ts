import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

function getCurrentUser(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  const role = req.headers.get('x-user-role')
  if (!userId) return null
  return { userId, role }
}

export async function GET(req: NextRequest) {
  try {
    const user = getCurrentUser(req)
    if (!user || user.role !== 'VENDOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Récupérer les clients avec qui le vendeur a interagi
    // Les clients qui ont passé des commandes dans les boutiques du vendeur
    const clients = await prisma.user.findMany({
      where: {
        role: 'CLIENT',
        client: {
          orders: {
            some: {
              store: {
                sellerId: BigInt(user.userId)
              }
            }
          }
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    const total = await prisma.user.count({
      where: {
        role: 'CLIENT',
        client: {
          orders: {
            some: {
              store: {
                sellerId: BigInt(user.userId)
              }
            }
          }
        }
      }
    })

    // Convertir les BigInt en string pour la sérialisation
    const serializedClients = clients.map(client => ({
      ...client,
      id: client.id.toString(),
      createdAt: client.createdAt.toISOString()
    }))

    return NextResponse.json({ users: serializedClients, total })
  } catch (error: any) {
    console.error('Error fetching vendor clients:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}