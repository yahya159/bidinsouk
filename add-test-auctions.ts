import { PrismaClient, ProductCondition, ProductStatus, AuctionStatus, StoreStatus } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

const prisma = new PrismaClient()

async function main() {
  console.log('Adding test auctions...')
  
  // Create a vendor and vendor profile
  console.log('Creating a demo vendor...')
  const newVendor = await prisma.user.upsert({
    where: { email: 'test-vendor@example.com' },
    update: {},
    create: {
      email: 'test-vendor@example.com',
      name: 'Test Vendor',
      password: 'password123', // In a real app, this should be hashed
      role: 'VENDOR'
    }
  })
  
  // Create vendor profile if it doesn't exist
  const vendorProfile = await prisma.vendor.upsert({
    where: { userId: newVendor.id },
    update: {},
    create: {
      userId: newVendor.id
    }
  })
  
  // Create or get store
  const store = await prisma.store.upsert({
    where: { slug: 'test-store' },
    update: {},
    create: {
      sellerId: vendorProfile.id,
      name: 'Test Store',
      slug: 'test-store',
      email: 'store@test.com',
      phone: '+212 6 12 34 56 78',
      status: StoreStatus.ACTIVE
    }
  })
  
  console.log('Using vendor and store:', { vendor: newVendor.id, store: store.id })
  
  // Create some test products
  const products = [
    {
      storeId: store.id,
      title: 'iPhone 15 Pro Max 256GB - Neuf',
      brand: 'Apple',
      category: 'Smartphones',
      condition: ProductCondition.NEW,
      status: ProductStatus.ACTIVE
    },
    {
      storeId: store.id,
      title: 'MacBook Pro M2 16 pouces',
      brand: 'Apple',
      category: 'Ordinateurs',
      condition: ProductCondition.NEW,
      status: ProductStatus.ACTIVE
    },
    {
      storeId: store.id,
      title: 'Téléviseur Samsung 65 pouces QLED',
      brand: 'Samsung',
      category: 'TV & Home Cinema',
      condition: ProductCondition.NEW,
      status: ProductStatus.ACTIVE
    },
    {
      storeId: store.id,
      title: 'Vélo électrique Xiaomi Pro 2',
      brand: 'Xiaomi',
      category: 'Sports & Loisirs',
      condition: ProductCondition.NEW,
      status: ProductStatus.ACTIVE
    },
    {
      storeId: store.id,
      title: 'Appareil photo Canon EOS R5',
      brand: 'Canon',
      category: 'Photo & Caméras',
      condition: ProductCondition.USED,
      status: ProductStatus.ACTIVE
    }
  ]
  
  const createdProducts = []
  for (const productData of products) {
    const product = await prisma.product.create({
      data: productData
    })
    createdProducts.push(product)
    console.log('Created product:', product.title)
  }
  
  // Create auctions for these products
  const now = new Date()
  const auctions = [
    {
      productId: createdProducts[0].id,
      storeId: store.id,
      title: 'iPhone 15 Pro Max 256GB - Neuf',
      startPrice: new Decimal(9500),
      reservePrice: new Decimal(12000),
      minIncrement: new Decimal(100),
      startAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Started 1 day ago
      endAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // Ends in 2 days
      status: AuctionStatus.RUNNING
    },
    {
      productId: createdProducts[1].id,
      storeId: store.id,
      title: 'MacBook Pro M2 16 pouces',
      startPrice: new Decimal(18000),
      reservePrice: new Decimal(22000),
      minIncrement: new Decimal(200),
      startAt: new Date(now.getTime() - 12 * 60 * 60 * 1000), // Started 12 hours ago
      endAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // Ends in 5 days
      status: AuctionStatus.RUNNING
    },
    {
      productId: createdProducts[2].id,
      storeId: store.id,
      title: 'Téléviseur Samsung 65 pouces QLED',
      startPrice: new Decimal(6500),
      reservePrice: new Decimal(8000),
      minIncrement: new Decimal(100),
      startAt: new Date(now.getTime() - 6 * 60 * 60 * 1000), // Started 6 hours ago
      endAt: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // Ends in 1 day
      status: AuctionStatus.RUNNING
    },
    {
      productId: createdProducts[3].id,
      storeId: store.id,
      title: 'Vélo électrique Xiaomi Pro 2',
      startPrice: new Decimal(3200),
      reservePrice: new Decimal(4000),
      minIncrement: new Decimal(50),
      startAt: new Date(),
      endAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // Ends in 3 days
      status: AuctionStatus.SCHEDULED
    },
    {
      productId: createdProducts[4].id,
      storeId: store.id,
      title: 'Appareil photo Canon EOS R5',
      startPrice: new Decimal(12000),
      reservePrice: new Decimal(15000),
      minIncrement: new Decimal(150),
      startAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // Started 2 days ago
      endAt: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000), // Ends in 4 days
      status: AuctionStatus.RUNNING
    }
  ]
  
  for (const auctionData of auctions) {
    // Check if auction already exists
    const existingAuction = await prisma.auction.findFirst({
      where: {
        productId: auctionData.productId,
        storeId: auctionData.storeId
      }
    })
    
    if (!existingAuction) {
      const auction = await prisma.auction.create({
        data: {
          productId: auctionData.productId,
          storeId: auctionData.storeId,
          title: auctionData.title,
          startPrice: auctionData.startPrice,
          reservePrice: auctionData.reservePrice,
          minIncrement: auctionData.minIncrement,
          currentBid: new Decimal(0),
          startAt: auctionData.startAt,
          endAt: auctionData.endAt,
          status: auctionData.status
        }
      })
      console.log('Created auction:', auction.title)
    } else {
      console.log('Auction already exists for product:', auctionData.title)
    }
  }
  
  console.log('✅ Test auctions added successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error adding test auctions:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })