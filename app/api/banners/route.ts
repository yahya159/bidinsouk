import { NextRequest, NextResponse } from 'next/server'
import { createBanner, getAllBanners, getBannersBySlot } from '@/lib/services/banners'
import { requireRole } from '@/lib/auth/api-auth'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const slot = searchParams.get('slot')

    const banners = slot 
      ? await getBannersBySlot(slot)
      : await getAllBanners()

    return NextResponse.json({ banners })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, ['ADMIN'])

    const { slot, content } = await req.json()
    if (!slot || !content) {
      return NextResponse.json({ error: 'slot and content required' }, { status: 400 })
    }

    const banner = await createBanner({ slot, content })
    return NextResponse.json({ banner }, { status: 201 })
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
