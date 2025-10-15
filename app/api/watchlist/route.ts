import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/config';
import { getWatchlist, addToWatchlist, removeFromWatchlist } from '@/lib/services/watchlist';
import { getClientId } from '@/lib/auth/api-auth';

// GET /api/watchlist - Get user's watchlist
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const clientId = await getClientId(request);
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID non trouvé' },
        { status: 400 }
      );
    }

    const watchlist = await getWatchlist(clientId);

    return NextResponse.json({
      success: true,
      watchlist: watchlist
    });

  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user) {
      return NextResponse.json(
        { 
          error: 'Vous devez être connecté pour ajouter aux favoris',
          redirectTo: '/login'
        },
        { status: 401 }
      );
    }

    const clientId = await getClientId(request);
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID non trouvé' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { productId, action } = body;

    // Validation
    if (!productId || !action || !['add', 'remove'].includes(action)) {
      return NextResponse.json(
        { error: 'Données de requête invalides' },
        { status: 400 }
      );
    }

    const productIdBigInt = BigInt(productId);

    let result;
    if (action === 'add') {
      try {
        result = await addToWatchlist(clientId, productIdBigInt);
      } catch (error: any) {
        if (error.message === 'Product already in watchlist') {
          return NextResponse.json(
            { error: 'Produit déjà dans la liste de souhaits' },
            { status: 409 }
          );
        }
        throw error;
      }
    } else {
      try {
        result = await removeFromWatchlist(clientId, productIdBigInt);
      } catch (error: any) {
        return NextResponse.json(
          { error: 'Produit non trouvé dans la liste de souhaits' },
          { status: 404 }
        );
      }
    }

    const isWatchlisted = action === 'add';

    return NextResponse.json({
      success: true,
      productId,
      isWatchlisted
    });

  } catch (error) {
    console.error('Error updating watchlist:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
