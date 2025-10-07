import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'
import { UpdateProductDto } from '@/lib/validations/products'
import { getProduct, updateProduct, deleteProduct } from '@/lib/services/products'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await getProduct(BigInt(params.id))

    if (!product) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du produit' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const vendor = await prisma.vendor.findUnique({
      where: { userId: BigInt(session.user.id) }
    })

    if (!vendor) {
      return NextResponse.json({ error: 'Accès vendeur requis' }, { status: 403 })
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id: BigInt(params.id) },
      include: { store: true }
    })

    if (!existingProduct || existingProduct.store.sellerId !== vendor.id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const data = UpdateProductDto.parse(body)

    const product = await updateProduct(BigInt(params.id), existingProduct.storeId, data)

    return NextResponse.json(product)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la mise à jour du produit' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const vendor = await prisma.vendor.findUnique({
      where: { userId: BigInt(session.user.id) }
    })

    if (!vendor) {
      return NextResponse.json({ error: 'Accès vendeur requis' }, { status: 403 })
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id: BigInt(params.id) },
      include: { store: true }
    })

    if (!existingProduct || existingProduct.store.sellerId !== vendor.id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    await deleteProduct(BigInt(params.id), existingProduct.storeId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la suppression du produit' },
      { status: 500 }
    )
  }
}
