import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedProductsAndAuctions() {
  try {
    console.log('🌱 Starting to seed products and auctions...');

    // First, let's create a default vendor and store if they don't exist
    let vendor = await prisma.vendor.findFirst({
      include: { stores: true }
    });

    if (!vendor) {
      // Create a user first
      const user = await prisma.user.create({
        data: {
          email: 'vendor@bidinsouk.com',
          name: 'Vendeur Demo',
          role: 'VENDOR',
          emailVerified: new Date(),
        }
      });

      vendor = await prisma.vendor.create({
        data: {
          userId: user.id,
        },
        include: { stores: true }
      });
    }

    // Create a store if it doesn't exist
    let store = await prisma.store.findFirst({
      where: { sellerId: vendor.id, status: 'ACTIVE' }
    });

    if (!store) {
      store = await prisma.store.create({
        data: {
          sellerId: vendor.id,
          name: 'TechStore Maroc',
          slug: 'techstore-maroc',
          email: 'contact@techstore-maroc.com',
          status: 'ACTIVE',
        }
      });
    }

    // Create 5 products in different categories
    const products = [
      {
        title: 'iPhone 15 Pro Max 256GB',
        category: 'Électronique',
        condition: 'NEW' as const,
        description: 'iPhone 15 Pro Max neuf, couleur Titane Naturel, 256GB de stockage',
        price: 15999.00,
        images: [
          { url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800', alt: 'iPhone 15 Pro Max' }
        ]
      },
      {
        title: 'Canapé 3 places en cuir véritable',
        category: 'Maison & Jardin',
        condition: 'USED' as const,
        description: 'Magnifique canapé en cuir véritable, très bon état, couleur marron',
        price: 4500.00,
        images: [
          { url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800', alt: 'Canapé en cuir' }
        ]
      },
      {
        title: 'Robe de soirée élégante',
        category: 'Mode & Vêtements',
        condition: 'NEW' as const,
        description: 'Robe de soirée longue, couleur bleu marine, taille M',
        price: 899.00,
        images: [
          { url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800', alt: 'Robe de soirée' }
        ]
      },
      {
        title: 'Vélo de montagne Trek',
        category: 'Sports & Loisirs',
        condition: 'USED' as const,
        description: 'Vélo de montagne Trek en excellent état, 21 vitesses',
        price: 3200.00,
        images: [
          { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', alt: 'Vélo de montagne' }
        ]
      },
      {
        title: 'Livre "L\'Art de la Programmation"',
        category: 'Livres & Médias',
        condition: 'USED' as const,
        description: 'Livre technique sur la programmation, état comme neuf',
        price: 150.00,
        images: [
          { url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800', alt: 'Livre de programmation' }
        ]
      }
    ];

    const createdProducts = [];
    for (const productData of products) {
      const product = await prisma.product.create({
        data: {
          storeId: store.id,
          title: productData.title,
          category: productData.category,
          condition: productData.condition,
          price: productData.price,
          status: 'ACTIVE',
        }
      });
      createdProducts.push(product);
      console.log(`✅ Created product: ${product.title}`);
    }

    // Create 5 auctions for these products
    const auctionData = [
      {
        productIndex: 0, // iPhone
        startPrice: 12000.00,
        reservePrice: 14000.00,
        minIncrement: 100.00,
        endAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      },
      {
        productIndex: 1, // Canapé
        startPrice: 2500.00,
        reservePrice: 3500.00,
        minIncrement: 50.00,
        endAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      },
      {
        productIndex: 2, // Robe
        startPrice: 400.00,
        reservePrice: 600.00,
        minIncrement: 25.00,
        endAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      },
      {
        productIndex: 3, // Vélo
        startPrice: 2000.00,
        reservePrice: 2800.00,
        minIncrement: 75.00,
        endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
      {
        productIndex: 4, // Livre
        startPrice: 80.00,
        reservePrice: 120.00,
        minIncrement: 10.00,
        endAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
      }
    ];

    for (const auctionInfo of auctionData) {
      const product = createdProducts[auctionInfo.productIndex];
      
      const auction = await prisma.auction.create({
        data: {
          productId: product.id,
          storeId: store.id,
          title: `Enchère: ${product.title}`,
          startPrice: auctionInfo.startPrice,
          currentBid: auctionInfo.startPrice,
          reservePrice: auctionInfo.reservePrice,
          minIncrement: auctionInfo.minIncrement,
          startAt: new Date(),
          endAt: auctionInfo.endAt,
          status: 'RUNNING',
          category: product.category,
        }
      });

      console.log(`✅ Created auction: ${auction.title}`);
    }

    console.log('🎉 Successfully seeded 5 products and 5 auctions!');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedProductsAndAuctions()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });