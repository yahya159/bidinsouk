import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/config';

// Mock reports data
const mockReports = [
  {
    id: '1',
    title: 'Rapport des Ventes - Janvier 2024',
    type: 'sales',
    status: 'completed',
    createdAt: '2024-01-15T10:30:00Z',
    size: '2.3 MB',
    description: 'Analyse complète des ventes du mois de janvier incluant les revenus, les produits les plus vendus et les tendances.',
    data: {
      totalSales: 45600,
      totalOrders: 234,
      averageOrderValue: 195,
      topProducts: ['iPhone 14', 'MacBook Air', 'AirPods Pro']
    }
  },
  {
    id: '2',
    title: 'Inventaire - État des Stocks',
    type: 'inventory',
    status: 'completed',
    createdAt: '2024-01-14T15:45:00Z',
    size: '1.8 MB',
    description: 'Rapport détaillé de l\'état des stocks, produits en rupture et recommandations de réapprovisionnement.',
    data: {
      totalProducts: 156,
      lowStock: 12,
      outOfStock: 3,
      totalValue: 125000
    }
  },
  {
    id: '3',
    title: 'Analyse des Clients - Q4 2023',
    type: 'customers',
    status: 'completed',
    createdAt: '2024-01-10T09:15:00Z',
    size: '3.1 MB',
    description: 'Segmentation des clients, analyse de la fidélité et recommandations pour améliorer la rétention.',
    data: {
      totalCustomers: 1250,
      newCustomers: 89,
      returningCustomers: 456,
      averageLifetimeValue: 850
    }
  },
  {
    id: '4',
    title: 'Performance des Enchères',
    type: 'performance',
    status: 'processing',
    createdAt: '2024-01-16T14:20:00Z',
    size: 'En cours...',
    description: 'Analyse des performances des enchères, taux de conversion et optimisations suggérées.',
  },
  {
    id: '5',
    title: 'Rapport Financier - Décembre 2023',
    type: 'financial',
    status: 'completed',
    createdAt: '2024-01-05T11:00:00Z',
    size: '4.2 MB',
    description: 'Bilan financier complet incluant les revenus, dépenses, marges et projections.',
    data: {
      revenue: 78500,
      expenses: 23400,
      profit: 55100,
      margin: 70.2
    }
  },
  {
    id: '6',
    title: 'Analyse des Tendances - 2023',
    type: 'performance',
    status: 'failed',
    createdAt: '2024-01-12T16:30:00Z',
    size: 'Échec',
    description: 'Analyse des tendances de vente et prédictions pour 2024.',
  }
];

// GET /api/vendors/reports - Get all reports
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    // Development mode bypass
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (!session?.user && !isDevelopment) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (!isDevelopment && session?.user?.role !== 'VENDOR' && session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    let filteredReports = mockReports;

    // Filter by type
    if (type && type !== 'all') {
      filteredReports = filteredReports.filter(report => report.type === type);
    }

    // Filter by status
    if (status && status !== 'all') {
      filteredReports = filteredReports.filter(report => report.status === status);
    }

    // Calculate statistics
    const stats = {
      totalReports: mockReports.length,
      completedReports: mockReports.filter(r => r.status === 'completed').length,
      processingReports: mockReports.filter(r => r.status === 'processing').length,
      failedReports: mockReports.filter(r => r.status === 'failed').length,
    };

    return NextResponse.json({
      reports: filteredReports,
      stats,
    });

  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// POST /api/vendors/reports - Generate new report
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    // Development mode bypass
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (!session?.user && !isDevelopment) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (!isDevelopment && session?.user?.role !== 'VENDOR' && session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();
    const { type, title, description } = body;

    // Simulate report generation
    const newReport = {
      id: `report-${Date.now()}`,
      title: title || `Nouveau Rapport - ${new Date().toLocaleDateString('fr-FR')}`,
      type: type || 'sales',
      status: 'processing',
      createdAt: new Date().toISOString(),
      size: 'En cours...',
      description: description || 'Rapport généré automatiquement',
    };

    return NextResponse.json({
      message: 'Rapport en cours de génération',
      report: newReport,
    }, { status: 201 });

  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du rapport' },
      { status: 500 }
    );
  }
}