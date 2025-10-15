import { NextRequest, NextResponse } from 'next/server'
import { getPlatformStats, getHistoricalStats, getRecentActivity } from '@/lib/services/admin'
import { requireRole } from '@/lib/auth/api-auth'

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, ['ADMIN'])

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
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    if (error.message === 'Forbidden') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
