import { NextRequest, NextResponse } from 'next/server'
import { removeFromWatchlist } from '@/lib/services/watchlist'

function getCurrentUser(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  const clientId = req.headers.get('x-client-id')
  if (!userId || !clientId) return null
  return { userId: BigInt(userId), clientId: BigInt(clientId) }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const user = getCurrentUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await removeFromWatchlist(user.clientId, BigInt(params.productId))
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
