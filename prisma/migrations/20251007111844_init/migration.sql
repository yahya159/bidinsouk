/*
  Warnings:

  - You are about to alter the column `status` on the `abusereport` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(3))` to `Enum(EnumId(12))`.
  - You are about to drop the column `storeId` on the `archivefile` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `archivefile` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(5))` to `Enum(EnumId(13))`.
  - You are about to drop the column `createdAt` on the `auction` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `auction` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `auction` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(2))` to `Enum(EnumId(4))`.
  - You are about to drop the column `createdAt` on the `banner` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `banner` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `bid` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `bid` table. The data in that column could be lost. The data in that column will be cast from `Decimal(18,2)` to `Decimal(12,2)`.
  - You are about to drop the column `authorId` on the `message` table. All the data in the column will be lost.
  - You are about to drop the column `body` on the `message` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `messagethread` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `messagethread` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `messagethread` table. All the data in the column will be lost.
  - The values [product,order,support] on the enum `MessageThread_type` will be removed. If these variants are still used in the database, this will fail.
  - The values [order,auction,message,system] on the enum `Notification_type` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `updatedAt` on the `order` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `order` table. The data in that column could be lost. The data in that column will be cast from `VarChar(64)` to `Enum(EnumId(7))`.
  - You are about to drop the column `expiresAt` on the `orderrequest` table. All the data in the column will be lost.
  - You are about to drop the column `requestAt` on the `orderrequest` table. All the data in the column will be lost.
  - You are about to alter the column `source` on the `orderrequest` table. The data in that column could be lost. The data in that column will be cast from `VarChar(64)` to `Enum(EnumId(5))`.
  - You are about to alter the column `status` on the `orderrequest` table. The data in that column could be lost. The data in that column will be cast from `VarChar(64)` to `Enum(EnumId(6))`.
  - You are about to drop the column `updatedAt` on the `product` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `product` table. The data in that column could be lost. The data in that column will be cast from `VarChar(64)` to `Enum(EnumId(3))`.
  - You are about to drop the column `userId` on the `review` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `review` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(6))` to `Enum(EnumId(11))`.
  - You are about to drop the column `userId` on the `savedsearch` table. All the data in the column will be lost.
  - You are about to alter the column `query` on the `savedsearch` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Json`.
  - You are about to drop the column `updatedAt` on the `store` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `store` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(4))` to `Enum(EnumId(1))`.
  - You are about to drop the column `avatar` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerifiedAt` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `phoneVerifiedAt` on the `user` table. All the data in the column will be lost.
  - You are about to alter the column `phone` on the `user` table. The data in that column could be lost. The data in that column will be cast from `VarChar(64)` to `VarChar(32)`.
  - You are about to drop the `threadparticipant` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `watchlist` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[number]` on the table `Order` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `reporterId` to the `AbuseReport` table without a default value. This is not possible if the table is not empty.
  - Made the column `targetId` on table `abusereport` required. This step will fail if there are existing NULL values in that column.
  - Made the column `size` on table `archivefile` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `startPrice` to the `Auction` table without a default value. This is not possible if the table is not empty.
  - Made the column `currentBid` on table `auction` required. This step will fail if there are existing NULL values in that column.
  - Made the column `minIncrement` on table `auction` required. This step will fail if there are existing NULL values in that column.
  - Made the column `endAt` on table `auction` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `clientId` to the `Bid` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bodyMd` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senderId` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `MessageThread` table without a default value. This is not possible if the table is not empty.
  - Added the required column `number` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientId` to the `Review` table without a default value. This is not possible if the table is not empty.
  - Made the column `body` on table `review` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `clientId` to the `SavedSearch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `archivefile` DROP FOREIGN KEY `ArchiveFile_storeId_fkey`;

-- DropForeignKey
ALTER TABLE `bid` DROP FOREIGN KEY `Bid_userId_fkey`;

-- DropForeignKey
ALTER TABLE `message` DROP FOREIGN KEY `Message_authorId_fkey`;

-- DropForeignKey
ALTER TABLE `order` DROP FOREIGN KEY `Order_userId_fkey`;

-- DropForeignKey
ALTER TABLE `orderrequest` DROP FOREIGN KEY `OrderRequest_userId_fkey`;

-- DropForeignKey
ALTER TABLE `review` DROP FOREIGN KEY `Review_userId_fkey`;

-- DropForeignKey
ALTER TABLE `savedsearch` DROP FOREIGN KEY `SavedSearch_userId_fkey`;

-- DropForeignKey
ALTER TABLE `store` DROP FOREIGN KEY `Store_sellerId_fkey`;

-- DropForeignKey
ALTER TABLE `threadparticipant` DROP FOREIGN KEY `ThreadParticipant_threadId_fkey`;

-- DropForeignKey
ALTER TABLE `threadparticipant` DROP FOREIGN KEY `ThreadParticipant_userId_fkey`;

-- DropForeignKey
ALTER TABLE `watchlist` DROP FOREIGN KEY `Watchlist_userId_fkey`;

-- DropIndex
DROP INDEX `AuditLog_entity_entityId_idx` ON `auditlog`;

-- AlterTable
ALTER TABLE `abusereport` ADD COLUMN `reporterId` BIGINT NOT NULL,
    MODIFY `targetId` BIGINT NOT NULL,
    MODIFY `status` ENUM('OPEN', 'REVIEWING', 'RESOLVED', 'REJECTED') NOT NULL DEFAULT 'OPEN';

-- AlterTable
ALTER TABLE `archivefile` DROP COLUMN `storeId`,
    MODIFY `size` INTEGER NOT NULL,
    MODIFY `status` ENUM('ACTIVE', 'ARCHIVED', 'DELETED') NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE `auction` DROP COLUMN `createdAt`,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `reservePrice` DECIMAL(12, 2) NULL,
    ADD COLUMN `startAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `startPrice` DECIMAL(12, 2) NOT NULL,
    MODIFY `status` ENUM('SCHEDULED', 'RUNNING', 'ENDING_SOON', 'ENDED', 'ARCHIVED') NOT NULL DEFAULT 'SCHEDULED',
    MODIFY `currentBid` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    MODIFY `minIncrement` DECIMAL(12, 2) NOT NULL,
    MODIFY `endAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `auditlog` ADD COLUMN `vendorId` BIGINT NULL;

-- AlterTable
ALTER TABLE `banner` DROP COLUMN `createdAt`,
    DROP COLUMN `updatedAt`;

-- AlterTable
ALTER TABLE `bid` DROP COLUMN `userId`,
    ADD COLUMN `clientId` BIGINT NOT NULL,
    MODIFY `amount` DECIMAL(12, 2) NOT NULL;

-- AlterTable
ALTER TABLE `message` DROP COLUMN `authorId`,
    DROP COLUMN `body`,
    ADD COLUMN `bodyMd` VARCHAR(191) NOT NULL,
    ADD COLUMN `senderId` BIGINT NOT NULL;

-- AlterTable
ALTER TABLE `messagethread` DROP COLUMN `createdAt`,
    DROP COLUMN `status`,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `clientId` BIGINT NULL,
    ADD COLUMN `userId` BIGINT NOT NULL,
    ADD COLUMN `vendorId` BIGINT NULL,
    MODIFY `type` ENUM('PRODUCT', 'ORDER', 'SUPPORT') NOT NULL;

-- AlterTable
ALTER TABLE `notification` MODIFY `type` ENUM('ORDER', 'AUCTION', 'MESSAGE', 'SYSTEM') NOT NULL;

-- AlterTable
ALTER TABLE `order` DROP COLUMN `updatedAt`,
    ADD COLUMN `fulfillStatus` ENUM('PENDING', 'PREPARING', 'READY_FOR_PICKUP', 'SHIPPED', 'DELIVERED', 'CANCELED') NOT NULL DEFAULT 'PENDING',
    ADD COLUMN `number` VARCHAR(191) NOT NULL,
    ADD COLUMN `shipping` JSON NULL,
    ADD COLUMN `timeline` JSON NULL,
    ADD COLUMN `total` DECIMAL(12, 2) NOT NULL,
    MODIFY `status` ENUM('CONFIRMED', 'REFUSED', 'CANCELED_AFTER_CONFIRM') NOT NULL DEFAULT 'CONFIRMED';

-- AlterTable
ALTER TABLE `orderrequest` DROP COLUMN `expiresAt`,
    DROP COLUMN `requestAt`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `expressAt` DATETIME(3) NULL,
    ADD COLUMN `notes` VARCHAR(191) NULL,
    MODIFY `source` ENUM('BUY_NOW', 'AUCTION_CLAIM') NOT NULL,
    MODIFY `status` ENUM('REQUESTED', 'SELLER_ACCEPTED', 'SELLER_REFUSED', 'EXPIRED', 'CONVERTED') NOT NULL DEFAULT 'REQUESTED';

-- AlterTable
ALTER TABLE `product` DROP COLUMN `updatedAt`,
    ADD COLUMN `brand` VARCHAR(191) NULL,
    ADD COLUMN `category` VARCHAR(191) NULL,
    ADD COLUMN `condition` ENUM('NEW', 'USED') NOT NULL DEFAULT 'USED',
    MODIFY `status` ENUM('DRAFT', 'ACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE `review` DROP COLUMN `userId`,
    ADD COLUMN `clientId` BIGINT NOT NULL,
    MODIFY `body` VARCHAR(191) NOT NULL,
    MODIFY `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `savedsearch` DROP COLUMN `userId`,
    ADD COLUMN `clientId` BIGINT NOT NULL,
    MODIFY `query` JSON NOT NULL;

-- AlterTable
ALTER TABLE `store` DROP COLUMN `updatedAt`,
    ADD COLUMN `address` JSON NULL,
    ADD COLUMN `seo` JSON NULL,
    ADD COLUMN `socials` JSON NULL,
    MODIFY `phone` VARCHAR(191) NULL,
    MODIFY `status` ENUM('ACTIVE', 'SUSPENDED', 'PENDING') NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE `user` DROP COLUMN `avatar`,
    DROP COLUMN `emailVerifiedAt`,
    DROP COLUMN `phoneVerifiedAt`,
    ADD COLUMN `avatarUrl` VARCHAR(512) NULL,
    ADD COLUMN `password` VARCHAR(191) NOT NULL,
    MODIFY `phone` VARCHAR(32) NULL,
    MODIFY `locale` VARCHAR(191) NULL DEFAULT 'fr';

-- DropTable
DROP TABLE `threadparticipant`;

-- DropTable
DROP TABLE `watchlist`;

-- CreateTable
CREATE TABLE `Client` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `userId` BIGINT NOT NULL,

    UNIQUE INDEX `Client_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Vendor` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `userId` BIGINT NOT NULL,

    UNIQUE INDEX `Vendor_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Admin` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `userId` BIGINT NOT NULL,

    UNIQUE INDEX `Admin_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Offer` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `productId` BIGINT NOT NULL,
    `price` DECIMAL(12, 2) NOT NULL,
    `promoPct` INTEGER NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WatchlistItem` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `clientId` BIGINT NOT NULL,
    `productId` BIGINT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `WatchlistItem_clientId_productId_key`(`clientId`, `productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Order_number_key` ON `Order`(`number`);

-- AddForeignKey
ALTER TABLE `Client` ADD CONSTRAINT `Client_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Vendor` ADD CONSTRAINT `Vendor_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Admin` ADD CONSTRAINT `Admin_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Store` ADD CONSTRAINT `Store_sellerId_fkey` FOREIGN KEY (`sellerId`) REFERENCES `Vendor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bid` ADD CONSTRAINT `Bid_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Offer` ADD CONSTRAINT `Offer_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderRequest` ADD CONSTRAINT `OrderRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MessageThread` ADD CONSTRAINT `MessageThread_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MessageThread` ADD CONSTRAINT `MessageThread_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `Vendor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MessageThread` ADD CONSTRAINT `MessageThread_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WatchlistItem` ADD CONSTRAINT `WatchlistItem_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WatchlistItem` ADD CONSTRAINT `WatchlistItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AbuseReport` ADD CONSTRAINT `AbuseReport_reporterId_fkey` FOREIGN KEY (`reporterId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `Vendor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SavedSearch` ADD CONSTRAINT `SavedSearch_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
