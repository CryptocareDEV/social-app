-- CreateTable
CREATE TABLE "CommunityFeedItem" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "feedDate" TIMESTAMP(3) NOT NULL,
    "rank" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityFeedItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommunityFeedItem_communityId_feedDate_idx" ON "CommunityFeedItem"("communityId", "feedDate");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityFeedItem_communityId_postId_feedDate_key" ON "CommunityFeedItem"("communityId", "postId", "feedDate");

-- AddForeignKey
ALTER TABLE "CommunityFeedItem" ADD CONSTRAINT "CommunityFeedItem_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityFeedItem" ADD CONSTRAINT "CommunityFeedItem_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
