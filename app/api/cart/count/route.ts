import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'
import { getCartCount } from '@/lib/services/cart'
import { logger } from '@/lib/logger'
import { ErrorResponses, successResponse } from '@/lib/api/responses'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return ErrorResponses.unauthorized()
    }

    const count = await getCartCount(BigInt(session.user.id))

    return successResponse({ data: { count } })
  } catch (error) {
    logger.error('Failed to fetch cart count', error)
    return ErrorResponses.serverError('Erreur lors de la récupération du nombre d\'articles dans le panier', error)
  }
}
