import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDuplicateProducts() {
  try {
    console.log('🧹 Cleaning up duplicate products...');

    // Delete products without prices (the old ones)
    const deletedProducts = await prisma.product.deleteMany({
      where: {
        price: null
      }
    });

    console.log(`✅ Deleted ${deletedProducts.count} products without prices`);

    // Delete auctions for products that no longer exist
    const deletedAuctions = await prisma.auction.deleteMany({
      where: {
        product: null
      }
    });

    console.log(`✅ Deleted ${deletedAuctions.count} orphaned auctions`);

    // Show remaining products
    const remainingProducts = await prisma.product.findMany({
      include: {
        store: {
          select: {
            name: true
          }
        }
      }
    });

    console.log(`✅ Remaining products: ${remainingProducts.length}`);
    remainingProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.title} - ${product.price} MAD`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDuplicateProducts();