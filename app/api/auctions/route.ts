import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import {
  CreateAuctionDto,
  AuctionListQuerySchema
} from '@/lib/validations/auctions'
import { listAuctions, createAuction } from '@/lib/services/auctions'
import { successResponse, ErrorResponses } from '@/lib/api/responses'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const startedAt = Date.now()

  try {
    const searchParams = request.nextUrl.searchParams
    const rawParams = Object.fromEntries(searchParams.entries())
    const parsedParams = AuctionListQuerySchema.safeParse(rawParams)

    if (!parsedParams.success) {
      logger.warn('Invalid auction list query', parsedParams.error.flatten())
      return ErrorResponses.validationError(
        'Paramètres de recherche invalides',
        parsedParams.error.flatten()
      )
    }

    const filters = parsedParams.data
    const result = await listAuctions({
      status: filters.status,
      page: filters.page,
      limit: filters.limit,
      q: filters.q,
      sort: filters.sort,
      category: filters.category,
      storeId: filters.storeId,
      priceMin: filters.priceMin > 0 ? filters.priceMin : undefined,
      priceMax: filters.priceMax < 999999 ? filters.priceMax : undefined
    })

    logger.apiRequest(
      'GET',
      '/api/auctions',
      Date.now() - startedAt,
      200
    )

    return successResponse(result)
  } catch (error) {
    logger.error('Failed to fetch auctions list', error)
    return ErrorResponses.serverError(
      'Erreur lors de la récupération des enchères',
      error instanceof Error ? error.message : error
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return ErrorResponses.unauthorized()
    }

    const vendor = await prisma.vendor.findUnique({
      where: { userId: BigInt(session.user.id) }
    })

    if (!vendor) {
      return ErrorResponses.forbidden('Accès vendeur requis')
    }

    const body = await request.json()
    const parsedBody = CreateAuctionDto.safeParse(body)

    if (!parsedBody.success) {
      return ErrorResponses.validationError(
        'Données invalides pour la création de l’enchère',
        parsedBody.error.flatten()
      )
    }

    const data = parsedBody.data

    let storeId: bigint

    if (data.storeId) {
      const store = await prisma.store.findFirst({
        where: { id: BigInt(data.storeId), sellerId: vendor.id }
      })

      if (!store) {
        return ErrorResponses.forbidden('Boutique non trouvée pour ce vendeur')
      }

      if (store.status !== 'ACTIVE') {
        return ErrorResponses.forbidden(
          `La boutique "${store.name}" n'est pas active`
        )
      }

      storeId = store.id
    } else {
      const vendorStore = await prisma.store.findFirst({
        where: {
          sellerId: vendor.id,
          status: 'ACTIVE'
        }
      })

      if (!vendorStore) {
        return ErrorResponses.forbidden(
          'Veuillez créer et faire approuver une boutique avant de créer des enchères'
        )
      }

      storeId = vendorStore.id
    }

    const product = await prisma.product.create({
      data: {
        storeId,
        title: data.title,
        category: data.category,
        condition: 'USED',
        status: 'ACTIVE'
      }
    })

    const auction = await createAuction({
      productId: product.id,
      storeId,
      title: data.title,
      startPrice: data.startPrice,
      reservePrice: data.reservePrice || undefined,
      minIncrement: data.minIncrement,
      startAt: data.startAt ? new Date(data.startAt) : undefined,
      endAt: new Date(data.endAt)
    })

    const serializedAuction = {
      ...auction,
      id: auction.id.toString(),
      productId: auction.productId?.toString() ?? null,
      storeId: auction.storeId?.toString() ?? null,
      startPrice: auction.startPrice.toString(),
      reservePrice: auction.reservePrice?.toString() ?? null,
      minIncrement: auction.minIncrement.toString(),
      currentBid: auction.currentBid.toString()
    }

    return successResponse(
      {
        message: 'Enchère créée avec succès',
        auction: serializedAuction
      },
      201
    )
  } catch (error) {
    logger.error('Failed to create auction', error)

    return ErrorResponses.serverError(
      'Erreur lors de la création de l’enchère',
      error instanceof Error ? error.message : error
    )
  }
}
