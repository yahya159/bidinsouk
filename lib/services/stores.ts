import { prisma } from '@/lib/db/prisma'

// Fonction utilitaire pour gérer les erreurs BigInt dans JSON
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

export async function createStore(vendorId: bigint, data: {
  name: string
  slug: string
  email: string
  phone?: string
  address?: any
}) {
  try {
    console.log('=== DÉBUT createStore ===');
    console.log('vendorId:', vendorId.toString());
    console.log('data:', JSON.stringify(data, null, 2));
    
    const existing = await prisma.store.findUnique({
      where: { slug: data.slug }
    })
    
    console.log('Boutique existante avec ce slug:', existing ? 'oui' : 'non');

    if (existing) {
      console.log('Slug déjà utilisé - lancement erreur');
      throw new Error('Ce slug est déjà utilisé')
    }

    console.log('Création de la boutique...');
    const store = await prisma.store.create({
      data: {
        sellerId: vendorId,
        name: data.name,
        slug: data.slug,
        email: data.email,
        phone: data.phone,
        address: data.address,
        status: 'PENDING'
      }
    })
    
    console.log('Boutique créée avec succès:', JSON.stringify(store, (key, value) => 
      typeof value === 'bigint' ? value.toString() : value, 2));
    console.log('=== FIN createStore ===');
    
    return store;
  } catch (error: any) {
    console.error('=== ERREUR DANS createStore ===');
    console.error('Message d\'erreur:', error.message);
    console.error('Stack trace:', error.stack);
    console.error('=== FIN ERREUR createStore ===');
    throw error;
  }
}

export async function listStores(filters: {
  vendorId?: bigint
  status?: string
}) {
  try {
    console.log('=== DÉBUT listStores ===');
    console.log('filters:', JSON.stringify(filters, (key, value) => 
      typeof value === 'bigint' ? value.toString() : value, 2));
    
    const where: any = {}

    if (filters.vendorId) {
      where.sellerId = filters.vendorId;
      console.log('Filtre sellerId appliqué:', filters.vendorId.toString());
    }
    if (filters.status) {
      where.status = filters.status;
      console.log('Filtre status appliqué:', filters.status);
    }

    console.log('Requête Prisma where:', JSON.stringify(where, (key, value) => 
      typeof value === 'bigint' ? value.toString() : value, 2));
    
    console.log('Exécution de la requête Prisma...');
    const stores = await prisma.store.findMany({
      where,
      include: {
        seller: {
          include: {
            user: { select: { name: true, avatarUrl: true } }
          }
        }
      }
    })
    
    console.log('Magasins trouvés:', stores.length);
    console.log('=== FIN listStores ===');
    return stores;
  } catch (error: any) {
    console.error('=== ERREUR DANS listStores ===');
    console.error('Message d\'erreur:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Vérifier si c'est une erreur de conversion BigInt
    if (error.message && error.message.includes('BigInt')) {
      console.error('Erreur de conversion BigInt détectée dans listStores');
    }
    
    console.error('=== FIN ERREUR listStores ===');
    throw error;
  }
}

export async function getStoreBySlug(slug: string) {
  const store = await prisma.store.findUnique({
    where: { slug },
    include: {
      seller: {
        include: {
          user: { select: { name: true, avatarUrl: true } }
        }
      }
    }
  })
  
  // Convertir les BigInt en string pour éviter les erreurs de sérialisation
  return convertBigIntToString(store);
}

export async function updateStore(storeId: bigint, vendorId: bigint, data: any) {
  const store = await prisma.store.findFirst({
    where: { id: storeId, sellerId: vendorId }
  })

  if (!store) throw new Error('Store not found')

  return prisma.store.update({
    where: { id: storeId },
    data
  })
}