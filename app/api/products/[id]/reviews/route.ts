import { NextRequest, NextResponse } from 'next/server'
import { createReview, getProductReviews } from '@/lib/services/reviews'

function getCurrentUser(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  const clientId = req.headers.get('x-client-id')
  if (!userId || !clientId) return null
  return { userId: BigInt(userId), clientId: BigInt(clientId) }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') as any
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const result = await getProductReviews(BigInt(params.id), {
      status: status || 'APPROVED',
      limit,
      offset
    })

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getCurrentUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { rating, body, photos } = await req.json()

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    if (!body || body.trim().length < 10) {
      return NextResponse.json({ error: 'Review must be at least 10 characters' }, { status: 400 })
    }

    const review = await createReview({
      productId: BigInt(params.id),
      clientId: user.clientId,
      rating,
      body,
      photos
    })

    return NextResponse.json({ review }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
