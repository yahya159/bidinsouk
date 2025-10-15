import { NextRequest, NextResponse } from 'next/server'
import { saveSearch, getSavedSearches } from '@/lib/services/savedSearch'
import { requireAuth, getClientId } from '@/lib/auth/api-auth'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    
    const clientId = await getClientId(req)
    if (!clientId) {
      return NextResponse.json(
        { 
          error: 'Client profile required',
          message: 'Client profile will be created automatically'
        },
        { status: 403 }
      )
    }

    const searches = await getSavedSearches(clientId)
    return NextResponse.json({ searches })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    
    const clientId = await getClientId(req)
    if (!clientId) {
      return NextResponse.json(
        { 
          error: 'Client profile required',
          message: 'Client profile will be created automatically'
        },
        { status: 403 }
      )
    }

    const { query } = await req.json()
    if (!query) return NextResponse.json({ error: 'query required' }, { status: 400 })

    const search = await saveSearch(clientId, query)
    return NextResponse.json({ search }, { status: 201 })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
