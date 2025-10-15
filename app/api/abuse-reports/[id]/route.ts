import { NextRequest, NextResponse } from 'next/server'
import { getAbuseReportById, updateAbuseReportStatus } from '@/lib/services/abuseReports'
import { requireRole } from '@/lib/auth/api-auth'

export async function GET(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const params = await paramsPromise
  try {
    const user = await requireRole(req, ['ADMIN'])

    const report = await getAbuseReportById(BigInt(params.id))
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    return NextResponse.json({ report })
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

export async function PATCH(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const params = await paramsPromise
  try {
    const user = await requireRole(req, ['ADMIN'])

    const { status } = await req.json()
    if (!['OPEN', 'REVIEWING', 'RESOLVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const report = await updateAbuseReportStatus(BigInt(params.id), status)
    return NextResponse.json({ report })
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
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
