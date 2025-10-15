-- AlterTable
ALTER TABLE `auction` MODIFY `status` ENUM('DRAFT', 'SCHEDULED', 'ACTIVE', 'RUNNING', 'ENDING_SOON', 'ENDED', 'CANCELLED', 'ARCHIVED') NOT NULL DEFAULT 'SCHEDULED';

-- CreateTable
CREATE TABLE `AuctionActivity` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `auctionId` BIGINT NOT NULL,
    `activityType` VARCHAR(50) NOT NULL,
    `userId` BIGINT NOT NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuctionActivity_auctionId_idx`(`auctionId`),
    INDEX `AuctionActivity_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuctionView` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `auctionId` BIGINT NOT NULL,
    `userId` BIGINT NULL,
    `ipAddress` VARCHAR(45) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuctionView_auctionId_idx`(`auctionId`),
    INDEX `AuctionView_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuctionWatcher` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `auctionId` BIGINT NOT NULL,
    `userId` BIGINT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuctionWatcher_auctionId_idx`(`auctionId`),
    INDEX `AuctionWatcher_userId_idx`(`userId`),
    UNIQUE INDEX `AuctionWatcher_auctionId_userId_key`(`auctionId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductImage` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `productId` BIGINT NOT NULL,
    `url` VARCHAR(512) NOT NULL,
    `altText` VARCHAR(255) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProductImage_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AuctionActivity` ADD CONSTRAINT `AuctionActivity_auctionId_fkey` FOREIGN KEY (`auctionId`) REFERENCES `Auction`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuctionView` ADD CONSTRAINT `AuctionView_auctionId_fkey` FOREIGN KEY (`auctionId`) REFERENCES `Auction`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuctionWatcher` ADD CONSTRAINT `AuctionWatcher_auctionId_fkey` FOREIGN KEY (`auctionId`) REFERENCES `Auction`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuctionWatcher` ADD CONSTRAINT `AuctionWatcher_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductImage` ADD CONSTRAINT `ProductImage_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
