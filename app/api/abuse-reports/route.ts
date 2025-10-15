import { NextRequest, NextResponse } from 'next/server'
import { createAbuseReport, getAbuseReports } from '@/lib/services/abuseReports'
import { requireAuth, requireRole } from '@/lib/auth/api-auth'

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, ['ADMIN'])

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
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    if (error.message === 'Forbidden') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req)

    const { targetType, targetId, reason, details } = await req.json()

    if (!targetType || !targetId || !reason) {
      return NextResponse.json(
        { error: 'targetType, targetId, and reason are required' },
        { status: 400 }
      )
    }

    const report = await createAbuseReport({
      reporterId: BigInt(user.userId),
      targetType,
      targetId: BigInt(targetId),
      reason,
      details
    })

    return NextResponse.json({ report }, { status: 201 })
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
