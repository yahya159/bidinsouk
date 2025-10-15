import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'
import { AddToCartDto } from '@/lib/validations/cart'
import { getCart, addToCart, clearCart } from '@/lib/services/cart'
import { logger } from '@/lib/logger'
import { ErrorResponses, successResponse } from '@/lib/api/responses'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return ErrorResponses.unauthorized()
    }

    const cart = await getCart(BigInt(session.user.id))

    return successResponse({ data: cart })
  } catch (error) {
    logger.error('Failed to fetch cart', error)
    return ErrorResponses.serverError('Erreur lors de la récupération du panier', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return NextResponse.json({ 
        error: 'Vous devez être connecté pour ajouter des articles au panier',
        redirectTo: '/login'
      }, { status: 401 })
    }

    const body = await request.json()
    const data = AddToCartDto.parse(body)

    const item = await addToCart(BigInt(session.user.id), {
      productId: BigInt(data.productId),
      offerId: data.offerId ? BigInt(data.offerId) : undefined,
      quantity: data.quantity
    })

    return successResponse({ message: 'Ajouté au panier', data: item }, 201)
  } catch (error: any) {
    logger.error('Failed to add to cart', error)
    return ErrorResponses.serverError(error.message || 'Erreur lors de l\'ajout au panier', error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return ErrorResponses.unauthorized()
    }

    await clearCart(BigInt(session.user.id))

    return successResponse({ message: 'Panier vidé' })
  } catch (error) {
    logger.error('Failed to clear cart', error)
    return ErrorResponses.serverError('Erreur lors de la suppression du panier', error)
  }
}
