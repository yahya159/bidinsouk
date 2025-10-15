import { NextRequest, NextResponse } from 'next/server'
import { updateBanner, deleteBanner } from '@/lib/services/banners'
import { requireRole } from '@/lib/auth/api-auth'

export async function PATCH(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const params = await paramsPromise
  try {
    const user = await requireRole(req, ['ADMIN'])

    const { content } = await req.json()
    if (!content) {
      return NextResponse.json({ error: 'content required' }, { status: 400 })
    }

    const banner = await updateBanner(BigInt(params.id), content)
    return NextResponse.json({ banner })
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

export async function DELETE(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const params = await paramsPromise
  try {
    const user = await requireRole(req, ['ADMIN'])

    await deleteBanner(BigInt(params.id))
    return NextResponse.json({ success: true })
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
