import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getAuctionIds() {
  try {
    console.log('🔍 Getting auction IDs...');

    const auctions = await prisma.auction.findMany({
      select: {
        id: true,
        title: true,
        status: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`✅ Found ${auctions.length} auctions:`);
    
    auctions.forEach((auction, index) => {
      console.log(`${index + 1}. ID: ${auction.id} - ${auction.title} (${auction.status})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getAuctionIds();