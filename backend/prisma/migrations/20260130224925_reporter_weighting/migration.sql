-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "resolution" "ModerationOutcome",
ADD COLUMN     "resolvedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastReportAt" TIMESTAMP(3),
ADD COLUMN     "reportAccuracy" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
ADD COLUMN     "reportsConfirmed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reportsRejected" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reportsSubmitted" INTEGER NOT NULL DEFAULT 0;
