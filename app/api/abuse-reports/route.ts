import { NextRequest, NextResponse } from 'next/server'
import { createAbuseReport, getAbuseReports } from '@/lib/services/abuseReports'

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

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') as any
    const targetType = searchParams.get('targetType') || undefined
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const result = await getAbuseReports({
      status,
      targetType,
      limit,
      offset
    })

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getCurrentUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { targetType, targetId, reason, details } = await req.json()

    if (!targetType || !targetId || !reason) {
      return NextResponse.json(
        { error: 'targetType, targetId, and reason are required' },
        { status: 400 }
      )
    }

    const report = await createAbuseReport({
      reporterId: user.userId,
      targetType,
      targetId: BigInt(targetId),
      reason,
      details
    })

    return NextResponse.json({ report }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
