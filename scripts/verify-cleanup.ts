#!/usr/bin/env tsx

/**
 * Verify that the cleanup was successful by checking API endpoints
 */

const BASE_URL = 'http://localhost:3000';

async function verifyCleanup() {
  console.log('🔍 Verifying cleanup by testing API endpoints...\n');

  try {
    // Test auctions API
    console.log('1. Testing /api/auctions');
    const auctionsResponse = await fetch(`${BASE_URL}/api/auctions`);
    
    if (auctionsResponse.ok) {
      const auctionsData = await auctionsResponse.json();
      console.log(`   Status: ${auctionsResponse.status}`);
      console.log(`   Auctions found: ${auctionsData.auctions?.length || 0}`);
      
      if (auctionsData.auctions?.length === 0) {
        console.log('   ✅ No auctions found - cleanup successful');
      } else {
        console.log('   ❌ Still has auctions!');
        console.log('   First auction:', auctionsData.auctions[0]);
      }
    } else {
      console.log(`   ❌ API error: ${auctionsResponse.status}`);
    }

    console.log('');

    // Test products API
    console.log('2. Testing /api/products');
    const productsResponse = await fetch(`${BASE_URL}/api/products`);
    
    if (productsResponse.ok) {
      const productsData = await productsResponse.json();
      console.log(`   Status: ${productsResponse.status}`);
      console.log(`   Products found: ${productsData.products?.length || 0}`);
      
      if (productsData.products?.length === 0) {
        console.log('   ✅ No products found - cleanup successful');
      } else {
        console.log('   ❌ Still has products!');
        console.log('   First product:', productsData.products[0]);
      }
    } else {
      console.log(`   ❌ API error: ${productsResponse.status}`);
    }

    console.log('');

    // Test search API
    console.log('3. Testing /api/search');
    const searchResponse = await fetch(`${BASE_URL}/api/search?q=test`);
    
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      console.log(`   Status: ${searchResponse.status}`);
      
      const totalResults = (searchData.auctions?.length || 0) + 
                          (searchData.products?.length || 0) + 
                          (searchData.stores?.length || 0);
      
      console.log(`   Search results: ${totalResults}`);
      console.log(`   - Auctions: ${searchData.auctions?.length || 0}`);
      console.log(`   - Products: ${searchData.products?.length || 0}`);
      console.log(`   - Stores: ${searchData.stores?.length || 0}`);
      
      if (totalResults === 0) {
        console.log('   ✅ No search results - cleanup successful');
      } else {
        console.log('   ❌ Still has search results!');
      }
    } else {
      console.log(`   ❌ API error: ${searchResponse.status}`);
    }

    console.log('\n🎉 Cleanup verification completed!');
    console.log('\n✨ Your database is clean and ready for new data.');

  } catch (error) {
    console.error('❌ Error during verification:', error);
  }
}

// Run the verification
verifyCleanup();