import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'
import { AcceptOrderRequestDto } from '@/lib/validations/orderRequests'
import { acceptOrderRequest } from '@/lib/services/orderRequests'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the user session
    const session = await getServerSession(authConfig)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check if user is a vendor
    if (session.user.role !== 'VENDOR' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only vendors can accept order requests' },
        { status: 403 }
      )
    }
    
    // Parse and validate the request body
    const body = await request.json()
    const { id } = AcceptOrderRequestDto.parse({ id: params.id, ...body })
    
    // Accept the order request
    const result = await acceptOrderRequest({
      actorId: BigInt(session.user.id),
      requestId: BigInt(id)
    })
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error accepting order request:', error)
    return NextResponse.json(
      { error: 'Failed to accept order request' },
      { status: 500 }
    )
  }
}