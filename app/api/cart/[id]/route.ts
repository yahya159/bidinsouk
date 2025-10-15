import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'
import { updateCartItem, removeFromCart } from '@/lib/services/cart'
import { logger } from '@/lib/logger'
import { ErrorResponses, successResponse } from '@/lib/api/responses'
import { z } from 'zod'

const UpdateCartItemDto = z.object({
  quantity: z.number().int().positive('Quantité doit être positive')
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return ErrorResponses.unauthorized()
    }

    const { id: cartItemId } = await params
    const body = await request.json()
    const data = UpdateCartItemDto.parse(body)

    const item = await updateCartItem(
      BigInt(session.user.id),
      BigInt(cartItemId),
      data.quantity
    )

    return successResponse({ message: 'Article mis à jour', data: item })
  } catch (error: any) {
    logger.error('Failed to update cart item', error)
    return ErrorResponses.serverError(error.message || 'Erreur lors de la mise à jour', error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return ErrorResponses.unauthorized()
    }

    const { id: cartItemId } = await params

    await removeFromCart(BigInt(session.user.id), BigInt(cartItemId))

    return successResponse({ message: 'Article retiré du panier' })
  } catch (error: any) {
    logger.error('Failed to remove cart item', error)
    return ErrorResponses.serverError(error.message || 'Erreur lors de la suppression', error)
  }
}

