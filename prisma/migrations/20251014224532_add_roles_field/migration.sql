-- AlterTable
ALTER TABLE `client` ADD COLUMN `archivedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `roles` JSON NULL;
