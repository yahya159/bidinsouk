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
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Testons chaque requête individuellement avec un try/catch
    let totalOrders = 0;
    try {
      totalOrders = await prisma.order.count({ where: { status: 'CONFIRMED' } });
      console.log('Orders count successful:', totalOrders);
    } catch (error) {
      console.error('Error fetching orders count:', error);
    }
    
    let totalRevenue: any = { _sum: { total: null } };
    try {
      totalRevenue = await prisma.order.aggregate({
        where: { status: 'CONFIRMED' },
        _sum: { total: true }
      });
      console.log('Revenue aggregate successful:', totalRevenue);
    } catch (error) {
      console.error('Error fetching revenue aggregate:', error);
    }
    
    let totalAuctions = 0;
    try {
      totalAuctions = await prisma.auction.count();
      console.log('Auctions count successful:', totalAuctions);
    } catch (error) {
      console.error('Error fetching auctions count:', error);
    }
    
    let totalUsers = 0;
    try {
      totalUsers = await prisma.user.count();
      console.log('Users count successful:', totalUsers);
    } catch (error) {
      console.error('Error fetching users count:', error);
    }
    
    // Calculer les KPIs
    const revenue = totalRevenue._sum.total ? Number(totalRevenue._sum.total) : 0
    const orders = totalOrders
    const auctions = totalAuctions
    const users = totalUsers
    
    // Calculer les variations (simplifié pour l'exemple)
    const revenueChange = 12.5
    const ordersChange = -3.2
    const auctionsChange = 8.7
    const conversionChange = 1.2
    
    // Calculer le taux de conversion
    const conversionRate = orders > 0 ? parseFloat(((orders / users) * 100).toFixed(1)) : 0

    return NextResponse.json({
      metrics: {
        revenue,
        revenueChange,
        orders,
        ordersChange,
        activeAuctions: auctions,
        auctionsChange,
        conversionRate,
        conversionChange
      },
      charts: {
        salesData: [
          { name: '1 Jan', value: 1200 },
          { name: '5 Jan', value: 1800 },
          { name: '10 Jan', value: 1600 },
          { name: '15 Jan', value: 2200 },
          { name: '20 Jan', value: 1900 },
          { name: '25 Jan', value: 2400 },
          { name: '30 Jan', value: 2100 },
        ],
        categoryData: [
          { name: 'Électronique', value: 35, color: '#228be6' },
          { name: 'Mode', value: 25, color: '#40c057' },
          { name: 'Maison', value: 20, color: '#fab005' },
          { name: 'Sport', value: 12, color: '#fd7e14' },
          { name: 'Autres', value: 8, color: '#e64980' },
        ]
      },
      recentActivity: {
        orders: [],
        auctions: []
      }
    })
  } catch (error: any) {
    console.error('Error fetching admin dashboard data:', error)
    // Log more detailed error information
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return NextResponse.json({ 
      error: 'Erreur lors du chargement des données du tableau de bord',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

// Fonction utilitaire pour formater le temps écoulé
function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) return 'À l\'instant'
  if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `Il y a ${diffInHours}h`
  
  const diffInDays = Math.floor(diffInHours / 24)
  return `Il y a ${diffInDays}j`
}