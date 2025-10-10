import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'
import { CreateStoreDto } from '@/lib/validations/stores'
import { createStore, listStores } from '@/lib/services/stores'
import { prisma } from '@/lib/db/prisma'
import { ZodError } from 'zod'

// Fonction utilitaire pour gérer les erreurs BigInt dans JSON
function stringifyWithBigInt(obj: any): string {
  return JSON.stringify(obj, (key, value) => 
    typeof value === 'bigint' ? value.toString() : value
  );
}

// Fonction pour convertir les BigInt en string dans les objets
function convertBigIntToString(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToString);
  }
  
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = convertBigIntToString(obj[key]);
      }
    }
    return result;
  }
  
  return obj;
}

export async function GET(request: NextRequest) {
  try {
    console.log('=== DÉBUT Requête GET /api/stores ===');
    console.log('Headers:', Object.fromEntries(request.headers));
    
    const session = await getServerSession(authConfig)
    console.log('Session utilisateur:', session ? 'présente' : 'absente');
    
    if (session?.user) {
      console.log('User ID:', session.user.id);
      console.log('User email:', session.user.email);
    }

    if (!session?.user) {
      console.log('Utilisateur non authentifié - retourne 401');
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    console.log('Recherche du vendeur pour userId:', session.user.id);
    
    // Ajout d'un timeout pour la requête Prisma
    const vendor = await Promise.race([
      prisma.vendor.findUnique({
        where: { userId: BigInt(session.user.id) }
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout recherche vendeur')), 5000)
      )
    ]).catch(error => {
      console.error('Erreur lors de la recherche du vendeur:', error.message);
      throw error;
    });
    
    console.log('Vendeur trouvé:', vendor ? `ID ${convertBigIntToString((vendor as any).id)}` : 'non');

    // Si l'utilisateur n'est pas un vendeur, retourner un tableau vide au lieu d'une erreur
    if (!vendor) {
      console.log('Utilisateur n\'est pas un vendeur - retourne tableau vide');
      return NextResponse.json({ stores: [] })
    }

    // Récupérer les magasins du vendeur
    console.log('Récupération des magasins pour le vendeur:', convertBigIntToString((vendor as any).id));
    
    // Ajout d'un timeout pour la requête listStores
    const stores = await Promise.race([
      listStores({ vendorId: (vendor as any).id }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout récupération magasins')), 5000)
      )
    ]).catch(error => {
      console.error('Erreur lors de la récupération des magasins:', error.message);
      throw error;
    });
    
    console.log('Magasins récupérés:', (stores as any[]).length);

    console.log('=== FIN Requête GET /api/stores - Succès ===');
    // Convertir les BigInt en string avant d'envoyer la réponse
    return NextResponse.json({ stores: convertBigIntToString(stores) })
  } catch (error: any) {
    console.error('=== ERREUR DANS GET /api/stores ===');
    console.error('Type d\'erreur:', Object.prototype.toString.call(error));
    console.error('Message d\'erreur:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Vérifier si c'est une erreur de conversion BigInt
    if (error.message && error.message.includes('BigInt')) {
      console.error('Erreur de conversion BigInt détectée');
    }
    
    // Gérer les timeouts
    if (error.message && error.message.includes('Timeout')) {
      console.error('Timeout détecté:', error.message);
      return NextResponse.json(
        { error: 'Le serveur met trop de temps à répondre. Veuillez réessayer.' },
        { status: 504 }
      )
    }
    
    console.error('=== FIN ERREUR GET /api/stores ===');
    
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des boutiques' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== DÉBUT Requête POST /api/stores ===');
    
    const session = await getServerSession(authConfig)
    console.log('Session utilisateur:', session ? 'présente' : 'absente');

    if (!session?.user) {
      console.log('Utilisateur non authentifié - retourne 401');
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    console.log('Recherche du vendeur pour userId:', session.user.id);
    
    // Ajout d'un timeout pour la requête Prisma
    const vendor = await Promise.race([
      prisma.vendor.findUnique({
        where: { userId: BigInt(session.user.id) }
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout recherche vendeur')), 5000)
      )
    ]).catch(error => {
      console.error('Erreur lors de la recherche du vendeur:', error.message);
      throw error;
    });
    
    console.log('Vendeur trouvé:', vendor ? `ID ${convertBigIntToString((vendor as any).id)}` : 'non');

    if (!vendor) {
      console.log('Accès vendeur requis - retourne 403');
      return NextResponse.json({ error: 'Accès vendeur requis' }, { status: 403 })
    }

    const body = await request.json()
    console.log('Corps de la requête POST /api/stores:', stringifyWithBigInt(body));
    
    const data = CreateStoreDto.parse(body)
    console.log('Données validées:', stringifyWithBigInt(data));

    // Ajout d'un timeout pour la création de la boutique
    const store = await Promise.race([
      createStore((vendor as any).id, data),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout création boutique')), 5000)
      )
    ]).catch(error => {
      console.error('Erreur lors de la création de la boutique:', error.message);
      throw error;
    });
    
    console.log('Boutique créée:', stringifyWithBigInt(store));

    console.log('=== FIN Requête POST /api/stores - Succès ===');
    // Convertir les BigInt en string avant d'envoyer la réponse
    return NextResponse.json({ message: 'Boutique créée avec succès', store: convertBigIntToString(store) })
  } catch (error: any) {
    console.error('=== ERREUR DANS POST /api/stores ===');
    console.error('Type d\'erreur:', Object.prototype.toString.call(error));
    console.error('Message d\'erreur:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Gérer les erreurs de validation Zod
    if (error instanceof ZodError) {
      console.error('Erreurs de validation Zod:', error.issues);
      const fieldErrors = error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message
      }))
      return NextResponse.json(
        { error: 'Données invalides', details: fieldErrors },
        { status: 400 }
      )
    }
    
    // Gérer les erreurs de duplication de slug
    if (error.message && error.message.includes('slug')) {
      console.log('Erreur de duplication de slug');
      return NextResponse.json(
        { error: 'Une boutique avec ce nom existe déjà. Veuillez choisir un nom différent.' },
        { status: 400 }
      )
    }
    
    // Gérer les timeouts
    if (error.message && error.message.includes('Timeout')) {
      console.error('Timeout détecté:', error.message);
      return NextResponse.json(
        { error: 'Le serveur met trop de temps à répondre. Veuillez réessayer.' },
        { status: 504 }
      )
    }
    
    console.error('=== FIN ERREUR POST /api/stores ===');
    
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création de la boutique' },
      { status: 500 }
    )
  }
}