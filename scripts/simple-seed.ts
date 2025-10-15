import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Unsplash image collections by category
const images = {
  electronics: [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800',
  ],
  furniture: [
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
    'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=800',
  ],
  fashion: [
    'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800',
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800',
    'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800',
  ],
};

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clean up existing data
  console.log('🧹 Cleaning up existing data...');
  await prisma.bid.deleteMany();
  await prisma.auction.deleteMany();
  await prisma.product.deleteMany();
  await prisma.store.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.client.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.user.deleteMany();
  console.log('  ✓ Cleanup complete\n');

  // Hash password
  const password = await bcrypt.hash('password123', 10);

  // 1. Create Admin
  console.log('👤 Creating admin...');
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@bidinsouk.ma',
      name: 'Admin Principal',
      password,
      role: 'ADMIN',
      roles: JSON.stringify(['ADMIN']),
      locale: 'fr',
    },
  });

  await prisma.admin.create({
    data: { userId: adminUser.id },
  });
  console.log('  ✓ Admin created');

  // 2. Create Clients
  console.log('\n👥 Creating clients...');
  const clientData = [
    { name: 'Hassan Alami', email: 'hassan@example.ma' },
    { name: 'Fatima Zahra', email: 'fatima@example.ma' },
    { name: 'Samira Idrissi', email: 'samira@example.ma' },
  ];

  const clients = [];
  for (const data of clientData) {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password,
        role: 'CLIENT',
        roles: JSON.stringify(['CLIENT']),
        locale: 'fr',
      },
    });

    const client = await prisma.client.create({
      data: { userId: user.id },
    });

    clients.push(client);
    console.log(`  ✓ ${data.name}`);
  }

  // 3. Create Vendor & Store
  console.log('\n🏪 Creating vendor and store...');
  const vendorUser = await prisma.user.create({
    data: {
      email: 'vendor@bidinsouk.ma',
      name: 'TechStore Maroc',
      password,
      role: 'VENDOR',
      roles: JSON.stringify(['VENDOR']),
      locale: 'fr',
    },
  });

  const vendor = await prisma.vendor.create({
    data: { userId: vendorUser.id },
  });

  const store = await prisma.store.create({
    data: {
      sellerId: vendor.id,
      name: 'TechStore Maroc',
      slug: 'techstore-maroc',
      email: 'contact@techstore.ma',
      phone: '+212 600-123456',
      status: 'ACTIVE',
    },
  });
  console.log('  ✓ Vendor and store created');

  // 4. Create Products & Auctions
  console.log('\n📦 Creating products and auctions...');
  
  const productsData = [
    {
      title: 'iPhone 15 Pro Max 256GB',
      description: 'iPhone 15 Pro Max neuf, couleur Titane Naturel, 256GB',
      category: 'Électronique',
      condition: 'NEW',
      price: 15999,
      images: images.electronics,
      auction: { startPrice: 12000, minIncrement: 100, days: 3 }
    },
    {
      title: 'Canapé 3 places en cuir',
      description: 'Magnifique canapé en cuir véritable, très bon état',
      category: 'Maison & Jardin',
      condition: 'USED',
      price: 4500,
      images: images.furniture,
      auction: { startPrice: 2500, minIncrement: 100, days: 5 }
    },
    {
      title: 'Robe de soirée élégante',
      description: 'Robe de soirée longue, couleur bleu marine, taille M',
      category: 'Mode & Vêtements',
      condition: 'NEW',
      price: 899,
      images: images.fashion,
      auction: { startPrice: 400, minIncrement: 25, days: 2 }
    },
  ];

  for (const data of productsData) {
    const product = await prisma.product.create({
      data: {
        storeId: store.id,
        title: data.title,
        description: data.description,
        category: data.category,
        condition: data.condition as any,
        price: data.price,
        status: 'ACTIVE',
        images: JSON.stringify(
          data.images.map((url, idx) => ({ url, alt: `${data.title} - ${idx + 1}` }))
        ),
      },
    });

    const auction = await prisma.auction.create({
      data: {
        productId: product.id,
        storeId: store.id,
        title: `Enchère: ${product.title}`,
        description: data.description,
        category: data.category,
        startPrice: data.auction.startPrice,
        currentBid: data.auction.startPrice,
        minIncrement: data.auction.minIncrement,
        startAt: new Date(),
        endAt: new Date(Date.now() + data.auction.days * 24 * 60 * 60 * 1000),
        status: 'RUNNING',
        images: JSON.stringify(
          data.images.map((url, idx) => ({ url, alt: `${data.title} - ${idx + 1}` }))
        ),
      },
    });

    console.log(`  ✓ ${product.title}`);

    // Add sample bids
    if (clients.length > 0) {
      const client = clients[0];
      const bidAmount = data.auction.startPrice + data.auction.minIncrement;

      await prisma.bid.create({
        data: {
          auctionId: auction.id,
          clientId: client.id,
          amount: bidAmount,
        },
      });

      await prisma.auction.update({
        where: { id: auction.id },
        data: { currentBid: bidAmount },
      });
    }
  }

  console.log('\n✅ Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   Admin: 1 (admin@bidinsouk.ma)`);
  console.log(`   Clients: ${clients.length}`);
  console.log(`   Vendors: 1`);
  console.log(`   Products: ${productsData.length}`);
  console.log(`   Auctions: ${productsData.length}`);
  console.log('\n🔐 Password for all users: password123');
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

