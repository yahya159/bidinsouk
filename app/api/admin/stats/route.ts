import { NextRequest, NextResponse } from 'next/server'
import { getPlatformStats, getHistoricalStats, getRecentActivity } from '@/lib/services/admin'

function getCurrentUser(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  const role = req.headers.get('x-user-role')
  if (!userId) return null
  return { userId: BigInt(userId), role }
}

export async function GET(req: NextRequest) {
  try {
    const user = getCurrentUser(req)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Récupérer les paramètres de requête
    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get('days') || '30')
    
    // Récupérer les statistiques de base
    const stats = await getPlatformStats()
    
    // Récupérer les statistiques historiques si demandé
    const historical = await getHistoricalStats(days)
    
    // Récupérer l'activité récente
    const recentActivity = await getRecentActivity(10)
    
    return NextResponse.json({ stats, historical, recentActivity })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}