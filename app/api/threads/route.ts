import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'
import { CreateThreadDto } from '@/lib/validations/messages'
import { createThread } from '@/lib/services/messages'

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
    
    // Parse and validate the request body
    const body = await request.json()
    const { title, participants } = CreateThreadDto.parse(body)
    
    // Create the thread
    const thread = await createThread({
      creatorId: BigInt(session.user.id),
      title,
      participants: participants.map(id => BigInt(id))
    })
    
    return NextResponse.json(thread)
  } catch (error) {
    console.error('Error creating thread:', error)
    return NextResponse.json(
      { error: 'Failed to create thread' },
      { status: 500 }
    )
  }
}