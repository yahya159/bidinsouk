import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { getThreadMessages } from '@/lib/services/messages'

export async function GET(
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
    
    // Get the thread with participants
    const thread = await prisma.messageThread.findUnique({
      where: { id: threadId },
      include: {
        participants: {
          include: {
            user: true
          }
        }
      }
    })
    
    if (!thread) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      )
    }
    
    // Get the messages
    const messages = await getThreadMessages(threadId)
    
    return NextResponse.json({
      thread,
      messages
    })
  } catch (error) {
    console.error('Error fetching thread:', error)
    return NextResponse.json(
      { error: 'Failed to fetch thread' },
      { status: 500 }
    )
  }
}