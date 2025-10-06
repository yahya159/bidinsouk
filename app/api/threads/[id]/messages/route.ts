import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { PostMessageDto } from '@/lib/validations/messages'
import { postMessage } from '@/lib/services/messages'

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
    
    const threadId = BigInt(params.id)
    
    // Check if user is a participant of the thread
    const participant = await prisma.threadParticipant.findUnique({
      where: {
        threadId_userId: {
          threadId,
          userId: BigInt(session.user.id)
        }
      }
    })
    
    if (!participant) {
      return NextResponse.json(
        { error: 'Forbidden: You are not a participant of this thread' },
        { status: 403 }
      )
    }
    
    // Parse and validate the request body
    const body = await request.json()
    const { body: messageBody, attachments } = PostMessageDto.parse(body)
    
    // Post the message
    const message = await postMessage({
      threadId,
      authorId: BigInt(session.user.id),
      body: messageBody,
      attachments
    })
    
    return NextResponse.json(message)
  } catch (error) {
    console.error('Error posting message:', error)
    return NextResponse.json(
      { error: 'Failed to post message' },
      { status: 500 }
    )
  }
}