#!/usr/bin/env tsx

/**
 * Force delete all auctions and related data
 */

import { prisma } from '../lib/db/prisma';

async function forceDeleteAuctions() {
  console.log('🔥 Force deleting all auctions and related data...\n');

  try {
    // First, let's see what's actually in the database
    console.log('📊 Current state:');
    
    const auctionCount = await prisma.auction.count();
    console.log(`   Auctions: ${auctionCount}`);
    
    const bidCount = await prisma.bid.count();
    console.log(`   Bids: ${bidCount}`);
    
    const productCount = await prisma.product.count();
    console.log(`   Products: ${productCount}`);
    
    const offerCount = await prisma.offer.count();
    console.log(`   Offers: ${offerCount}`);
    
    const watchlistCount = await prisma.watchlistItem.count();
    console.log(`   Watchlist: ${watchlistCount}`);

    console.log('\n🧹 Starting aggressive cleanup...\n');

    // Delete everything in the most aggressive way possible
    console.log('1. Force deleting all bids...');
    await prisma.$executeRaw`DELETE FROM bids`;
    console.log('   ✅ All bids deleted');

    console.log('2. Force deleting all watchlist items...');
    await prisma.$executeRaw`DELETE FROM watchlist_items`;
    console.log('   ✅ All watchlist items deleted');

    console.log('3. Force deleting all offers...');
    await prisma.$executeRaw`DELETE FROM offers`;
    console.log('   ✅ All offers deleted');

    console.log('4. Force deleting all auctions...');
    await prisma.$executeRaw`DELETE FROM auctions`;
    console.log('   ✅ All auctions deleted');

    console.log('5. Force deleting all products...');
    await prisma.$executeRaw`DELETE FROM products`;
    console.log('   ✅ All products deleted');

    // Try to delete from additional tables that might exist
    console.log('6. Cleaning additional tables...');
    
    try {
      await prisma.$executeRaw`DELETE FROM product_images`;
      console.log('   ✅ Product images deleted');
    } catch (error) {
      console.log('   ⚠️ Product images table not found');
    }

    try {
      await prisma.$executeRaw`DELETE FROM auction_views`;
      console.log('   ✅ Auction views deleted');
    } catch (error) {
      console.log('   ⚠️ Auction views table not found');
    }

    try {
      await prisma.$executeRaw`DELETE FROM auction_watchers`;
      console.log('   ✅ Auction watchers deleted');
    } catch (error) {
      console.log('   ⚠️ Auction watchers table not found');
    }

    try {
      await prisma.$executeRaw`DELETE FROM auction_activity`;
      console.log('   ✅ Auction activity deleted');
    } catch (error) {
      console.log('   ⚠️ Auction activity table not found');
    }

    console.log('\n🔍 Verifying cleanup...');
    
    const finalAuctionCount = await prisma.auction.count();
    const finalBidCount = await prisma.bid.count();
    const finalProductCount = await prisma.product.count();
    const finalOfferCount = await prisma.offer.count();
    const finalWatchlistCount = await prisma.watchlistItem.count();

    console.log(`   Auctions remaining: ${finalAuctionCount}`);
    console.log(`   Bids remaining: ${finalBidCount}`);
    console.log(`   Products remaining: ${finalProductCount}`);
    console.log(`   Offers remaining: ${finalOfferCount}`);
    console.log(`   Watchlist remaining: ${finalWatchlistCount}`);

    if (finalAuctionCount === 0 && finalBidCount === 0 && finalProductCount === 0) {
      console.log('\n🎉 SUCCESS: All auctions and products completely deleted!');
    } else {
      console.log('\n⚠️ WARNING: Some items may still remain');
    }

  } catch (error) {
    console.error('❌ Error during force cleanup:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the force cleanup
forceDeleteAuctions();