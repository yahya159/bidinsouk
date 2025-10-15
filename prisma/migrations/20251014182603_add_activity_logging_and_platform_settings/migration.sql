/*
  Warnings:

  - You are about to alter the column `vendorId` on the `auditlog` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `BigInt`.
  - You are about to alter the column `vendorId` on the `messagethread` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `BigInt`.
  - You are about to alter the column `sellerId` on the `store` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `BigInt`.
  - The primary key for the `vendor` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `vendor` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `BigInt`.
  - You are about to alter the column `vendorId` on the `vendorsettings` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `BigInt`.
  - Added the required column `action` to the `AuditLog` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `auditlog` DROP FOREIGN KEY `AuditLog_vendorId_fkey`;

-- DropForeignKey
ALTER TABLE `messagethread` DROP FOREIGN KEY `MessageThread_vendorId_fkey`;

-- DropForeignKey
ALTER TABLE `store` DROP FOREIGN KEY `Store_sellerId_fkey`;

-- DropForeignKey
ALTER TABLE `vendorsettings` DROP FOREIGN KEY `VendorSettings_vendorId_fkey`;

-- DropIndex
DROP INDEX `AuditLog_vendorId_fkey` ON `auditlog`;

-- DropIndex
DROP INDEX `MessageThread_vendorId_fkey` ON `messagethread`;

-- DropIndex
DROP INDEX `Store_sellerId_fkey` ON `store`;

-- AlterTable
ALTER TABLE `auditlog` ADD COLUMN `action` VARCHAR(191) NOT NULL,
    ADD COLUMN `ipAddress` VARCHAR(45) NULL,
    ADD COLUMN `metadata` JSON NULL,
    ADD COLUMN `userAgent` TEXT NULL,
    MODIFY `diff` JSON NULL,
    MODIFY `vendorId` BIGINT NULL;

-- AlterTable
ALTER TABLE `messagethread` MODIFY `vendorId` BIGINT NULL;

-- AlterTable
ALTER TABLE `product` ADD COLUMN `views` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `store` MODIFY `sellerId` BIGINT NOT NULL;

-- AlterTable
ALTER TABLE `vendor` DROP PRIMARY KEY,
    MODIFY `id` BIGINT NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `vendorsettings` MODIFY `vendorId` BIGINT NOT NULL;

-- CreateTable
CREATE TABLE `PlatformSettings` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(191) NOT NULL,
    `value` JSON NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `updatedBy` BIGINT NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PlatformSettings_key_key`(`key`),
    INDEX `PlatformSettings_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `AuditLog_action_idx` ON `AuditLog`(`action`);

-- CreateIndex
CREATE INDEX `AuditLog_entity_idx` ON `AuditLog`(`entity`);

-- CreateIndex
CREATE INDEX `AuditLog_ipAddress_idx` ON `AuditLog`(`ipAddress`);

-- CreateIndex
CREATE INDEX `AuditLog_createdAt_idx` ON `AuditLog`(`createdAt`);

-- AddForeignKey
ALTER TABLE `Store` ADD CONSTRAINT `Store_sellerId_fkey` FOREIGN KEY (`sellerId`) REFERENCES `Vendor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MessageThread` ADD CONSTRAINT `MessageThread_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `Vendor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `Vendor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VendorSettings` ADD CONSTRAINT `VendorSettings_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `Vendor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
