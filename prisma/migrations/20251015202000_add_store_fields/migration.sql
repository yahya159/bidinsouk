-- Add missing Store fields to match schema

-- Media fields
ALTER TABLE `Store` ADD COLUMN `logo` VARCHAR(512) NULL;
ALTER TABLE `Store` ADD COLUMN `banner` VARCHAR(512) NULL;
ALTER TABLE `Store` ADD COLUMN `description` TEXT NULL;

-- Approval tracking fields
ALTER TABLE `Store` ADD COLUMN `approvedAt` DATETIME(3) NULL;
ALTER TABLE `Store` ADD COLUMN `approvedBy` BIGINT NULL;
ALTER TABLE `Store` ADD COLUMN `rejectedAt` DATETIME(3) NULL;
ALTER TABLE `Store` ADD COLUMN `rejectionReason` TEXT NULL;
ALTER TABLE `Store` ADD COLUMN `suspendedAt` DATETIME(3) NULL;
ALTER TABLE `Store` ADD COLUMN `deletedAt` DATETIME(3) NULL;

