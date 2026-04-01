-- CreateEnum
CREATE TYPE "TvDisplayMode" AS ENUM ('LIVE', 'REGISTRATION_QR');

-- AlterTable
ALTER TABLE "Round"
ADD COLUMN "tvDisplayMode" "TvDisplayMode" NOT NULL DEFAULT 'LIVE';
