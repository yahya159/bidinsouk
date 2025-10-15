import { prisma } from '@/lib/db/prisma'
import { Decimal } from '@prisma/client/runtime/library'

export async function getCart(userId: bigint) {
  // Get client ID
  const client = await prisma.client.findUnique({
    where: { userId },
    select: { id: true }
  })

  if (!client) {
    return { items: [], total: 0 }
  }

  // Fetch cart items with product details
  const cartItems = await prisma.cartItem.findMany({
    where: { clientId: client.id },
    include: {
      product: {
        select: {
          id: true,
          title: true,
          price: true,
          images: true,
          status: true,
          condition: true,
          category: true,
          store: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      offer: {
        select: {
          id: true,
          price: true,
          promoPct: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Calculate total
  const total = cartItems.reduce((sum, item) => {
    return sum + Number(item.price) * item.quantity
  }, 0)

  // Format response
  const items = cartItems.map(item => ({
    id: item.id.toString(),
    productId: item.productId.toString(),
    offerId: item.offerId?.toString(),
    quantity: item.quantity,
    price: Number(item.price),
    subtotal: Number(item.price) * item.quantity,
    product: {
      id: item.product.id.toString(),
      title: item.product.title,
      price: item.product.price ? Number(item.product.price) : null,
      images: item.product.images,
      status: item.product.status,
      condition: item.product.condition,
      category: item.product.category,
      store: item.product.store ? {
        id: item.product.store.id.toString(),
        name: item.product.store.name
      } : null
    },
    offer: item.offer ? {
      id: item.offer.id.toString(),
      price: Number(item.offer.price),
      promoPct: item.offer.promoPct
    } : null,
    createdAt: item.createdAt.toISOString()
  }))

  return { items, total }
}

export async function addToCart(userId: bigint, data: {
  productId: bigint
  offerId?: bigint
  quantity: number
}) {
  // Get client ID
  const client = await prisma.client.findUnique({
    where: { userId },
    select: { id: true }
  })

  if (!client) throw new Error('Client non trouvé')

  let price: Decimal

  // If offerId is provided, use the offer system
  if (data.offerId) {
    const offer = await prisma.offer.findFirst({
      where: {
        id: data.offerId,
        productId: data.productId,
        active: true
      }
    })

    if (!offer) throw new Error('Offre non trouvée')
    price = offer.price
  } else {
    // If no offerId, work directly with the product
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
      select: { id: true, price: true, inventory: true, status: true }
    })

    if (!product) throw new Error('Produit non trouvé')
    
    // Check if product is active
    if (product.status !== 'ACTIVE') {
      throw new Error('Produit non disponible')
    }

    if (!product.price) throw new Error('Prix du produit non disponible')
    price = product.price
  }

  // Check if item already exists in cart
  const existingItem = await prisma.cartItem.findFirst({
    where: {
      clientId: client.id,
      productId: data.productId,
      offerId: data.offerId ?? null
    }
  })

  if (existingItem) {
    // Update quantity if item exists
    const updated = await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: {
        quantity: existingItem.quantity + data.quantity,
        price // Update price in case it changed
      }
    })
    return {
      id: updated.id.toString(),
      productId: updated.productId.toString(),
      offerId: updated.offerId?.toString(),
      quantity: updated.quantity,
      price: Number(updated.price)
    }
  }

  // Create new cart item
  const cartItem = await prisma.cartItem.create({
    data: {
      clientId: client.id,
      productId: data.productId,
      offerId: data.offerId,
      quantity: data.quantity,
      price
    }
  })

  return {
    id: cartItem.id.toString(),
    productId: cartItem.productId.toString(),
    offerId: cartItem.offerId?.toString(),
    quantity: cartItem.quantity,
    price: Number(cartItem.price)
  }
}

export async function updateCartItem(userId: bigint, cartItemId: bigint, quantity: number) {
  if (quantity <= 0) {
    throw new Error('La quantité doit être supérieure à 0')
  }

  // Get client ID
  const client = await prisma.client.findUnique({
    where: { userId },
    select: { id: true }
  })

  if (!client) throw new Error('Client non trouvé')

  // Verify ownership and update
  const cartItem = await prisma.cartItem.findFirst({
    where: {
      id: cartItemId,
      clientId: client.id
    }
  })

  if (!cartItem) throw new Error('Article non trouvé dans le panier')

  const updated = await prisma.cartItem.update({
    where: { id: cartItemId },
    data: { quantity }
  })

  return {
    id: updated.id.toString(),
    quantity: updated.quantity,
    price: Number(updated.price),
    subtotal: Number(updated.price) * updated.quantity
  }
}

export async function removeFromCart(userId: bigint, cartItemId: bigint) {
  // Get client ID
  const client = await prisma.client.findUnique({
    where: { userId },
    select: { id: true }
  })

  if (!client) throw new Error('Client non trouvé')

  // Verify ownership and delete
  const cartItem = await prisma.cartItem.findFirst({
    where: {
      id: cartItemId,
      clientId: client.id
    }
  })

  if (!cartItem) throw new Error('Article non trouvé dans le panier')

  await prisma.cartItem.delete({
    where: { id: cartItemId }
  })

  return { success: true }
}

export async function clearCart(userId: bigint) {
  // Get client ID
  const client = await prisma.client.findUnique({
    where: { userId },
    select: { id: true }
  })

  if (!client) throw new Error('Client non trouvé')

  await prisma.cartItem.deleteMany({
    where: { clientId: client.id }
  })

  return { success: true }
}

export async function getCartCount(userId: bigint) {
  // Get client ID
  const client = await prisma.client.findUnique({
    where: { userId },
    select: { id: true }
  })

  if (!client) return 0

  const count = await prisma.cartItem.count({
    where: { clientId: client.id }
  })

  return count
}
