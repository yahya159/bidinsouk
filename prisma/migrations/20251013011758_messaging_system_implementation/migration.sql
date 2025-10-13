/*
  Warnings:

  - The primary key for the `message` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `attachments` on the `message` table. All the data in the column will be lost.
  - You are about to drop the column `bodyMd` on the `message` table. All the data in the column will be lost.
  - The primary key for the `messagethread` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `clientId` on the `messagethread` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `messagethread` table. All the data in the column will be lost.
  - The values [PRODUCT,ORDER,SUPPORT] on the enum `MessageThread_type` will be removed. If these variants are still used in the database, this will fail.
  - The primary key for the `vendor` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `updatedAt` to the `Auction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `content` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `MessageThread` table without a default value. This is not possible if the table is not empty.
  - Made the column `lastMessageAt` on table `messagethread` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updatedAt` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `auction` DROP FOREIGN KEY `Auction_productId_fkey`;

-- DropForeignKey
ALTER TABLE `auditlog` DROP FOREIGN KEY `AuditLog_vendorId_fkey`;

-- DropForeignKey
ALTER TABLE `message` DROP FOREIGN KEY `Message_threadId_fkey`;

-- DropForeignKey
ALTER TABLE `messagethread` DROP FOREIGN KEY `MessageThread_clientId_fkey`;

-- DropForeignKey
ALTER TABLE `messagethread` DROP FOREIGN KEY `MessageThread_userId_fkey`;

-- DropForeignKey
ALTER TABLE `messagethread` DROP FOREIGN KEY `MessageThread_vendorId_fkey`;

-- DropForeignKey
ALTER TABLE `store` DROP FOREIGN KEY `Store_sellerId_fkey`;

-- DropIndex
DROP INDEX `Auction_productId_idx` ON `auction`;

-- DropIndex
DROP INDEX `AuditLog_vendorId_fkey` ON `auditlog`;

-- DropIndex
DROP INDEX `Message_threadId_idx` ON `message`;

-- DropIndex
DROP INDEX `MessageThread_clientId_fkey` ON `messagethread`;

-- DropIndex
DROP INDEX `MessageThread_userId_fkey` ON `messagethread`;

-- DropIndex
DROP INDEX `MessageThread_vendorId_fkey` ON `messagethread`;

-- DropIndex
DROP INDEX `Store_sellerId_idx` ON `store`;

-- AlterTable
ALTER TABLE `auction` ADD COLUMN `autoExtend` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `category` VARCHAR(191) NULL,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `duration` INTEGER NULL,
    ADD COLUMN `extendMinutes` INTEGER NOT NULL DEFAULT 5,
    ADD COLUMN `images` JSON NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    ADD COLUMN `views` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `watchers` INTEGER NOT NULL DEFAULT 0,
    MODIFY `productId` BIGINT NULL;

-- AlterTable
ALTER TABLE `auditlog` MODIFY `vendorId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `message` DROP PRIMARY KEY,
    DROP COLUMN `attachments`,
    DROP COLUMN `bodyMd`,
    ADD COLUMN `content` TEXT NOT NULL,
    ADD COLUMN `isRead` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `readAt` DATETIME(3) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `threadId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `messagethread` DROP PRIMARY KEY,
    DROP COLUMN `clientId`,
    DROP COLUMN `userId`,
    ADD COLUMN `category` ENUM('ORDER', 'PRODUCT', 'TECHNICAL', 'OTHER') NULL,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `orderId` BIGINT NULL,
    ADD COLUMN `priority` ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT') NOT NULL DEFAULT 'NORMAL',
    ADD COLUMN `productId` BIGINT NULL,
    ADD COLUMN `status` ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `type` ENUM('SUPPORT_TICKET', 'VENDOR_CHAT') NOT NULL,
    MODIFY `lastMessageAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `vendorId` VARCHAR(191) NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `product` ADD COLUMN `barcode` VARCHAR(191) NULL,
    ADD COLUMN `compareAtPrice` DECIMAL(12, 2) NULL,
    ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `images` JSON NULL,
    ADD COLUMN `inventory` JSON NULL,
    ADD COLUMN `price` DECIMAL(12, 2) NULL,
    ADD COLUMN `seoData` JSON NULL,
    ADD COLUMN `sku` VARCHAR(191) NULL,
    ADD COLUMN `tags` JSON NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    ADD COLUMN `variants` JSON NULL;

-- AlterTable
ALTER TABLE `store` MODIFY `sellerId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `vendor` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- CreateTable
CREATE TABLE `MessageThreadParticipant` (
    `id` VARCHAR(191) NOT NULL,
    `threadId` VARCHAR(191) NOT NULL,
    `userId` BIGINT NOT NULL,
    `role` ENUM('USER', 'VENDOR', 'ADMIN') NOT NULL DEFAULT 'USER',
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `MessageThreadParticipant_threadId_userId_key`(`threadId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MessageAttachment` (
    `id` VARCHAR(191) NOT NULL,
    `messageId` VARCHAR(191) NULL,
    `filename` VARCHAR(191) NOT NULL,
    `originalName` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `size` INTEGER NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `uploadedById` BIGINT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VendorSettings` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `vendorId` VARCHAR(191) NOT NULL,
    `storeSettings` JSON NULL,
    `accountSettings` JSON NULL,
    `notificationSettings` JSON NULL,
    `securitySettings` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `VendorSettings_vendorId_key`(`vendorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Store` ADD CONSTRAINT `Store_sellerId_fkey` FOREIGN KEY (`sellerId`) REFERENCES `Vendor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Auction` ADD CONSTRAINT `Auction_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MessageThread` ADD CONSTRAINT `MessageThread_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `Vendor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MessageThread` ADD CONSTRAINT `MessageThread_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MessageThread` ADD CONSTRAINT `MessageThread_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MessageThreadParticipant` ADD CONSTRAINT `MessageThreadParticipant_threadId_fkey` FOREIGN KEY (`threadId`) REFERENCES `MessageThread`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MessageThreadParticipant` ADD CONSTRAINT `MessageThreadParticipant_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_threadId_fkey` FOREIGN KEY (`threadId`) REFERENCES `MessageThread`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MessageAttachment` ADD CONSTRAINT `MessageAttachment_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `Message`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MessageAttachment` ADD CONSTRAINT `MessageAttachment_uploadedById_fkey` FOREIGN KEY (`uploadedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `Vendor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VendorSettings` ADD CONSTRAINT `VendorSettings_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `Vendor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
