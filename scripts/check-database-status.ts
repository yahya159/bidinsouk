#!/usr/bin/env tsx

/**
 * Script to check the current status of products and auctions in the database
 */

import { prisma } from '../lib/db/prisma';

async function checkDatabaseStatus() {
  console.log('📊 Checking database status...\n');

  try {
    // Count products
    const productCount = await prisma.product.count();
    console.log(`📦 Products: ${productCount}`);

    // Count auctions
    const auctionCount = await prisma.auction.count();
    console.log(`🔨 Auctions: ${auctionCount}`);

    // Count offers
    const offerCount = await prisma.offer.count();
    console.log(`💰 Offers: ${offerCount}`);

    // Count bids
    const bidCount = await prisma.bid.count();
    console.log(`🎯 Bids: ${bidCount}`);

    // Count watchlist items
    const watchlistCount = await prisma.watchlistItem.count();
    console.log(`❤️ Watchlist items: ${watchlistCount}`);

    // Count product images
    let imageCount = 0;
    try {
      imageCount = await prisma.productImage.count();
    } catch (error) {
      // ProductImage table might not exist
    }
    console.log(`🖼️ Product images: ${imageCount}`);

    // Count stores (these will remain)
    const storeCount = await prisma.store.count();
    console.log(`🏪 Stores: ${storeCount} (will be preserved)`);

    // Count users (these will remain)
    const userCount = await prisma.user.count();
    console.log(`👥 Users: ${userCount} (will be preserved)`);

    console.log('\n' + '='.repeat(50));
    
    const totalItems = productCount + auctionCount + offerCount + bidCount + watchlistCount + imageCount;
    
    if (totalItems === 0) {
      console.log('✅ Database is clean - no products or auctions found');
    } else {
      console.log(`📈 Total items to be cleaned: ${totalItems}`);
      console.log('\nRun "tsx scripts/cleanup-all-data.ts" to clean the database');
    }

  } catch (error) {
    console.error('❌ Error checking database:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkDatabaseStatus();