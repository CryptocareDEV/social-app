-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'REVOKED', 'EXPIRED');

-- CreateTable
CREATE TABLE "CommunityInvitation" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "invitedUserId" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "CommunityInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommunityInvitation_invitedUserId_idx" ON "CommunityInvitation"("invitedUserId");

-- CreateIndex
CREATE INDEX "CommunityInvitation_status_idx" ON "CommunityInvitation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityInvitation_communityId_invitedUserId_key" ON "CommunityInvitation"("communityId", "invitedUserId");

-- AddForeignKey
ALTER TABLE "CommunityInvitation" ADD CONSTRAINT "CommunityInvitation_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityInvitation" ADD CONSTRAINT "CommunityInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityInvitation" ADD CONSTRAINT "CommunityInvitation_invitedUserId_fkey" FOREIGN KEY ("invitedUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
