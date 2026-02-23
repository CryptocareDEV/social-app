BEGIN;
CREATE TYPE IF NOT EXISTS "CommentMediaType" AS ENUM (
  'IMAGE',
  'GIF',
  'VIDEO'
);


CREATE TABLE IF NOT EXISTS "Comment" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,

  "body" TEXT,
  "mediaUrl" TEXT,
  "mediaType" "CommentMediaType",

  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  "isRemoved" BOOLEAN NOT NULL DEFAULT false,
  "removedAt" TIMESTAMP(3),
  "removedBy" TEXT,
  "removedReason" TEXT,

  CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);


CREATE INDEX IF NOT EXISTS "Comment_postId_idx" ON "Comment"("postId");
CREATE INDEX IF NOT EXISTS "Comment_userId_idx" ON "Comment"("userId");
CREATE INDEX IF NOT EXISTS "Comment_createdAt_idx" ON "Comment"("createdAt");


ALTER TABLE "Comment"
  ADD CONSTRAINT "Comment_postId_fkey"
  FOREIGN KEY ("postId") REFERENCES "Post"("id")
  ON DELETE CASCADE;

ALTER TABLE "Comment"
  ADD CONSTRAINT "Comment_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE;

COMMIT; 