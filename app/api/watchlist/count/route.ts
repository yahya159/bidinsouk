import { NextRequest, NextResponse } from 'next/server'
import { getWatchlistCount } from '@/lib/services/watchlist'
import { getClientId } from '@/lib/auth/api-auth'

export async function GET(req: NextRequest) {
  try {
    const clientId = await getClientId(req)
    
    if (!clientId) {
      // Return 0 for non-client users instead of error
      return NextResponse.json({ count: 0 })
    }
    
    const count = await getWatchlistCount(clientId)
    return NextResponse.json({ count })
  } catch (error: any) {
    // Return 0 instead of error to avoid UX issues
    return NextResponse.json({ count: 0 })
  }
}