import { NextRequest, NextResponse } from 'next/server'
import { createBanner, getAllBanners, getBannersBySlot } from '@/lib/services/banners'

function getCurrentUser(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  const role = req.headers.get('x-user-role')
  if (!userId) return null
  return { userId: BigInt(userId), role }
}

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
    const user = getCurrentUser(req)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slot, content } = await req.json()
    if (!slot || !content) {
      return NextResponse.json({ error: 'slot and content required' }, { status: 400 })
    }

    const banner = await createBanner({ slot, content })
    return NextResponse.json({ banner }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
