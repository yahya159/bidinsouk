import { prisma } from '@/lib/db/prisma'

export async function createStore(vendorId: bigint, data: {
  name: string
  slug: string
  email: string
  phone?: string
  address?: any
}) {
  const existing = await prisma.store.findUnique({
    where: { slug: data.slug }
  })

  if (existing) throw new Error('Ce slug est déjà utilisé')

  return prisma.store.create({
    data: {
      sellerId: vendorId,
      name: data.name,
      slug: data.slug,
      email: data.email,
      phone: data.phone,
      address: data.address,
      status: 'PENDING'
    }
  })
}

export async function getStoreBySlug(slug: string) {
  return prisma.store.findUnique({
    where: { slug },
    include: {
      seller: {
        include: {
          user: { select: { name: true, avatarUrl: true } }
        }
      }
    }
  })
}

export async function updateStore(storeId: bigint, vendorId: bigint, data: any) {
  const store = await prisma.store.findFirst({
    where: { id: storeId, sellerId: vendorId }
  })

  if (!store) throw new Error('Store not found')

  return prisma.store.update({
    where: { id: storeId },
    data
  })
}
