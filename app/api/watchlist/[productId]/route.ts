import { NextRequest, NextResponse } from 'next/server'
import { removeFromWatchlist } from '@/lib/services/watchlist'
import { getClientId } from '@/lib/auth/api-auth'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const clientId = await getClientId(req)
    
    if (!clientId) {
      return NextResponse.json({ error: 'Client profile required' }, { status: 403 })
    }

    await removeFromWatchlist(clientId, BigInt(params.productId))
    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
