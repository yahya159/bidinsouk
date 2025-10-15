-- Performance Indexes for Bidinsouk Marketplace
-- This migration adds critical indexes to improve query performance

-- Auction indexes for filtering and sorting
CREATE INDEX IF NOT EXISTS `idx_auction_status` ON `Auction`(`status`);
CREATE INDEX IF NOT EXISTS `idx_auction_end_status` ON `Auction`(`endAt`, `status`);
CREATE INDEX IF NOT EXISTS `idx_auction_store` ON `Auction`(`storeId`);
CREATE INDEX IF NOT EXISTS `idx_auction_category` ON `Auction`(`category`);
CREATE INDEX IF NOT EXISTS `idx_auction_created` ON `Auction`(`createdAt` DESC);

-- Product indexes for filtering and sorting
CREATE INDEX IF NOT EXISTS `idx_product_status` ON `Product`(`status`);
CREATE INDEX IF NOT EXISTS `idx_product_store` ON `Product`(`storeId`);
CREATE INDEX IF NOT EXISTS `idx_product_category` ON `Product`(`category`);
CREATE INDEX IF NOT EXISTS `idx_product_created` ON `Product`(`createdAt` DESC);

-- Bid indexes for auction bid history
CREATE INDEX IF NOT EXISTS `idx_bid_auction_created` ON `Bid`(`auctionId`, `createdAt` DESC);
CREATE INDEX IF NOT EXISTS `idx_bid_client` ON `Bid`(`clientId`);
-- Bid.status column doesn't exist yet, index creation deferred
-- CREATE INDEX IF NOT EXISTS `idx_bid_status` ON `Bid`(`status`);
CREATE INDEX IF NOT EXISTS `idx_bid_created` ON `Bid`(`createdAt` DESC);

-- Store indexes
CREATE INDEX IF NOT EXISTS `idx_store_status` ON `Store`(`status`);
CREATE INDEX IF NOT EXISTS `idx_store_seller` ON `Store`(`sellerId`);

-- User relationship indexes
CREATE INDEX IF NOT EXISTS `idx_vendor_user` ON `Vendor`(`userId`);
CREATE INDEX IF NOT EXISTS `idx_client_user` ON `Client`(`userId`);
CREATE INDEX IF NOT EXISTS `idx_admin_user` ON `Admin`(`userId`);

-- Order indexes
CREATE INDEX IF NOT EXISTS `idx_order_status` ON `Order`(`status`);
CREATE INDEX IF NOT EXISTS `idx_order_user` ON `Order`(`userId`);
CREATE INDEX IF NOT EXISTS `idx_order_created` ON `Order`(`createdAt` DESC);

-- Notification indexes
CREATE INDEX IF NOT EXISTS `idx_notification_user_readat` ON `Notification`(`userId`, `readAt`);
CREATE INDEX IF NOT EXISTS `idx_notification_created` ON `Notification`(`createdAt` DESC);

-- Message indexes for real-time messaging
CREATE INDEX IF NOT EXISTS `idx_message_thread_created` ON `Message`(`threadId`, `createdAt` DESC);
CREATE INDEX IF NOT EXISTS `idx_message_sender` ON `Message`(`senderId`);

-- MessageThread indexes
-- Note: Thread schema uses participants model, indexes handled by unique constraints
-- CREATE INDEX IF NOT EXISTS `idx_messagethread_updated` ON `MessageThread`(`updatedAt` DESC);

-- Watchlist indexes
CREATE INDEX IF NOT EXISTS `idx_watchlist_user` ON `AuctionWatcher`(`userId`);
CREATE INDEX IF NOT EXISTS `idx_watchlist_auction` ON `AuctionWatcher`(`auctionId`);

-- Full-text search indexes (MySQL 5.7+ required)
-- Note: These may fail on older MySQL versions, that's okay
-- Uncomment if your MySQL version supports fulltext indexes
-- CREATE FULLTEXT INDEX `idx_product_search` ON `Product`(`title`, `description`);
-- CREATE FULLTEXT INDEX `idx_auction_search` ON `Auction`(`title`, `description`);
