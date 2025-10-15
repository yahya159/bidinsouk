import { NextRequest, NextResponse } from 'next/server'
import { getUnreadCount } from '@/lib/services/notifications'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig)
    
    if (!session?.user) {
      return NextResponse.json({ count: 0 }) // Retourner 0 au lieu d'une erreur pour éviter les problèmes UX
    }

    const count = await getUnreadCount(BigInt(session.user.id))
    return NextResponse.json({ count })
  } catch (error: any) {
    return NextResponse.json({ count: 0 }) // Retourner 0 en cas d'erreur pour éviter les problèmes UX
  }
}
