-- Add comprehensive Vendor fields to match schema

-- Business Information
ALTER TABLE `Vendor` ADD COLUMN `businessName` VARCHAR(255) NULL;
ALTER TABLE `Vendor` ADD COLUMN `businessDescription` TEXT NULL;
ALTER TABLE `Vendor` ADD COLUMN `businessType` VARCHAR(50) NULL;

-- Contact Information
ALTER TABLE `Vendor` ADD COLUMN `phoneNumber` VARCHAR(32) NULL;
ALTER TABLE `Vendor` ADD COLUMN `businessEmail` VARCHAR(255) NULL;
ALTER TABLE `Vendor` ADD COLUMN `businessAddress` JSON NULL;

-- Legal Information
ALTER TABLE `Vendor` ADD COLUMN `taxId` VARCHAR(100) NULL;
ALTER TABLE `Vendor` ADD COLUMN `businessRegNumber` VARCHAR(100) NULL;

-- Banking (Encrypted)
ALTER TABLE `Vendor` ADD COLUMN `bankAccountNumber` VARCHAR(512) NULL;
ALTER TABLE `Vendor` ADD COLUMN `bankRoutingNumber` VARCHAR(512) NULL;
ALTER TABLE `Vendor` ADD COLUMN `bankAccountHolderName` VARCHAR(255) NULL;

-- Approval/Rejection
ALTER TABLE `Vendor` ADD COLUMN `approvedAt` DATETIME(3) NULL;
ALTER TABLE `Vendor` ADD COLUMN `approvedBy` BIGINT NULL;
ALTER TABLE `Vendor` ADD COLUMN `rejectedAt` DATETIME(3) NULL;
ALTER TABLE `Vendor` ADD COLUMN `rejectedBy` BIGINT NULL;
ALTER TABLE `Vendor` ADD COLUMN `rejectionReason` TEXT NULL;
ALTER TABLE `Vendor` ADD COLUMN `rejectionCategory` VARCHAR(50) NULL;

-- Suspension
ALTER TABLE `Vendor` ADD COLUMN `suspendedAt` DATETIME(3) NULL;
ALTER TABLE `Vendor` ADD COLUMN `suspensionReason` TEXT NULL;
ALTER TABLE `Vendor` ADD COLUMN `reinstatedAt` DATETIME(3) NULL;
ALTER TABLE `Vendor` ADD COLUMN `reinstatedBy` BIGINT NULL;

-- Documents
ALTER TABLE `Vendor` ADD COLUMN `documents` JSON NULL;
ALTER TABLE `Vendor` ADD COLUMN `documentsComplete` BOOLEAN NOT NULL DEFAULT FALSE;

-- Additional Info
ALTER TABLE `Vendor` ADD COLUMN `yearsInBusiness` INTEGER NULL;
ALTER TABLE `Vendor` ADD COLUMN `estimatedMonthlyVolume` VARCHAR(50) NULL;
ALTER TABLE `Vendor` ADD COLUMN `productCategories` JSON NULL;

-- Metadata
ALTER TABLE `Vendor` ADD COLUMN `tier` VARCHAR(50) NOT NULL DEFAULT 'BASIC';
ALTER TABLE `Vendor` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
ALTER TABLE `Vendor` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

-- Add indexes
CREATE INDEX IF NOT EXISTS `Vendor_status_idx` ON `Vendor`(`status`);
CREATE INDEX IF NOT EXISTS `Vendor_businessName_idx` ON `Vendor`(`businessName`);

