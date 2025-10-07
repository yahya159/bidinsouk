import { prisma } from '@/lib/db/prisma'

export async function getCart(userId: bigint) {
  // Simple cart implementation - can be enhanced
  return {
    items: [],
    total: 0
  }
}

export async function addToCart(userId: bigint, data: {
  productId: bigint
  offerId: bigint
  quantity: number
}) {
  const offer = await prisma.offer.findFirst({
    where: {
      id: data.offerId,
      productId: data.productId,
      active: true
    }
  })

  if (!offer) throw new Error('Offre non trouvée')

  return {
    productId: data.productId,
    offerId: data.offerId,
    quantity: data.quantity,
    price: offer.price
  }
}
