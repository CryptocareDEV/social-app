-- CreateTable
CREATE TABLE "CommunityChat" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityChat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommunityChat_communityId_idx" ON "CommunityChat"("communityId");

-- AddForeignKey
ALTER TABLE "CommunityChat" ADD CONSTRAINT "CommunityChat_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityChat" ADD CONSTRAINT "CommunityChat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
