/*
  Warnings:

  - You are about to drop the column `respondedAt` on the `CommunityInvitation` table. All the data in the column will be lost.
  - Added the required column `expiresAt` to the `CommunityInvitation` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "CommunityInvitation_invitedUserId_idx";

-- DropIndex
DROP INDEX "CommunityInvitation_status_idx";

-- AlterTable
ALTER TABLE "CommunityInvitation" DROP COLUMN "respondedAt",
ADD COLUMN "expiresAt" TIMESTAMP(3);

-- 2. Backfill existing rows (7 days from createdAt)
UPDATE "CommunityInvitation"
SET "expiresAt" = "createdAt" + INTERVAL '7 days'
WHERE "expiresAt" IS NULL;

-- 3. Make column required
ALTER TABLE "CommunityInvitation"
ALTER COLUMN "expiresAt" SET NOT NULL;
