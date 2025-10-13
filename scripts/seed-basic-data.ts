import { prisma } from '@/lib/db/prisma';

async function seedBasicData() {
  try {
    console.log('🌱 Starting basic data seeding...');

    // Create a test user
    const user = await prisma.user.upsert({
      where: { email: 'vendor@test.com' },
      update: {},
      create: {
        email: 'vendor@test.com',
        name: 'Test Vendor',
        password: 'hashed_password',
        role: 'VENDOR',
      },
    });

    console.log('✅ User created:', user.email);

    // Create vendor profile
    const vendor = await prisma.vendor.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
      },
    });

    console.log('✅ Vendor created for user:', user.email);

    // Create a store
    const store = await prisma.store.upsert({
      where: { slug: 'test-store' },
      update: {},
      create: {
        sellerId: vendor.id,
        name: 'Test Store',
        slug: 'test-store',
        email: 'store@test.com',
        status: 'ACTIVE',
      },
    });

    console.log('✅ Store created:', store.name);

    // Create a test auction
    const auction = await prisma.auction.create({
      data: {
        storeId: store.id,
        title: 'Test Auction Item',
        description: 'This is a test auction item for development',
        category: 'Electronics',
        startPrice: 100,
        currentBid: 100,
        minIncrement: 10,
        startAt: new Date(),
        endAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        status: 'RUNNING',
        images: JSON.stringify([
          { url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400', alt: 'Test item' }
        ]),
      },
    });

    console.log('✅ Test auction created:', auction.title);

    console.log('🎉 Basic data seeding completed successfully!');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedBasicData();