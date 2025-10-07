import { prisma } from '@/lib/db/prisma'

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

export async function listProducts(filters: any) {
  const where: any = {}

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search } },
      { brand: { contains: filters.search } }
    ]
  }

  if (filters.category) where.category = filters.category
  if (filters.brand) where.brand = filters.brand
  if (filters.condition) where.condition = filters.condition
  if (filters.storeId) where.storeId = BigInt(filters.storeId)
  if (filters.status) where.status = filters.status

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        store: true,
        offers: { where: { active: true } }
      },
      take: filters.limit,
      skip: (filters.page - 1) * filters.limit
    }),
    prisma.product.count({ where })
  ])

  return { products, total, page: filters.page, pages: Math.ceil(total / filters.limit) }
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