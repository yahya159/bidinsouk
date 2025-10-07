#!/bin/bash

# Quick API Test Script
# Tests basic endpoints to verify the server is working

echo "🧪 Quick API Test"
echo "=================="

BASE_URL="http://localhost:3000"

echo ""
echo "Testing: GET /"
curl -s -o /dev/null -w "Status: %{http_code}\n" $BASE_URL/

echo ""
echo "Testing: GET /api/products"
curl -s -o /dev/null -w "Status: %{http_code}\n" $BASE_URL/api/products

echo ""
echo "Testing: GET /api/stores"
curl -s -o /dev/null -w "Status: %{http_code}\n" $BASE_URL/api/stores

echo ""
echo "Testing: GET /api/auctions"
curl -s -o /dev/null -w "Status: %{http_code}\n" $BASE_URL/api/auctions

echo ""
echo "Testing: GET /api/search?q=test"
curl -s -o /dev/null -w "Status: %{http_code}\n" "$BASE_URL/api/search?q=test"

echo ""
echo "Testing: GET /api/admin/stats (should be 401 without auth)"
curl -s -o /dev/null -w "Status: %{http_code}\n" $BASE_URL/api/admin/stats

echo ""
echo "✅ Quick test completed!"

