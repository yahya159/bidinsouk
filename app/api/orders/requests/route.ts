import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'
import { CreateOrderRequestDto } from '@/lib/validations/orderRequests'
import { createOrderRequest } from '@/lib/services/orderRequests'

export async function POST(request: NextRequest) {
  try {
    // Get the user session
    const session = await getServerSession(authConfig)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check if user is a client
    if (session.user.role !== 'CLIENT') {
      return NextResponse.json(
        { error: 'Only clients can create order requests' },
        { status: 403 }
      )
    }
    
    // Parse and validate the request body
    const body = await request.json()
    const { storeId, source, address } = CreateOrderRequestDto.parse(body)
    
    // Create the order request
    const orderRequest = await createOrderRequest({
      userId: BigInt(session.user.id),
      storeId: BigInt(storeId),
      source,
      address
    })
    
    return NextResponse.json(orderRequest)
  } catch (error) {
    console.error('Error creating order request:', error)
    return NextResponse.json(
      { error: 'Failed to create order request' },
      { status: 500 }
    )
  }
}