import { NextRequest, NextResponse } from 'next/server'
import { deleteSavedSearch } from '@/lib/services/savedSearch'
import { requireAuth, getClientId } from '@/lib/auth/api-auth'

export async function DELETE(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const params = await paramsPromise
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

    await deleteSavedSearch(BigInt(params.id), clientId)
    return NextResponse.json({ success: true })
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
