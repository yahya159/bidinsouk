import { NextRequest, NextResponse } from 'next/server'
import { getWatchlistCount } from '@/lib/services/watchlist'
import { getClientId } from '@/lib/auth/api-auth'

export async function GET(req: NextRequest) {
  try {
    const clientId = await getClientId(req)
    const count = await getWatchlistCount(clientId)
    return NextResponse.json({ count })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}