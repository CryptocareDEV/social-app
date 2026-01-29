-- CreateEnum
CREATE TYPE "ContentRating" AS ENUM ('SAFE', 'NSFW');

-- AlterTable
ALTER TABLE "Community" ADD COLUMN     "rating" "ContentRating" NOT NULL DEFAULT 'SAFE';

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "communityId" TEXT,
ADD COLUMN     "isCommunityOnly" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rating" "ContentRating" NOT NULL DEFAULT 'SAFE';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "cooldownUntil" TIMESTAMP(3),
ADD COLUMN     "isBanned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nsfwStrikes" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Community_rating_idx" ON "Community"("rating");

-- CreateIndex
CREATE INDEX "Post_communityId_idx" ON "Post"("communityId");

-- CreateIndex
CREATE INDEX "Post_rating_idx" ON "Post"("rating");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE SET NULL ON UPDATE CASCADE;
