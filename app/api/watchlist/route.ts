import { NextRequest, NextResponse } from 'next/server'
import { getWatchlist, addToWatchlist } from '@/lib/services/watchlist'
import { getClientId } from '@/lib/auth/api-auth'

export async function GET(req: NextRequest) {
  try {
    const clientId = await getClientId(req)
    const watchlist = await getWatchlist(clientId)
    return NextResponse.json({ watchlist })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const clientId = await getClientId(req)
    const { productId } = await req.json()
    
    if (!productId) {
      return NextResponse.json({ error: 'productId required' }, { status: 400 })
    }

    const item = await addToWatchlist(clientId, BigInt(productId))
    return NextResponse.json({ item }, { status: 201 })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
