import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig)
    
    return NextResponse.json({
      session: session,
      hasSession: !!session,
      user: session?.user,
      role: session?.user?.role,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error in debug session API:', error)
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
