/*
  Warnings:

  - You are about to drop the column `description` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `label` on the `Category` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Category" DROP COLUMN "description",
DROP COLUMN "label",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
