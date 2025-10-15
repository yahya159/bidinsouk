import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/config';

// Mock data for development
const mockReviews = [
  {
    id: '1',
    rating: 5,
    title: 'Excellent produit !',
    comment: 'Très satisfait de mon achat. Le produit correspond parfaitement à la description et la livraison a été rapide.',
    images: ['https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop'],
    status: 'PENDING',
    verified: false,
    author: {
      name: 'Ahmed Benali',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    },
    product: {
      id: '1',
      title: 'iPhone 14 Pro Max',
      image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=100&h=100&fit=crop',
    },
    createdAt: '2024-01-15T10:00:00Z',
    spamScore: 0.1,
  },
  {
    id: '2',
    rating: 4,
    title: 'Bon rapport qualité-prix',
    comment: 'Produit de bonne qualité, quelques petites rayures mais rien de grave pour le prix.',
    status: 'APPROVED',
    verified: true,
    author: {
      name: 'Fatima Zahra',
    },
    product: {
      id: '2',
      title: 'MacBook Air M2',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=100&h=100&fit=crop',
    },
    createdAt: '2024-01-14T15:30:00Z',
    vendorResponse: {
      message: 'Merci pour votre avis ! Nous sommes ravis que vous soyez satisfait.',
      createdAt: '2024-01-14T16:00:00Z',
    },
    spamScore: 0.05,
  },
  {
    id: '3',
    rating: 1,
    title: 'Très déçu',
    comment: 'Le produit ne fonctionne pas du tout. Arnaque totale !!! Je ne recommande pas ce vendeur.',
    status: 'FLAGGED',
    verified: false,
    author: {
      name: 'Utilisateur Anonyme',
    },
    product: {
      id: '3',
      title: 'Casque Bluetooth',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop',
    },
    createdAt: '2024-01-13T09:20:00Z',
    spamScore: 0.85,
  },
  {
    id: '4',
    rating: 3,
    title: 'Correct sans plus',
    comment: 'Le produit fait le travail mais la qualité pourrait être meilleure. Livraison dans les temps.',
    status: 'APPROVED',
    verified: true,
    author: {
      name: 'Youssef Alami',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    },
    product: {
      id: '4',
      title: 'Chargeur USB-C',
      image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=100&h=100&fit=crop',
    },
    createdAt: '2024-01-12T14:20:00Z',
    spamScore: 0.02,
  },
  {
    id: '5',
    rating: 5,
    title: 'Parfait !',
    comment: 'Exactement ce que je cherchais. Qualité au top et service client réactif.',
    status: 'APPROVED',
    verified: true,
    author: {
      name: 'Aicha Benali',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop',
    },
    product: {
      id: '5',
      title: 'Sac à dos Laptop',
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=100&h=100&fit=crop',
    },
    createdAt: '2024-01-11T09:15:00Z',
    vendorResponse: {
      message: 'Merci beaucoup pour ce retour positif ! Nous sommes ravis que le produit vous plaise.',
      createdAt: '2024-01-11T10:30:00Z',
    },
    spamScore: 0.01,
  },
];

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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const rating = searchParams.get('rating') || '';

    // Filter reviews based on search parameters
    let filteredReviews = mockReviews;

    if (search) {
      filteredReviews = filteredReviews.filter(review =>
        review.title.toLowerCase().includes(search.toLowerCase()) ||
        review.comment.toLowerCase().includes(search.toLowerCase()) ||
        review.product.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (status && status !== 'ALL') {
      filteredReviews = filteredReviews.filter(review => review.status === status);
    }

    if (rating) {
      filteredReviews = filteredReviews.filter(review => review.rating === parseInt(rating));
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedReviews = filteredReviews.slice(startIndex, endIndex);

    // Calculate stats
    const stats = {
      total: mockReviews.length,
      pending: mockReviews.filter(r => r.status === 'PENDING').length,
      approved: mockReviews.filter(r => r.status === 'APPROVED').length,
      flagged: mockReviews.filter(r => r.status === 'FLAGGED').length,
      rejected: mockReviews.filter(r => r.status === 'REJECTED').length,
      averageRating: mockReviews.reduce((acc, r) => acc + r.rating, 0) / mockReviews.length,
    };

    return NextResponse.json({
      reviews: paginatedReviews,
      stats,
      pagination: {
        page,
        limit,
        total: filteredReviews.length,
        totalPages: Math.ceil(filteredReviews.length / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des avis' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const user = session.user;
    
    if (user.role !== 'VENDOR' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();
    const { reviewId, action, response } = body;

    // Handle different actions
    switch (action) {
      case 'APPROVE':
      case 'REJECT':
      case 'FLAG':
        // In a real implementation, update the review status in the database
        console.log(`Review ${reviewId} ${action.toLowerCase()}ed by ${user.id}`);
        break;
      
      case 'RESPOND':
        // In a real implementation, add vendor response to the database
        console.log(`Vendor response added to review ${reviewId}: ${response}`);
        break;
      
      default:
        return NextResponse.json({ error: 'Action non valide' }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Action effectuée avec succès' 
    });

  } catch (error) {
    console.error('Error processing review action:', error);
    return NextResponse.json(
      { error: 'Erreur lors du traitement de l\'action' },
      { status: 500 }
    );
  }
}
