import { NextRequest, NextResponse } from 'next/server'
import { getStoreBySlug } from '@/lib/services/stores'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const store = await getStoreBySlug(params.slug)

    if (!store) {
      return NextResponse.json({ error: 'Boutique non trouvée' }, { status: 404 })
    }

    return NextResponse.json(store)
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la boutique' },
      { status: 500 }
    )
  }
}
