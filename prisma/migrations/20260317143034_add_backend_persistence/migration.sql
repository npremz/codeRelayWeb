-- CreateEnum
CREATE TYPE "RoundPhase" AS ENUM ('DRAFT', 'REFLECTION', 'RELAY', 'PAUSED', 'COMPLETE');

-- CreateEnum
CREATE TYPE "TeamStatus" AS ENUM ('REGISTERED', 'READY', 'CODING', 'SUBMITTED', 'SCORED');

-- CreateTable
CREATE TABLE "RoundControl" (
    "id" TEXT NOT NULL,
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

    CONSTRAINT "RoundControl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "teamCode" TEXT NOT NULL,
    "editTokenHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "station" TEXT NOT NULL,
    "status" "TeamStatus" NOT NULL DEFAULT 'REGISTERED',
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),

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
CREATE TABLE "Score" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "correction" INTEGER NOT NULL DEFAULT 0,
    "edgeCases" INTEGER NOT NULL DEFAULT 0,
    "complexity" INTEGER NOT NULL DEFAULT 0,
    "readability" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Score_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Team_teamCode_key" ON "Team"("teamCode");

-- CreateIndex
CREATE INDEX "Team_createdAt_idx" ON "Team"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_teamId_relayOrder_key" ON "TeamMember"("teamId", "relayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Score_teamId_key" ON "Score"("teamId");

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
