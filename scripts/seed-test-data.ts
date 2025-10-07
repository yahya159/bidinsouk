/**
 * Seed Test Data Script
 * 
 * Creates test data for endpoint testing
 * Run with: npx tsx scripts/seed-test-data.ts
 */

import { prisma } from '../lib/db/prisma'
import { hash } from 'bcryptjs'

async function seedTestData() {
  console.log('🌱 Starting database seeding...\n')

  try {
    // 1. Create Test Users
    console.log('👤 Creating test users...')
    
    const testPassword = await hash('password123', 10)
    
    // Client User
    const clientUser = await prisma.user.upsert({
      where: { email: 'client@test.com' },
      update: {},
      create: {
        email: 'client@test.com',
        name: 'Test Client',
        password: testPassword,
        role: 'CLIENT',
        client: {
          create: {}
        }
      }
    })
    console.log('  ✅ Client user created')

    // Vendor User
    const vendorUser = await prisma.user.upsert({
      where: { email: 'vendor@test.com' },
      update: {},
      create: {
        email: 'vendor@test.com',
        name: 'Test Vendor',
        password: testPassword,
        role: 'VENDOR',
        vendor: {
          create: {}
        }
      }
    })
    console.log('  ✅ Vendor user created')

    // Admin User
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@test.com' },
      update: {},
      create: {
        email: 'admin@test.com',
        name: 'Test Admin',
        password: testPassword,
        role: 'ADMIN',
        admin: {
          create: {}
        }
      }
    })
    console.log('  ✅ Admin user created')

    // 2. Create Test Store
    console.log('\n🏪 Creating test store...')
    
    const vendor = await prisma.vendor.findUnique({
      where: { userId: vendorUser.id }
    })

    if (!vendor) {
      throw new Error('Vendor profile not found')
    }

    const store = await prisma.store.upsert({
      where: { slug: 'test-electronics-store' },
      update: {},
      create: {
        sellerId: vendor.id,
        name: 'Test Electronics Store',
        slug: 'test-electronics-store',
        email: 'store@test.com',
        phone: '+1234567890',
        status: 'ACTIVE'
      }
    })
    console.log('  ✅ Store created')

    // 3. Create Test Products
    console.log('\n📦 Creating test products...')
    
    const products = []
    for (let i = 1; i <= 5; i++) {
      const product = await prisma.product.create({
        data: {
          storeId: store.id,
          title: `Test Product ${i}`,
          brand: i % 2 === 0 ? 'Samsung' : 'Apple',
          category: 'Electronics',
          condition: i % 2 === 0 ? 'NEW' : 'USED',
          status: 'ACTIVE'
        }
      })
      products.push(product)
      console.log(`  ✅ Product ${i} created`)
    }

    // 4. Create Test Offers
    console.log('\n💰 Creating test offers...')
    
    for (let i = 0; i < products.length; i++) {
      await prisma.offer.create({
        data: {
          productId: products[i].id,
          price: (i + 1) * 100,
          promoPct: i % 2 === 0 ? 10 : null,
          active: true
        }
      })
      console.log(`  ✅ Offer for product ${i + 1} created`)
    }

    // 5. Create Test Auctions
    console.log('\n🎯 Creating test auctions...')
    
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    
    for (let i = 0; i < 2; i++) {
      await prisma.auction.create({
        data: {
          productId: products[i].id,
          storeId: store.id,
          title: `Test Auction ${i + 1}`,
          startPrice: 50 + (i * 50),
          minIncrement: 5,
          currentBid: 0,
          startAt: now,
          endAt: tomorrow,
          status: 'RUNNING'
        }
      })
      console.log(`  ✅ Auction ${i + 1} created`)
    }

    // 6. Create Test Banner
    console.log('\n🎨 Creating test banner...')
    await prisma.banner.create({
      data: {
        slot: 'homepage-hero',
        content: {
          title: 'Welcome to Bidinsouk',
          description: 'Find amazing deals and exciting auctions',
          imageUrl: '/banner.jpg',
          ctaText: 'Browse Now',
          ctaLink: '/products'
        }
      }
    })
    console.log('  ✅ Banner created')

    // Print Summary
    console.log('\n' + '='.repeat(60))
    console.log('\n✅ Database seeded successfully!\n')
    console.log('Test Users:')
    console.log('  👤 Client: client@test.com / password123')
    console.log('  🏪 Vendor: vendor@test.com / password123')
    console.log('  👑 Admin: admin@test.com / password123')
    console.log('\nTest Data:')
    console.log(`  📦 Products: 5`)
    console.log(`  💰 Offers: 5`)
    console.log(`  🎯 Auctions: 2`)
    console.log(`  🏪 Stores: 1`)
    console.log(`  🎨 Banners: 1`)
    console.log('\n' + '='.repeat(60))

  } catch (error) {
    console.error('\n❌ Error seeding database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedTestData()
  .then(() => {
    console.log('\n🎉 Seeding completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Seeding failed:', error)
    process.exit(1)
  })

