import { PrismaClient, Role, StoreStatus, AuctionStatus, ProductCondition, ProductStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Unsplash image collections by category
const images = {
  electronics: [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800',
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800',
    'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800',
  ],
  furniture: [
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
    'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=800',
    'https://images.unsplash.com/photo-1550254478-ead40cc54513?w=800',
  ],
  fashion: [
    'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800',
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800',
    'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800',
    'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800',
  ],
  sports: [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800',
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800',
  ],
  books: [
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800',
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800',
  ],
  home: [
    'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800',
    'https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=800',
    'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800',
  ]
};

async function main() {
  console.log('🌱 Starting comprehensive database seed...\n');

  // Clean up existing data (optional - comment out if you want to keep existing data)
  console.log('🧹 Cleaning up existing data...');
  await prisma.bid.deleteMany();
  await prisma.auction.deleteMany();
  await prisma.product.deleteMany();
  await prisma.order.deleteMany();
  await prisma.store.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.client.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.user.deleteMany();

  // Hash passwords
  const password = await bcrypt.hash('password123', 10);

  // 1. Create Admin User
  console.log('👤 Creating admin user...');
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@bidinsouk.ma',
      name: 'Admin Principal',
      password,
      role: Role.ADMIN,
      roles: JSON.stringify(['ADMIN']),
      phone: '+212 600-000001',
      locale: 'fr',
    },
  });

  await prisma.admin.create({
    data: {
      userId: adminUser.id,
    },
  });

  // 2. Create Client Users
  console.log('👥 Creating client users...');
  const clients = [];
  
  const clientData = [
    { name: 'Hassan Alami', email: 'hassan@example.ma', phone: '+212 600-111111' },
    { name: 'Fatima Zahra', email: 'fatima@example.ma', phone: '+212 600-222222' },
    { name: 'Youssef Bennani', email: 'youssef@example.ma', phone: '+212 600-333333' },
    { name: 'Samira Idrissi', email: 'samira@example.ma', phone: '+212 600-444444' },
    { name: 'Karim Tazi', email: 'karim@example.ma', phone: '+212 600-555555' },
  ];

  for (const data of clientData) {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password,
        role: Role.CLIENT,
        roles: JSON.stringify(['CLIENT']),
        phone: data.phone,
        locale: 'fr',
      },
    });

    const client = await prisma.client.create({
      data: {
        userId: user.id,
      },
    });

    clients.push(client);
    console.log(`  ✓ Created client: ${data.name}`);
  }

  // 3. Create Vendor Users with Stores
  console.log('\n🏪 Creating vendors and stores...');
  
  const vendorData = [
    {
      name: 'TechStore Maroc',
      email: 'tech@techstore.ma',
      businessName: 'TechStore Maroc SARL',
      businessType: 'COMPANY',
      category: 'Électronique',
    },
    {
      name: 'Mobilier Premium',
      email: 'contact@mobilierpremium.ma',
      businessName: 'Mobilier Premium',
      businessType: 'COMPANY',
      category: 'Maison & Jardin',
    },
    {
      name: 'Mode Casablanca',
      email: 'info@modecasa.ma',
      businessName: 'Mode Casablanca',
      businessType: 'INDIVIDUAL',
      category: 'Mode & Vêtements',
    },
  ];

  const stores = [];

  for (let i = 0; i < vendorData.length; i++) {
    const data = vendorData[i];
    
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password,
        role: Role.VENDOR,
        roles: JSON.stringify(['VENDOR']),
        phone: `+212 600-${600000 + i}`,
        locale: 'fr',
      },
    });

    const vendor = await prisma.vendor.create({
      data: {
        userId: user.id,
      },
    });

    const store = await prisma.store.create({
      data: {
        sellerId: vendor.id,
        name: data.name,
        slug: data.name.toLowerCase().replace(/\s+/g, '-'),
        email: data.email,
        phone: user.phone,
        status: StoreStatus.ACTIVE,
        approvedAt: new Date(),
        description: `Boutique spécialisée en ${data.category}`,
      },
    });

    stores.push({ store, vendor, category: data.category });
    console.log(`  ✓ Created store: ${data.name}`);
  }

  // 4. Create Products and Auctions
  console.log('\n📦 Creating products and auctions...');

  const productsData = [
    // Electronics
    {
      storeIdx: 0,
      title: 'iPhone 15 Pro Max 256GB',
      description: 'iPhone 15 Pro Max neuf, couleur Titane Naturel, 256GB de stockage. Garantie officielle Apple 1 an.',
      category: 'Électronique',
      condition: ProductCondition.NEW,
      price: 15999,
      images: images.electronics.slice(0, 3),
      auction: { startPrice: 12000, reservePrice: 14000, minIncrement: 100, days: 3 }
    },
    {
      storeIdx: 0,
      title: 'MacBook Pro M3 14 pouces',
      description: 'MacBook Pro 14 pouces avec puce M3, 16GB RAM, 512GB SSD. État neuf.',
      category: 'Électronique',
      condition: ProductCondition.NEW,
      price: 22999,
      images: images.electronics.slice(1, 4),
      auction: { startPrice: 18000, reservePrice: 20000, minIncrement: 200, days: 5 }
    },
    {
      storeIdx: 0,
      title: 'AirPods Pro 2ème génération',
      description: 'AirPods Pro avec réduction de bruit active, boîtier de charge MagSafe.',
      category: 'Électronique',
      condition: ProductCondition.NEW,
      price: 2899,
      images: images.electronics.slice(2, 4),
      auction: { startPrice: 2000, reservePrice: 2500, minIncrement: 50, days: 2 }
    },

    // Furniture
    {
      storeIdx: 1,
      title: 'Canapé 3 places en cuir véritable',
      description: 'Magnifique canapé en cuir véritable, très bon état, couleur marron cognac. Dimensions: 220x90x85cm',
      category: 'Maison & Jardin',
      condition: ProductCondition.USED,
      price: 4500,
      images: images.furniture.slice(0, 3),
      auction: { startPrice: 2500, reservePrice: 3500, minIncrement: 100, days: 7 }
    },
    {
      storeIdx: 1,
      title: 'Table à manger en bois massif',
      description: 'Table à manger rectangulaire en chêne massif, 6 personnes. Dimensions: 180x90cm',
      category: 'Maison & Jardin',
      condition: ProductCondition.NEW,
      price: 3200,
      images: images.furniture.slice(1, 4),
      auction: { startPrice: 2000, reservePrice: 2800, minIncrement: 75, days: 4 }
    },
    {
      storeIdx: 1,
      title: 'Lit King Size avec matelas',
      description: 'Lit King Size moderne avec tête de lit capitonnée, matelas orthopédique inclus.',
      category: 'Maison & Jardin',
      condition: ProductCondition.NEW,
      price: 5500,
      images: images.furniture.slice(2, 4),
      auction: { startPrice: 3500, reservePrice: 4500, minIncrement: 150, days: 6 }
    },

    // Fashion
    {
      storeIdx: 2,
      title: 'Robe de soirée élégante',
      description: 'Robe de soirée longue, couleur bleu marine, taille M. Parfait pour les événements formels.',
      category: 'Mode & Vêtements',
      condition: ProductCondition.NEW,
      price: 899,
      images: images.fashion.slice(0, 3),
      auction: { startPrice: 400, reservePrice: 650, minIncrement: 25, days: 2 }
    },
    {
      storeIdx: 2,
      title: 'Sac à main en cuir designer',
      description: 'Sac à main en cuir véritable, design élégant, plusieurs compartiments.',
      category: 'Mode & Vêtements',
      condition: ProductCondition.NEW,
      price: 1299,
      images: images.fashion.slice(1, 4),
      auction: { startPrice: 800, reservePrice: 1000, minIncrement: 50, days: 3 }
    },
    {
      storeIdx: 2,
      title: 'Montre automatique homme',
      description: 'Montre automatique de luxe, bracelet en acier inoxydable, étanche 100m.',
      category: 'Mode & Vêtements',
      condition: ProductCondition.NEW,
      price: 2499,
      images: images.fashion.slice(2, 4),
      auction: { startPrice: 1500, reservePrice: 2000, minIncrement: 100, days: 5 }
    },
  ];

  for (const data of productsData) {
    const { store } = stores[data.storeIdx];
    
    // Create product with images
    const product = await prisma.product.create({
      data: {
        storeId: store.id,
        title: data.title,
        description: data.description,
        category: data.category,
        condition: data.condition,
        price: data.price,
        status: ProductStatus.ACTIVE,
        images: JSON.stringify(
          data.images.map((url, idx) => ({ url, alt: `${data.title} - Image ${idx + 1}` }))
        ),
      },
    });

    // Create auction
    const auction = await prisma.auction.create({
      data: {
        productId: product.id,
        storeId: store.id,
        title: `Enchère: ${product.title}`,
        description: data.description,
        category: data.category,
        startPrice: data.auction.startPrice,
        currentBid: data.auction.startPrice,
        reservePrice: data.auction.reservePrice,
        minIncrement: data.auction.minIncrement,
        startAt: new Date(),
        endAt: new Date(Date.now() + data.auction.days * 24 * 60 * 60 * 1000),
        status: AuctionStatus.RUNNING,
        autoExtend: true,
        images: JSON.stringify(
          data.images.map((url, idx) => ({ url, alt: `${data.title} - Image ${idx + 1}` }))
        ),
      },
    });

    console.log(`  ✓ Created product & auction: ${product.title}`);

    // Add some bids to make it realistic
    if (clients.length > 0) {
      const numBids = Math.floor(Math.random() * 3) + 1;
      let currentBid = data.auction.startPrice;

      for (let i = 0; i < numBids; i++) {
        const randomClient = clients[Math.floor(Math.random() * clients.length)];
        currentBid += data.auction.minIncrement;

        await prisma.bid.create({
          data: {
            auctionId: auction.id,
            clientId: randomClient.id,
            amount: currentBid,
            status: 'ACTIVE',
          },
        });

        // Update auction's current bid
        await prisma.auction.update({
          where: { id: auction.id },
          data: { currentBid },
        });
      }
      console.log(`    ✓ Added ${numBids} bid(s)`);
    }
  }

  // 5. Create some additional regular products (non-auction)
  console.log('\n🛍️ Creating additional regular products...');
  
  const regularProducts = [
    {
      storeIdx: 0,
      title: 'Clavier mécanique RGB',
      description: 'Clavier gaming mécanique avec rétroéclairage RGB, switches Cherry MX.',
      category: 'Électronique',
      condition: ProductCondition.NEW,
      price: 799,
      images: images.electronics.slice(0, 2),
    },
    {
      storeIdx: 1,
      title: 'Lampe de bureau LED',
      description: 'Lampe de bureau moderne avec variation d\'intensité et température de couleur.',
      category: 'Maison & Jardin',
      condition: ProductCondition.NEW,
      price: 299,
      images: images.home.slice(0, 2),
    },
    {
      storeIdx: 2,
      title: 'Baskets de sport Nike',
      description: 'Baskets de running Nike, taille 42, neuves avec boîte.',
      category: 'Mode & Vêtements',
      condition: ProductCondition.NEW,
      price: 899,
      images: images.sports.slice(0, 2),
    },
  ];

  for (const data of regularProducts) {
    const { store } = stores[data.storeIdx];
    
    await prisma.product.create({
      data: {
        storeId: store.id,
        title: data.title,
        description: data.description,
        category: data.category,
        condition: data.condition,
        price: data.price,
        status: ProductStatus.ACTIVE,
        images: JSON.stringify(
          data.images.map((url, idx) => ({ url, alt: `${data.title} - Image ${idx + 1}` }))
        ),
      },
    });

    console.log(`  ✓ Created product: ${data.title}`);
  }

  console.log('\n✅ Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   👤 Admin: 1`);
  console.log(`   👥 Clients: ${clients.length}`);
  console.log(`   🏪 Vendors: ${stores.length}`);
  console.log(`   📦 Products: ${productsData.length + regularProducts.length}`);
  console.log(`   ⚡ Auctions: ${productsData.length}`);
  console.log('\n🔐 Login credentials (all users):');
  console.log(`   Email: <user-email>`);
  console.log(`   Password: password123`);
  console.log('\n   Admin: admin@bidinsouk.ma');
  console.log(`   Example Client: ${clientData[0].email}`);
  console.log(`   Example Vendor: ${vendorData[0].email}`);
}

main()
  .catch((error) => {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

