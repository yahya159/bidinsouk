import { NextRequest, NextResponse } from 'next/server'
import { deleteSavedSearch } from '@/lib/services/savedSearch'

function getCurrentUser(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  const clientId = req.headers.get('x-client-id')
  if (!userId || !clientId) return null
  return { userId: BigInt(userId), clientId: BigInt(clientId) }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getCurrentUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await deleteSavedSearch(BigInt(params.id), user.clientId)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
