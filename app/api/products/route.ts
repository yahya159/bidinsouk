import { NextRequest } from 'next/server'
import { successResponse, ErrorResponses } from '@/lib/api/responses'
import { logger } from '@/lib/logger'
import { ProductListQuerySchema } from '@/lib/validations/products'
import { listProducts } from '@/lib/services/products'

const PRICE_MAX_DEFAULT = 999999

export async function GET(request: NextRequest) {
  const startedAt = Date.now()

  try {
    const searchParams = request.nextUrl.searchParams
    const rawParams = Object.fromEntries(searchParams.entries())
    const parsedParams = ProductListQuerySchema.safeParse(rawParams)

    if (!parsedParams.success) {
      logger.warn('Invalid product list query', parsedParams.error.flatten())
      return ErrorResponses.validationError(
        'Paramètres de recherche invalides',
        parsedParams.error.flatten()
      )
    }

    const params = parsedParams.data
    const result = await listProducts({
      search: params.search,
      category: params.category,
      brand: params.brand,
      condition: params.condition,
      storeId: params.storeId,
      status: 'ACTIVE',
      priceMin: params.priceMin > 0 ? params.priceMin : undefined,
      priceMax:
        params.priceMax < PRICE_MAX_DEFAULT ? params.priceMax : undefined,
      sort: params.sort,
      page: params.page,
      limit: params.limit
    })

    logger.apiRequest(
      'GET',
      '/api/products',
      Date.now() - startedAt,
      200
    )

    return successResponse(result)
  } catch (error) {
    logger.error('Failed to fetch products list', error)
    return ErrorResponses.serverError(
      'Erreur lors de la récupération des produits',
      error instanceof Error ? error.message : error
    )
  }
}
