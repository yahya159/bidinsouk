#!/usr/bin/env tsx

/**
 * Complete cleanup of all products and auctions using correct Prisma models
 */

import { prisma } from '../lib/db/prisma';

async function completeCleanup() {
  console.log('🔥 Complete cleanup of all products and auctions...\n');

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

    const reviewCount = await prisma.review.count();
    console.log(`   Reviews: ${reviewCount}`);

    console.log('\n🧹 Starting complete cleanup...\n');

    // Delete in correct order to respect foreign keys
    console.log('1. Deleting all bids...');
    const deletedBids = await prisma.bid.deleteMany({});
    console.log(`   ✅ Deleted ${deletedBids.count} bids`);

    console.log('2. Deleting all reviews...');
    const deletedReviews = await prisma.review.deleteMany({});
    console.log(`   ✅ Deleted ${deletedReviews.count} reviews`);

    console.log('3. Deleting all watchlist items...');
    const deletedWatchlist = await prisma.watchlistItem.deleteMany({});
    console.log(`   ✅ Deleted ${deletedWatchlist.count} watchlist items`);

    console.log('4. Deleting all offers...');
    const deletedOffers = await prisma.offer.deleteMany({});
    console.log(`   ✅ Deleted ${deletedOffers.count} offers`);

    console.log('5. Deleting all auctions...');
    const deletedAuctions = await prisma.auction.deleteMany({});
    console.log(`   ✅ Deleted ${deletedAuctions.count} auctions`);

    console.log('6. Deleting all products...');
    const deletedProducts = await prisma.product.deleteMany({});
    console.log(`   ✅ Deleted ${deletedProducts.count} products`);

    // Also clean up any orders that might reference products
    console.log('7. Deleting all order requests...');
    const deletedOrderRequests = await prisma.orderRequest.deleteMany({});
    console.log(`   ✅ Deleted ${deletedOrderRequests.count} order requests`);

    console.log('8. Deleting all orders...');
    const deletedOrders = await prisma.order.deleteMany({});
    console.log(`   ✅ Deleted ${deletedOrders.count} orders`);

    console.log('\n🔍 Final verification...');
    
    const finalAuctionCount = await prisma.auction.count();
    const finalBidCount = await prisma.bid.count();
    const finalProductCount = await prisma.product.count();
    const finalOfferCount = await prisma.offer.count();
    const finalWatchlistCount = await prisma.watchlistItem.count();
    const finalReviewCount = await prisma.review.count();
    const finalOrderCount = await prisma.order.count();
    const finalOrderRequestCount = await prisma.orderRequest.count();

    console.log(`   Auctions: ${finalAuctionCount}`);
    console.log(`   Bids: ${finalBidCount}`);
    console.log(`   Products: ${finalProductCount}`);
    console.log(`   Offers: ${finalOfferCount}`);
    console.log(`   Watchlist: ${finalWatchlistCount}`);
    console.log(`   Reviews: ${finalReviewCount}`);
    console.log(`   Orders: ${finalOrderCount}`);
    console.log(`   Order Requests: ${finalOrderRequestCount}`);

    const totalRemaining = finalAuctionCount + finalBidCount + finalProductCount + 
                          finalOfferCount + finalWatchlistCount + finalReviewCount + 
                          finalOrderCount + finalOrderRequestCount;

    if (totalRemaining === 0) {
      console.log('\n🎉 SUCCESS: Database is completely clean!');
      console.log('✨ All products, auctions, and related data have been deleted.');
    } else {
      console.log(`\n⚠️ WARNING: ${totalRemaining} items still remain`);
    }

    console.log('\n📊 Summary of deleted items:');
    console.log(`   - Products: ${deletedProducts.count}`);
    console.log(`   - Auctions: ${deletedAuctions.count}`);
    console.log(`   - Bids: ${deletedBids.count}`);
    console.log(`   - Offers: ${deletedOffers.count}`);
    console.log(`   - Watchlist items: ${deletedWatchlist.count}`);
    console.log(`   - Reviews: ${deletedReviews.count}`);
    console.log(`   - Orders: ${deletedOrders.count}`);
    console.log(`   - Order requests: ${deletedOrderRequests.count}`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the complete cleanup
completeCleanup();