import { NextRequest, NextResponse } from 'next/server'
import { PlaceBidDto } from '@/lib/validations/bid'
import { placeBid } from '@/lib/services/bids'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the user from session (in a real app, you'd use NextAuth session)
    // For now, we'll use a placeholder user ID
    const userId = 1 // Placeholder - replace with actual user ID from session
    
    // Parse and validate the request body
    const body = await request.json()
    const { amount } = PlaceBidDto.parse(body)
    
    // Place the bid
    const result = await placeBid(parseInt(params.id), userId, amount)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error placing bid:', error)
    return NextResponse.json(
      { error: 'Failed to place bid' }, 
      { status: 500 }
    )
  }
}