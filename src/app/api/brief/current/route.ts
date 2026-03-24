import { NextResponse } from "next/server";
import { getCurrentRoundSummary, getRoundState } from "@/lib/team-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const [currentRound, round] = await Promise.all([getCurrentRoundSummary(), getRoundState()]);

  return NextResponse.json({
    currentRound,
    round,
    subject: currentRound?.subject ?? null
  });
}
