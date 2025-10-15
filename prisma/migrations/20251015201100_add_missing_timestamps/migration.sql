-- Add missing timestamp fields to Store table only (migration 20251007111844 removed it)
ALTER TABLE `Store` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

