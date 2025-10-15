import { PrismaClient, Role, StoreStatus, AuctionStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const vendor = await prisma.user.upsert({
    where: { email: 'vendor@demo.local' },
    update: {},
    create: {
      email: 'vendor@demo.local',
      name: 'Demo Vendor',
      role: Role.VENDOR,
      password: 'hashed_password_here'
    },
  })

  const store = await prisma.store.create({
    data: {
      sellerId: vendor.id,
      name: 'Demo Store',
      slug: 'demo-store',
      email: 'store@demo.local',
      phone: '000',
      status: StoreStatus.ACTIVE
    }
  })

  const prod = await prisma.product.create({
    data: {
      storeId: store.id,
      title: 'Sample Product',
      status: 'DRAFT'
    }
  })

  await prisma.auction.create({
    data: {
      productId: prod.id,
      storeId: store.id,
      title: 'Sample Auction',
      status: AuctionStatus.SCHEDULED,
      minIncrement: 10,
      startPrice: 100,
      endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  })
}

main()
  .then(() => {
    console.log('✅ Database seeded successfully!')
  })
  .catch((error) => {
    console.error('❌ Error seeding database:', error)
    throw error
  })
  .finally(async () => {
    await prisma.$disconnect()
  })