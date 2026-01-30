/*
  Governance + Labels migration
  Safe backfill for existing data
*/

-- ============================
-- ENUMS
-- ============================

CREATE TYPE "LabelScope" AS ENUM ('GLOBAL', 'COUNTRY', 'LOCAL');
CREATE TYPE "PostOriginType" AS ENUM ('USER', 'COMMUNITY');
CREATE TYPE "LabelImportMode" AS ENUM ('SAFE_ONLY', 'NSFW_ONLY', 'BOTH');
CREATE TYPE "ReportReason" AS ENUM (
  'NSFW_EXPOSURE',
  'MINOR_SAFETY',
  'HARASSMENT',
  'HATE',
  'VIOLENCE',
  'SPAM',
  'MISINFORMATION',
  'OTHER'
);
CREATE TYPE "ModerationOutcome" AS ENUM ('NO_ACTION', 'LIMITED', 'REMOVED', 'ESCALATED');
CREATE TYPE "ModeratorActorType" AS ENUM ('USER', 'MODERATOR', 'SUPERUSER');
CREATE TYPE "SuperuserRole" AS ENUM ('MODERATOR', 'ADMIN', 'LEGAL');

-- ============================
-- CATEGORY: ADD scope SAFELY
-- ============================

-- 1️⃣ Add columns as nullable
ALTER TABLE "Category"
ADD COLUMN "scope" "LabelScope",
ADD COLUMN "countryCode" TEXT;

-- 2️⃣ Backfill existing categories
UPDATE "Category"
SET "scope" = 'GLOBAL'
WHERE "scope" IS NULL;

-- 3️⃣ Enforce NOT NULL
ALTER TABLE "Category"
ALTER COLUMN "scope" SET NOT NULL;

-- ============================
-- POST: ORIGIN TRACEABILITY
-- ============================

ALTER TABLE "Post"
ADD COLUMN "originCommunityId" TEXT,
ADD COLUMN "originType" "PostOriginType" NOT NULL DEFAULT 'USER';

-- ============================
-- USER: DATE OF BIRTH (SAFE DEV BACKFILL)
-- ============================

-- 1️⃣ Add columns as nullable
ALTER TABLE "User"
ADD COLUMN "dateOfBirth" TIMESTAMP(3),
ADD COLUMN "dobMethod" TEXT,
ADD COLUMN "dobVerifiedAt" TIMESTAMP(3);

-- 2️⃣ Backfill existing users (DEV DEFAULT → ADULT)
UPDATE "User"
SET "dateOfBirth" = '1990-01-01'
WHERE "dateOfBirth" IS NULL;

-- 3️⃣ Enforce NOT NULL
ALTER TABLE "User"
ALTER COLUMN "dateOfBirth" SET NOT NULL;

-- ============================
-- COMMUNITY LABEL IMPORTS
-- ============================

CREATE TABLE "CommunityLabelImport" (
  "id" TEXT NOT NULL,
  "communityId" TEXT NOT NULL,
  "categoryKey" TEXT NOT NULL,
  "importMode" "LabelImportMode" NOT NULL,

  CONSTRAINT "CommunityLabelImport_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CommunityLabelImport_communityId_categoryKey_key"
ON "CommunityLabelImport"("communityId", "categoryKey");

CREATE INDEX "CommunityLabelImport_communityId_idx"
ON "CommunityLabelImport"("communityId");

ALTER TABLE "CommunityLabelImport"
ADD CONSTRAINT "CommunityLabelImport_communityId_fkey"
FOREIGN KEY ("communityId") REFERENCES "Community"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommunityLabelImport"
ADD CONSTRAINT "CommunityLabelImport_categoryKey_fkey"
FOREIGN KEY ("categoryKey") REFERENCES "Category"("key")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================
-- REPORTING & MODERATION
-- ============================

CREATE TABLE "Report" (
  "id" TEXT NOT NULL,
  "reporterId" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "reason" "ReportReason" NOT NULL,
  "context" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Report_postId_idx" ON "Report"("postId");
CREATE INDEX "Report_reporterId_idx" ON "Report"("reporterId");

ALTER TABLE "Report"
ADD CONSTRAINT "Report_reporterId_fkey"
FOREIGN KEY ("reporterId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Report"
ADD CONSTRAINT "Report_postId_fkey"
FOREIGN KEY ("postId") REFERENCES "Post"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ModerationAction" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "outcome" "ModerationOutcome" NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ModerationAction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ModerationAction_postId_idx"
ON "ModerationAction"("postId");

ALTER TABLE "ModerationAction"
ADD CONSTRAINT "ModerationAction_postId_fkey"
FOREIGN KEY ("postId") REFERENCES "Post"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ModerationLog" (
  "id" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "actorType" "ModeratorActorType" NOT NULL,
  "action" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ModerationLog_pkey" PRIMARY KEY ("id")
);

-- ============================
-- SUPERUSER (PLATFORM STAFF)
-- ============================

CREATE TABLE "Superuser" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "SuperuserRole" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Superuser_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Superuser_userId_key"
ON "Superuser"("userId");

ALTER TABLE "Superuser"
ADD CONSTRAINT "Superuser_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
