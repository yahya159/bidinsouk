import { NextRequest, NextResponse } from 'next/server'
import { getAuction } from '@/lib/services/auctions'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auction = await getAuction(BigInt(params.id))

    if (!auction) {
      return NextResponse.json({ error: 'Enchère non trouvée' }, { status: 404 })
    }

    return NextResponse.json(auction)
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'enchère' },
      { status: 500 }
    )
  }
}
