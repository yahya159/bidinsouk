import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Récupérer la liste des vendeurs actifs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active') === 'true';

    // Construire les filtres
    const where: any = {};
    
    if (active) {
      where.stores = {
        some: {
          status: 'ACTIVE'
        }
      };
    }

    // Récupérer les vendeurs
    const vendors = await prisma.vendor.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        stores: {
          where: {
            status: 'ACTIVE'
          },
          select: {
            id: true,
            name: true,
            slug: true
          },
          take: 1 // Prendre le premier store actif
        }
      },
      take: 50 // Limiter à 50 vendeurs
    });

    // Formater les données
    const formattedVendors = vendors.map(vendor => ({
      id: vendor.id,
      name: vendor.user.name,
      email: vendor.user.email,
      avatar: vendor.user.image,
      storeName: vendor.stores[0]?.name || 'Boutique sans nom',
      storeSlug: vendor.stores[0]?.slug
    }));

    return NextResponse.json({
      vendors: formattedVendors
    });

  } catch (error) {
    console.error('Erreur GET /api/vendors:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}