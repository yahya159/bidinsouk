import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

function getCurrentUser(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  const role = req.headers.get('x-user-role')
  if (!userId) return null
  return { userId, role }
}

export async function GET(req: NextRequest) {
  try {
    const user = getCurrentUser(req)
    if (!user || user.role !== 'VENDOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    // Récupérer les données analytiques vendeur
    const [
      storeRevenue,
      storeOrders,
      avgOrderValue,
      salesData,
      trafficData,
      topProductsData,
      categoryPerformanceData
    ] = await Promise.all([
      // Revenus de la boutique
      prisma.order.aggregate({
        where: { 
          store: {
            sellerId: BigInt(user.userId)
          },
          status: 'CONFIRMED',
          createdAt: { gte: startDate, lte: endDate }
        },
        _sum: { total: true }
      }),
      
      // Nombre de commandes de la boutique
      prisma.order.count({ 
        where: { 
          store: {
            sellerId: BigInt(user.userId)
          },
          status: 'CONFIRMED',
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      
      // Valeur moyenne des commandes
      prisma.order.aggregate({
        where: { 
          store: {
            sellerId: BigInt(user.userId)
          },
          status: 'CONFIRMED',
          createdAt: { gte: startDate, lte: endDate }
        },
        _avg: { total: true }
      }),
      
      // Données de ventes pour le graphique
      prisma.$queryRaw`
        SELECT DATE(o.createdAt) as date, 
               SUM(o.total) as revenue, 
               COUNT(*) as orders
        FROM \`Order\` o
        JOIN Store s ON o.storeId = s.id
        WHERE s.sellerId = ${BigInt(user.userId)}
        AND o.status = 'CONFIRMED' 
        AND o.createdAt >= ${startDate}
        AND o.createdAt <= ${endDate}
        GROUP BY DATE(o.createdAt)
        ORDER BY DATE(o.createdAt)
      `,
      
      // Données de trafic (simulation)
      prisma.$queryRaw`
        SELECT DATE(p.createdAt) as date, 
               COUNT(*) as visitors, 
               SUM(p.views) as pageViews
        FROM Product p
        JOIN Store s ON p.storeId = s.id
        WHERE s.sellerId = ${BigInt(user.userId)}
        AND p.createdAt >= ${startDate}
        AND p.createdAt <= ${endDate}
        GROUP BY DATE(p.createdAt)
        ORDER BY DATE(p.createdAt)
      `,
      
      // Top produits de la boutique
      prisma.product.findMany({
        where: {
          store: {
            sellerId: BigInt(user.userId)
          }
        },
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
        JOIN Store s ON p.storeId = s.id
        JOIN \`Order\` o ON p.storeId = o.storeId
        WHERE s.sellerId = ${BigInt(user.userId)}
        AND o.status = 'CONFIRMED'
        AND o.createdAt >= ${startDate}
        AND o.createdAt <= ${endDate}
        ${category !== 'all' ? `AND p.category = ${category}` : ''}
        GROUP BY p.category
        ORDER BY revenue DESC
        LIMIT 10
      `
    ])

    // Calculer les KPIs
    const kpis = {
      totalRevenue: storeRevenue._sum.total ? Number(storeRevenue._sum.total) : 0,
      totalOrders: storeOrders,
      conversionRate: storeOrders > 0 ? parseFloat(((storeOrders / (storeOrders + 50)) * 100).toFixed(1)) : 0,
      averageOrderValue: avgOrderValue._avg.total ? Number(avgOrderValue._avg.total) : 0
    }

    // Formater les données pour les graphiques
    const salesChart = Array.isArray(salesData) 
      ? salesData.map((item: any) => ({
          date: item.date.toISOString(),
          revenue: Number(item.revenue),
          orders: Number(item.orders)
        }))
      : []
    
    const trafficChart = Array.isArray(trafficData) 
      ? trafficData.map((item: any) => ({
          date: item.date.toISOString(),
          visitors: Number(item.visitors),
          pageViews: Number(item.pageViews)
        }))
      : []
    
    const topProducts = topProductsData.map((product: any) => ({
      id: product.id.toString(),
      name: product.title,
      revenue: 0, // Valeur par défaut
      orders: 0, // Valeur par défaut
      views: 0, // Valeur par défaut
      image: '/placeholder.jpg' // Image par défaut
    }))
    
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
    console.error('Error fetching vendor analytics data:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}