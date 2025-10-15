import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/config';

// Mock analytics data for development
const generateMockAnalytics = (dateRange: string) => {
  const now = new Date();
  const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 365;
  
  // Generate sales data
  const salesData = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    salesData.push({
      date: date.toISOString().split('T')[0],
      revenue: Math.floor(Math.random() * 5000) + 1000,
      orders: Math.floor(Math.random() * 20) + 5,
    });
  }

  // Generate traffic data
  const trafficData = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    trafficData.push({
      date: date.toISOString().split('T')[0],
      visitors: Math.floor(Math.random() * 500) + 100,
      pageViews: Math.floor(Math.random() * 1500) + 300,
    });
  }

  const totalRevenue = salesData.reduce((sum, day) => sum + day.revenue, 0);
  const totalOrders = salesData.reduce((sum, day) => sum + day.orders, 0);
  const totalVisitors = trafficData.reduce((sum, day) => sum + day.visitors, 0);

  return {
    kpis: {
      totalRevenue,
      totalOrders,
      conversionRate: totalOrders > 0 ? ((totalOrders / totalVisitors) * 100) : 0,
      averageOrderValue: totalOrders > 0 ? (totalRevenue / totalOrders) : 0,
    },
    salesChart: salesData,
    trafficChart: trafficData,
    topProducts: [
      {
        id: '1',
        name: 'iPhone 14 Pro Max',
        revenue: 45000,
        orders: 15,
        views: 1250,
        image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=100&h=100&fit=crop',
      },
      {
        id: '2',
        name: 'MacBook Air M2',
        revenue: 38000,
        orders: 12,
        views: 980,
        image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=100&h=100&fit=crop',
      },
      {
        id: '3',
        name: 'AirPods Pro',
        revenue: 12000,
        orders: 24,
        views: 750,
        image: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=100&h=100&fit=crop',
      },
      {
        id: '4',
        name: 'iPad Pro',
        revenue: 28000,
        orders: 8,
        views: 650,
        image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=100&h=100&fit=crop',
      },
      {
        id: '5',
        name: 'Apple Watch Series 9',
        revenue: 15000,
        orders: 18,
        views: 580,
        image: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=100&h=100&fit=crop',
      },
    ],
    categoryPerformance: [
      { category: 'Électronique', revenue: 85000, orders: 45, growth: 12.5 },
      { category: 'Mode', revenue: 32000, orders: 28, growth: -3.2 },
      { category: 'Maison', revenue: 18000, orders: 15, growth: 8.7 },
      { category: 'Sport', revenue: 12000, orders: 12, growth: 15.3 },
    ],
  };
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const user = session.user;
    
    if (user.role !== 'VENDOR' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('range') || '30d';
    const category = searchParams.get('category') || '';

    // Generate mock analytics data
    const analyticsData = generateMockAnalytics(dateRange);

    // Filter by category if specified
    if (category && category !== 'all') {
      // In a real implementation, filter data by category
      console.log(`Filtering analytics by category: ${category}`);
    }

    return NextResponse.json(analyticsData);

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des données analytiques' },
      { status: 500 }
    );
  }
}
