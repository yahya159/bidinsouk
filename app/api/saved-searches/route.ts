import { NextRequest, NextResponse } from 'next/server'
import { saveSearch, getSavedSearches } from '@/lib/services/savedSearch'

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

    const searches = await getSavedSearches(user.clientId)
    return NextResponse.json({ searches })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getCurrentUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { query } = await req.json()
    if (!query) return NextResponse.json({ error: 'query required' }, { status: 400 })

    const search = await saveSearch(user.clientId, query)
    return NextResponse.json({ search }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
