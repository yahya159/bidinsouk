import { PrismaClient, UserRole, StoreStatus, AuctionStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const vendor = await prisma.user.upsert({
    where: { email: 'vendor@demo.local' },
    update: {},
    create: {
      email: 'vendor@demo.local',
      name: 'Demo Vendor',
      role: UserRole.VENDOR
    },
  })

  const store = await prisma.store.create({
    data: {
      sellerId: vendor.id,
      name: 'Demo Store',
      slug: 'demo-store',
      email: 'store@demo.local',
      phone: '000',
      status: StoreStatus.active
    }
  })

  const prod = await prisma.product.create({
    data: {
      storeId: store.id,
      title: 'Sample Product',
      status: 'draft'
    }
  })

  await prisma.auction.create({
    data: {
      productId: prod.id,
      storeId: store.id,
      title: 'Sample Auction',
      status: AuctionStatus.scheduled
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