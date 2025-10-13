#!/usr/bin/env tsx

/**
 * Script to delete all products and auctions from the database
 * This will give you a clean slate to add your own data
 */

import { prisma } from '../lib/db/prisma';

async function cleanupAllData() {
  console.log('🧹 Starting database cleanup...\n');

  try {
    // Delete in the correct order to respect foreign key constraints
    
    console.log('1. Deleting bids...');
    const deletedBids = await prisma.bid.deleteMany({});
    console.log(`   ✅ Deleted ${deletedBids.count} bids`);

    console.log('2. Deleting watchlist items...');
    const deletedWatchlist = await prisma.watchlistItem.deleteMany({});
    console.log(`   ✅ Deleted ${deletedWatchlist.count} watchlist items`);

    console.log('3. Deleting auction views...');
    try {
      const deletedViews = await prisma.auctionView?.deleteMany({}) || { count: 0 };
      console.log(`   ✅ Deleted ${deletedViews.count} auction views`);
    } catch (error) {
      console.log('   ⚠️ AuctionView table not found (skipping)');
    }

    console.log('4. Deleting auction watchers...');
    try {
      const deletedWatchers = await prisma.auctionWatcher?.deleteMany({}) || { count: 0 };
      console.log(`   ✅ Deleted ${deletedWatchers.count} auction watchers`);
    } catch (error) {
      console.log('   ⚠️ AuctionWatcher table not found (skipping)');
    }

    console.log('5. Deleting auction activity...');
    try {
      const deletedActivity = await prisma.auctionActivity?.deleteMany({}) || { count: 0 };
      console.log(`   ✅ Deleted ${deletedActivity.count} auction activities`);
    } catch (error) {
      console.log('   ⚠️ AuctionActivity table not found (skipping)');
    }

    console.log('6. Deleting auctions...');
    const deletedAuctions = await prisma.auction.deleteMany({});
    console.log(`   ✅ Deleted ${deletedAuctions.count} auctions`);

    console.log('7. Deleting offers...');
    const deletedOffers = await prisma.offer.deleteMany({});
    console.log(`   ✅ Deleted ${deletedOffers.count} offers`);

    console.log('8. Deleting product images...');
    let deletedImages = { count: 0 };
    try {
      deletedImages = await prisma.productImage?.deleteMany({}) || { count: 0 };
      console.log(`   ✅ Deleted ${deletedImages.count} product images`);
    } catch (error) {
      console.log('   ⚠️ ProductImage table not found (skipping)');
    }

    console.log('9. Deleting products...');
    const deletedProducts = await prisma.product.deleteMany({});
    console.log(`   ✅ Deleted ${deletedProducts.count} products`);

    console.log('\n🎉 Database cleanup completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Products: ${deletedProducts.count}`);
    console.log(`   - Auctions: ${deletedAuctions.count}`);
    console.log(`   - Offers: ${deletedOffers.count}`);
    console.log(`   - Bids: ${deletedBids.count}`);
    console.log(`   - Watchlist items: ${deletedWatchlist.count}`);
    console.log(`   - Product images: ${deletedImages.count}`);

    console.log('\n✨ Your database is now clean and ready for new data!');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupAllData();