import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'
import { CreateProductDto, ProductFilterDto } from '@/lib/validations/products'
import { createProduct, listProducts } from '@/lib/services/products'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Vérifier si l'utilisateur est authentifié
    const session = await getServerSession(authConfig)
    let vendor = null
    
    if (session?.user) {
      vendor = await prisma.vendor.findUnique({
        where: { userId: BigInt(session.user.id) }
      })
    }
    
    const filters = ProductFilterDto.parse({
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') || undefined,
      brand: searchParams.get('brand') || undefined,
      condition: searchParams.get('condition') || undefined,
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      storeId: searchParams.get('storeId') || undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20
    })

    // Si l'utilisateur est un vendeur et qu'aucun storeId n'est spécifié, 
    // filtrer par ses propres magasins
    if (vendor && !filters.storeId) {
      const vendorStores = await prisma.store.findMany({
        where: { sellerId: vendor.id },
        select: { id: true }
      })
      
      if (vendorStores.length > 0) {
        // Si l'utilisateur a plusieurs magasins, on prend le premier
        // Dans une implémentation plus avancée, on pourrait permettre de choisir le magasin
        filters.storeId = vendorStores[0].id.toString()
      }
    }

    const result = await listProducts(filters)

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des produits' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const data = CreateProductDto.parse(body)

    const store = await prisma.store.findFirst({
      where: { id: BigInt(data.storeId), sellerId: vendor.id }
    })

    if (!store) {
      return NextResponse.json({ error: 'Boutique non trouvée' }, { status: 403 })
    }

    const product = await createProduct({
      ...data,
      storeId: BigInt(data.storeId)
    })

    return NextResponse.json({ message: 'Produit créé avec succès', product })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création du produit' },
      { status: 500 }
    )
  }
}