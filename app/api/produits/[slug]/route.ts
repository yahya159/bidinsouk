import { NextRequest, NextResponse } from 'next/server';
import type { ProductPageData } from '@/types/auction';

// Mock data - in production, this would come from your database
const mockData: Record<string, ProductPageData> = {
  'casque-enfant-sans-fil-citytek': {
    product: {
      id: '1',
      slug: 'casque-enfant-sans-fil-citytek',
      title: 'Casque Enfant Sans Fil CityTek - Bluetooth 5.0 avec Contrôle Parental',
      descriptionHtml: `
        <div class="space-y-4">
          <p>Casque audio sans fil spécialement conçu pour les enfants avec limitation de volume pour protéger leur audition.</p>
          <h3 class="font-semibold">Caractéristiques principales :</h3>
          <ul class="list-disc list-inside space-y-1">
            <li>Bluetooth 5.0 pour une connexion stable</li>
            <li>Limitation de volume à 85dB pour la sécurité auditive</li>
            <li>Autonomie de 20 heures</li>
            <li>Design ergonomique et coloré</li>
            <li>Microphone intégré pour les appels</li>
          </ul>
        </div>
      `,
      images: [
        { url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800', alt: 'Casque CityTek vue principale' },
        { url: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800', alt: 'Casque CityTek vue latérale' },
        { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', alt: 'Casque CityTek détails' }
      ],
      category: { id: 'electronics', name: 'Électronique', slug: 'electronique' },
      seller: {
        id: 'seller1',
        name: 'TechStore Maroc',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
        rating: 4.8,
        storeSlug: 'techstore-maroc'
      },
      specs: {
        'Marque': 'CityTek',
        'Modèle': 'CT-K200',
        'Connectivité': 'Bluetooth 5.0',
        'Autonomie': '20 heures',
        'Couleur': 'Bleu/Orange'
      },
      condition: 'Neuf',
      startingBidMAD: 150,
      currentBidMAD: 280,
      minIncrementMAD: 10,
      reserveMet: true,
      endsAtISO: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      timezone: 'UTC +1',
      watchlisted: false
    },
    bids: [
      {
        id: '1',
        bidder: { id: '1', displayName: 'client***', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' },
        amountMAD: 280,
        placedAtISO: new Date(Date.now() - 5 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        bidder: { id: '2', displayName: 'ahmed***', avatarUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100' },
        amountMAD: 270,
        placedAtISO: new Date(Date.now() - 15 * 60 * 1000).toISOString()
      }
    ],
    similar: [
      {
        id: '2',
        slug: 'casque-gaming-pro',
        title: 'Casque Gaming Pro RGB',
        descriptionHtml: '',
        images: [{ url: 'https://images.unsplash.com/photo-1599669454699-248893623440?w=400', alt: 'Casque Gaming' }],
        category: { id: 'electronics', name: 'Électronique', slug: 'electronique' },
        seller: {
          id: 'seller2',
          name: 'GameZone',
          storeSlug: 'gamezone'
        },
        condition: 'Neuf',
        startingBidMAD: 200,
        currentBidMAD: 320,
        minIncrementMAD: 15,
        reserveMet: false,
        endsAtISO: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        timezone: 'UTC +1'
      }
    ]
  }
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // Simulate database lookup
    const data = mockData[slug];
    
    if (!data) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}