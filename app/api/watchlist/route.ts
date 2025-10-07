import { NextRequest, NextResponse } from 'next/server'
import { getWatchlist, addToWatchlist } from '@/lib/services/watchlist'

// Mock auth - replace with your actual auth
function getCurrentUser(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  const clientId = req.headers.get('x-client-id')
  if (!userId || !clientId) return null
  return { userId: BigInt(userId), clientId: BigInt(clientId) }
}

export async function GET(req: NextRequest) {
  try {
    const user = getCurrentUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const watchlist = await getWatchlist(user.clientId)
    return NextResponse.json({ watchlist })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getCurrentUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { productId } = await req.json()
    if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 })

    const item = await addToWatchlist(user.clientId, BigInt(productId))
    return NextResponse.json({ item }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
