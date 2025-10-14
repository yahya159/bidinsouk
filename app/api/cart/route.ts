import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'
import { AddToCartDto } from '@/lib/validations/cart'
import { getCart, addToCart } from '@/lib/services/cart'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const cart = await getCart(BigInt(session.user.id))

    return NextResponse.json(cart)
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du panier' },
      { status: 500 }
    )
  }
}

// GET /api/cart/count - Get cart items count
export async function GET_count(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return NextResponse.json({ count: 0 })
    }

    // Count cart items for the user
    const count = await prisma.cartItem.count({
      where: {
        cart: {
          userId: BigInt(session.user.id)
        }
      }
    })

    return NextResponse.json({ count })
  } catch (error: any) {
    return NextResponse.json({ count: 0 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const data = AddToCartDto.parse(body)

    const item = await addToCart(BigInt(session.user.id), {
      productId: BigInt(data.productId),
      offerId: BigInt(data.offerId),
      quantity: data.quantity
    })

    return NextResponse.json({ message: 'Ajouté au panier', item })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'ajout au panier' },
      { status: 500 }
    )
  }
}