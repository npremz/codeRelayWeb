-- CreateEnum
CREATE TYPE "RoundPhase" AS ENUM ('DRAFT', 'REFLECTION', 'RELAY', 'PAUSED', 'COMPLETE');

-- CreateEnum
CREATE TYPE "TeamStatus" AS ENUM ('REGISTERED', 'READY', 'CODING', 'SUBMITTED', 'SCORED');

-- CreateTable
CREATE TABLE "Round" (
    "id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "registrationOpen" BOOLEAN NOT NULL DEFAULT true,
    "phase" "RoundPhase" NOT NULL DEFAULT 'DRAFT',
    "previousPhase" "RoundPhase",
    "phaseStartedAt" TIMESTAMP(3),
    "pausedElapsedMs" INTEGER,
    "reflectionMs" INTEGER NOT NULL DEFAULT 300000,
    "relaySliceMs" INTEGER NOT NULL DEFAULT 120000,
    "totalRelaySlices" INTEGER NOT NULL DEFAULT 12,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "teamCode" TEXT NOT NULL,
    "editTokenHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoundEntry" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "station" TEXT NOT NULL,
    "status" "TeamStatus" NOT NULL DEFAULT 'REGISTERED',
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoundEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoundScore" (
    "id" TEXT NOT NULL,
    "roundEntryId" TEXT NOT NULL,
    "correction" INTEGER NOT NULL DEFAULT 0,
    "edgeCases" INTEGER NOT NULL DEFAULT 0,
    "complexity" INTEGER NOT NULL DEFAULT 0,
    "readability" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoundScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Round_sequence_key" ON "Round"("sequence");

-- CreateIndex
CREATE INDEX "Round_isCurrent_idx" ON "Round"("isCurrent");

-- CreateIndex
CREATE INDEX "Round_createdAt_idx" ON "Round"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Team_teamCode_key" ON "Team"("teamCode");

-- CreateIndex
CREATE INDEX "Team_createdAt_idx" ON "Team"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_teamId_relayOrder_key" ON "TeamMember"("teamId", "relayOrder");

-- CreateIndex
CREATE INDEX "RoundEntry_roundId_createdAt_idx" ON "RoundEntry"("roundId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RoundEntry_roundId_teamId_key" ON "RoundEntry"("roundId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "RoundEntry_roundId_station_key" ON "RoundEntry"("roundId", "station");

-- CreateIndex
CREATE UNIQUE INDEX "RoundScore_roundEntryId_key" ON "RoundScore"("roundEntryId");

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundEntry" ADD CONSTRAINT "RoundEntry_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundEntry" ADD CONSTRAINT "RoundEntry_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundScore" ADD CONSTRAINT "RoundScore_roundEntryId_fkey" FOREIGN KEY ("roundEntryId") REFERENCES "RoundEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
