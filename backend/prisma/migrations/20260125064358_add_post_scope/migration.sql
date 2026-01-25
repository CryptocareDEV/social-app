/*
  Warnings:

  - Added the required column `scope` to the `Post` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FeedScope" AS ENUM ('LOCAL', 'COUNTRY', 'GLOBAL');

-- AlterTable
ALTER TABLE "Post"
ADD COLUMN "scope" "FeedScope" NOT NULL DEFAULT 'GLOBAL';

-- CreateIndex
CREATE INDEX "Post_scope_idx" ON "Post"("scope");
