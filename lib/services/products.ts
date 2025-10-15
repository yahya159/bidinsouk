import { prisma } from '@/lib/db/prisma'
import type { Prisma } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import type { ProductListQuery } from '@/lib/validations/products'

export async function createProduct(data: {
  storeId: bigint
  title: string
  description?: string
  brand?: string
  category?: string
  condition: 'NEW' | 'USED'
}) {
  return prisma.product.create({
    data: {
      storeId: data.storeId,
      title: data.title,
      brand: data.brand,
      category: data.category,
      condition: data.condition,
      status: 'DRAFT'
    }
  })
}

export async function getProduct(productId: bigint) {
  return prisma.product.findUnique({
    where: { id: productId },
    include: {
      store: true,
      offers: { where: { active: true } },
      auctions: {
        where: { status: { in: ['RUNNING', 'ENDING_SOON', 'SCHEDULED'] } }
      },
      reviews: {
        where: { status: 'APPROVED' },
        take: 10
      }
    }
  })
}

export interface ListProductsFilters {
  search?: string
  category?: string
  brand?: string
  condition?: 'NEW' | 'USED'
  storeId?: bigint | string
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
  priceMin?: number
  priceMax?: number
  inStock?: boolean
  sort?: ProductListQuery['sort']
  page: number
  limit: number
}

export async function listProducts(filters: ListProductsFilters) {
  const where: Prisma.ProductWhereInput = {}

  if (filters.status) {
    where.status = filters.status
  }

  if (filters.storeId) {
    where.storeId = BigInt(filters.storeId)
  }

  if (filters.category) {
    where.category = filters.category
  }

  if (filters.brand) {
    where.brand = filters.brand
  }

  if (filters.condition) {
    where.condition = filters.condition
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search } },
      { description: { contains: filters.search } },
      { brand: { contains: filters.search } }
    ]
  }

  const hasPriceFilter =
    typeof filters.priceMin === 'number' ||
    typeof filters.priceMax === 'number'

  if (hasPriceFilter) {
    const min =
      typeof filters.priceMin === 'number' ? filters.priceMin : undefined
    const max =
      typeof filters.priceMax === 'number' ? filters.priceMax : undefined

    where.price = {
      ...(min !== undefined ? { gte: new Decimal(min) } : {}),
      ...(max !== undefined ? { lte: new Decimal(max) } : {})
    }
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput

  switch (filters.sort) {
    case 'price_asc':
      orderBy = { price: 'asc' }
      break
    case 'price_desc':
      orderBy = { price: 'desc' }
      break
    case 'popular':
      orderBy = { views: 'desc' }
      break
    case 'rating':
      orderBy = { createdAt: 'desc' }
      break
    case 'newest':
    default:
      orderBy = { createdAt: 'desc' }
      break
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        store: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      take: filters.limit,
      skip: (filters.page - 1) * filters.limit,
      orderBy
    }),
    prisma.product.count({ where })
  ])

  const items = products.map((product) => ({
    id: product.id.toString(),
    title: product.title,
    description: product.description ?? null,
    category: product.category ?? undefined,
    brand: product.brand ?? undefined,
    condition: product.condition,
    status: product.status,
    price: product.price ? Number(product.price) : null,
    compareAtPrice: product.compareAtPrice
      ? Number(product.compareAtPrice)
      : null,
    images: toImageObjects(product.images),
    store: product.store
      ? {
          id: product.store.id.toString(),
          name: product.store.name,
          slug: product.store.slug ?? undefined
        }
      : null,
    views: product.views,
    inventory: product.inventory
  }))

  return {
    products: items,
    total,
    page: filters.page,
    limit: filters.limit,
    pages: Math.ceil(total / filters.limit)
  }
}

export async function updateProduct(productId: bigint, storeId: bigint, data: any) {
  const product = await prisma.product.findFirst({
    where: { id: productId, storeId }
  })

  if (!product) throw new Error('Product not found')

  return prisma.product.update({
    where: { id: productId },
    data
  })
}

export async function deleteProduct(productId: bigint, storeId: bigint) {
  const product = await prisma.product.findFirst({
    where: { id: productId, storeId }
  })

  if (!product) throw new Error('Product not found')

  return prisma.product.update({
    where: { id: productId },
    data: { status: 'ARCHIVED' }
  })
}

function extractImageUrls(value: unknown): string[] {
  if (!value) return []

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') return item
        if (item && typeof item === 'object' && 'url' in item) {
          const url = (item as { url?: unknown }).url
          return typeof url === 'string' ? url : null
        }
        return null
      })
      .filter((url): url is string => Boolean(url))
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return extractImageUrls(parsed)
    } catch {
      return []
    }
  }

  return []
}

function toImageObjects(
  value: unknown
): Array<{ url: string }> {
  return extractImageUrls(value).map((url) => ({ url }))
}
