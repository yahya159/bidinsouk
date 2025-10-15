-- Add status field to Vendor table for vendor approval workflow
ALTER TABLE `Vendor` ADD COLUMN `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED', 'EXPIRED') NOT NULL DEFAULT 'APPROVED';

