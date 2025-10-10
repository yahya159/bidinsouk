import { NextRequest, NextResponse } from 'next/server'
import { getWatchlistCount } from '@/lib/services/watchlist'
import { getClientId } from '@/lib/auth/api-auth'

export async function GET(req: NextRequest) {
  try {
    const clientId = await getClientId(req)
    const count = await getWatchlistCount(clientId)
    return NextResponse.json({ count })
  } catch (error: any) {
    // Retourner 0 au lieu d'une erreur pour éviter les problèmes UX
    return NextResponse.json({ count: 0 })
  }
}