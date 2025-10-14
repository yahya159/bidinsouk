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

    // Retourner des données de test pour vérifier que l'API fonctionne
    const testData = {
      metrics: {
        revenue: 25280,
        revenueChange: 8.5,
        orders: 86,
        ordersChange: -1.2,
        activeAuctions: 12,
        auctionsChange: 5.7,
        conversionRate: 2.8,
        conversionChange: 0.8
      },
      charts: {
        salesData: [
          { name: '1 Jan', value: 800 },
          { name: '5 Jan', value: 1200 },
          { name: '10 Jan', value: 900 },
          { name: '15 Jan', value: 1500 },
          { name: '20 Jan', value: 1100 },
          { name: '25 Jan', value: 1800 },
          { name: '30 Jan', value: 1400 },
        ],
        categoryData: [
          { name: 'Électronique', value: 45, color: '#228be6' },
          { name: 'Mode', value: 30, color: '#40c057' },
          { name: 'Maison', value: 15, color: '#fab005' },
          { name: 'Sport', value: 7, color: '#fd7e14' },
          { name: 'Autres', value: 3, color: '#e64980' },
        ]
      },
      recentActivity: {
        orders: [
          {
            id: '1',
            type: 'order',
            title: 'Nouvelle commande #54321',
            description: 'Samsung Galaxy S23 - 750 MAD',
            time: 'Il y a 10 min',
            icon: 'ShoppingBag',
            color: 'blue',
          },
          {
            id: '2',
            type: 'bid',
            title: 'Nouvelle enchère',
            description: 'iPhone 14 - 900 MAD',
            time: 'Il y a 25 min',
            icon: 'Gavel',
            color: 'orange',
          }
        ],
        auctions: [
          {
            id: '3',
            type: 'review',
            title: 'Nouvel avis ⭐⭐⭐⭐',
            description: 'Casque Bluetooth - "Très bon son"',
            time: 'Il y a 30 min',
            icon: 'MessageSquare',
            color: 'green',
          },
          {
            id: '4',
            type: 'stock',
            title: 'Stock faible',
            description: 'Coque iPhone - 5 unités restantes',
            time: 'Il y a 1h',
            icon: 'Clock',
            color: 'red',
          }
        ]
      }
    }

    return NextResponse.json(testData)
  } catch (error: any) {
    console.error('Error fetching vendor dashboard data:', error)
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