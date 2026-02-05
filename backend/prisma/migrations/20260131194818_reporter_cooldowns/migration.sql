-- AlterTable
ALTER TABLE "User" ADD COLUMN     "reportCooldownUntil" TIMESTAMP(3),
ALTER COLUMN "strikeUpdatedAt" DROP NOT NULL;
