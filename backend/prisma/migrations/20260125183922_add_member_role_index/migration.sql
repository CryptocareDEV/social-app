-- CreateIndex
CREATE INDEX "CommunityFeedItem_communityId_feedDate_rank_idx" ON "CommunityFeedItem"("communityId", "feedDate", "rank");

-- CreateIndex
CREATE INDEX "CommunityMember_communityId_role_idx" ON "CommunityMember"("communityId", "role");
