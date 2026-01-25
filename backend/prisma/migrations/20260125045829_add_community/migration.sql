-- CreateEnum
CREATE TYPE "CommunityScope" AS ENUM ('LOCAL', 'COUNTRY', 'GLOBAL');

-- CreateTable
CREATE TABLE "Community" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "intention" TEXT NOT NULL,
    "scope" "CommunityScope" NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Community_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityCategory" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "categoryKey" TEXT NOT NULL,

    CONSTRAINT "CommunityCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommunityCategory_categoryKey_idx" ON "CommunityCategory"("categoryKey");

-- AddForeignKey
ALTER TABLE "CommunityCategory" ADD CONSTRAINT "CommunityCategory_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
