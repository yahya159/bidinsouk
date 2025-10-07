import { NextRequest, NextResponse } from 'next/server'
import { getPlatformStats } from '@/lib/services/admin'

function getCurrentUser(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  const role = req.headers.get('x-user-role')
  if (!userId) return null
  return { userId: BigInt(userId), role }
}

export async function GET(req: NextRequest) {
  try {
    const user = getCurrentUser(req)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stats = await getPlatformStats()
    return NextResponse.json({ stats })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
