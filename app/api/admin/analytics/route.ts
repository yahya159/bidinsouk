import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireRole } from '@/lib/auth/api-auth'

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, ['ADMIN'])

    const { searchParams } = new URL(req.url)
    const range = searchParams.get('range') || '30d'
    const category = searchParams.get('category') || 'all'

    // Calculer la date de début en fonction de la période
    const endDate = new Date()
    const startDate = new Date()
    
    switch (range) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '90d':
        startDate.setDate(startDate.getDate() - 90)
        break
      case '365d':
        startDate.setDate(startDate.getDate() - 365)
        break
      default: // 30d
        startDate.setDate(startDate.getDate() - 30)
        break
    }

    // Récupérer les données analytiques admin
    const [
      totalRevenue,
      totalOrders,
      avgOrderValue,
      salesData,
      trafficData,
      topProductsData,
      categoryPerformanceData
    ] = await Promise.all([
      // Revenus totaux
      prisma.order.aggregate({
        where: { 
          status: 'CONFIRMED',
          createdAt: { gte: startDate, lte: endDate }
        },
        _sum: { total: true }
      }),
      
      // Nombre total de commandes
      prisma.order.count({ 
        where: { 
          status: 'CONFIRMED',
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      
      // Valeur moyenne des commandes
      prisma.order.aggregate({
        where: { 
          status: 'CONFIRMED',
          createdAt: { gte: startDate, lte: endDate }
        },
        _avg: { total: true }
      }),
      
      // Données de ventes pour le graphique
      prisma.$queryRaw`
        SELECT DATE(createdAt) as date, 
               SUM(total) as revenue, 
               COUNT(*) as orders
        FROM \`Order\`
        WHERE status = 'CONFIRMED' 
        AND createdAt >= ?
        AND createdAt <= ?
        GROUP BY DATE(createdAt)
        ORDER BY DATE(createdAt)
      `,
      startDate,
      endDate,
      
      // Données de trafic (simulation)
      prisma.$queryRaw`
        SELECT DATE(createdAt) as date, 
               COUNT(*) as visitors, 
               SUM(views) as pageViews
        FROM Product
        WHERE createdAt >= ?
        AND createdAt <= ?
        GROUP BY DATE(createdAt)
        ORDER BY DATE(createdAt)
      `,
      startDate,
      endDate,
      
      // Top produits
      prisma.product.findMany({
        take: 10,
        orderBy: { id: 'desc' },
        select: {
          id: true,
          title: true
        }
      }),
      
      // Performance par catégorie
      prisma.$queryRaw`
        SELECT p.category, 
               SUM(o.total) as revenue, 
               COUNT(o.id) as orders,
               0 as growth
        FROM Product p
        JOIN \`Order\` o ON p.storeId = o.storeId
        WHERE o.status = 'CONFIRMED'
        AND o.createdAt >= ?
        AND o.createdAt <= ?
        ${category !== 'all' ? 'AND p.category = ?' : ''}
        GROUP BY p.category
        ORDER BY revenue DESC
        LIMIT 10
      `,
      startDate,
      endDate,
      ...(category !== 'all' ? [category] : [])
    ])

    // Calculer les KPIs
    const kpis = {
      totalRevenue: totalRevenue._sum.total ? Number(totalRevenue._sum.total) : 0,
      totalOrders: totalOrders,
      conversionRate: totalOrders > 0 ? parseFloat(((totalOrders / (totalOrders + 100)) * 100).toFixed(1)) : 0,
      averageOrderValue: avgOrderValue._avg.total ? Number(avgOrderValue._avg.total) : 0
    }

    // Formater les données pour les graphiques
    const salesChart = Array.isArray(salesData) 
      ? salesData.map((item: any) => ({
          date: item.date instanceof Date ? item.date.toISOString() : item.date,
          revenue: Number(item.revenue),
          orders: Number(item.orders)
        }))
      : []
    
    const trafficChart = Array.isArray(trafficData) 
      ? trafficData.map((item: any) => ({
          date: item.date instanceof Date ? item.date.toISOString() : item.date,
          visitors: Number(item.visitors),
          pageViews: Number(item.pageViews)
        }))
      : []
    
    const topProducts = Array.isArray(topProductsData) 
      ? topProductsData.map((product: any) => ({
          id: product.id.toString(),
          name: product.title,
          revenue: 0, // Valeur par défaut
          orders: 0, // Valeur par défaut
          views: 0, // Valeur par défaut
          image: '/placeholder.jpg' // Image par défaut
        }))
      : []
    
    const categoryPerformance = Array.isArray(categoryPerformanceData)
      ? categoryPerformanceData.map((item: any) => ({
          category: item.category || 'Non catégorisé',
          revenue: Number(item.revenue),
          orders: Number(item.orders),
          growth: Number(item.growth)
        }))
      : []

    return NextResponse.json({
      kpis,
      salesChart,
      trafficChart,
      topProducts,
      categoryPerformance
    })
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
    console.error('Error fetching admin analytics data:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
